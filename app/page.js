"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

function formatBytes(n) {
  if (!n || n < 1024) return `${n || 0} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ago(iso) {
  const t = new Date(iso).getTime();
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

function publicUrl(path) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/drops/${path}`;
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState("");
  const [lastLink, setLastLink] = useState("");
  const [author, setAuthor] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("drops")
      .select("id, name, path, size, mime, author, created_at")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) {
      console.error(error);
      setErr("Could not load drops.");
    } else {
      setFiles(data || []);
      setErr("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadOne(file) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    setProgress(`Uploading ${file.name}…`);
    const { error: upErr } = await supabase.storage.from("drops").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) throw upErr;

    const { error: dbErr } = await supabase.from("drops").insert({
      name: file.name,
      path,
      size: file.size,
      mime: file.type || null,
      author: author.trim() || null,
    });
    if (dbErr) throw dbErr;

    return publicUrl(path);
  }

  async function handleFiles(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setErr("");
    setLastLink("");
    setUploading(true);
    try {
      let link = "";
      for (const f of arr) {
        if (f.size > 50 * 1024 * 1024) {
          throw new Error(`${f.name} is over 50 MB.`);
        }
        link = await uploadOne(f);
      }
      setLastLink(link);
      setProgress("");
      await load();
    } catch (e) {
      console.error(e);
      setErr(e.message || "Upload failed.");
      setProgress("");
    }
    setUploading(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      setProgress("Link copied.");
      setTimeout(() => setProgress(""), 1500);
    } catch {
      setErr("Could not copy — select the link manually.");
    }
  }

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="logo">Painted Drop</span>
          <span className="sub">for discord.gg/paintedjb</span>
        </div>
        <a className="discord" href="https://discord.gg/paintedjb" target="_blank" rel="noopener noreferrer">
          Join Discord
        </a>
      </header>

      <section className="hero">
        <p className="kicker">file hosting</p>
        <h1>drop a file.<br />share the link.</h1>
        <p className="lede">
          Upload art, clips, or dumps for the Painted JB server. Get a public link that works in Discord.
        </p>
      </section>

      <div
        className={`dropzone ${drag ? "active" : ""} ${uploading ? "busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dz-icon">↑</div>
        <p className="dz-title">{uploading ? progress || "Uploading…" : "Drag & drop files here"}</p>
        <p className="dz-sub">or click to select · max 50 MB · images, video, zip, pdf</p>
      </div>

      <div className="author-row">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Discord name (optional)"
          maxLength={32}
        />
      </div>

      {err && <p className="error">{err}</p>}
      {lastLink && (
        <div className="share-box">
          <span className="share-label">Share link</span>
          <code className="share-url">{lastLink}</code>
          <button type="button" onClick={() => copyLink(lastLink)}>
            Copy
          </button>
        </div>
      )}

      <section className="list">
        <div className="list-head">
          <h2>Recent drops</h2>
          <button type="button" className="ghost" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
        {loading && files.length === 0 ? (
          <p className="empty">Loading…</p>
        ) : files.length === 0 ? (
          <p className="empty">No files yet. Drop the first one.</p>
        ) : (
          <ul>
            {files.map((f) => {
              const url = publicUrl(f.path);
              const isImg = (f.mime || "").startsWith("image/");
              return (
                <li key={f.id} className="row">
                  <div className="thumb">
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" />
                    ) : (
                      <span className="file-ico">📄</span>
                    )}
                  </div>
                  <div className="meta">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="name">
                      {f.name}
                    </a>
                    <span className="detail">
                      {formatBytes(f.size)}
                      {f.author ? ` · ${f.author}` : ""} · {ago(f.created_at)}
                    </span>
                  </div>
                  <button type="button" className="copy" onClick={() => copyLink(url)}>
                    Copy
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="foot">
        <span>Public drops for Painted JB</span>
        <a href="https://discord.gg/paintedjb" target="_blank" rel="noopener noreferrer">
          discord.gg/paintedjb
        </a>
      </footer>
    </div>
  );
}
