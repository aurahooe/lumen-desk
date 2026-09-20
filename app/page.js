"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "blue", label: "Blue" },
  { id: "purple", label: "Purple" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
];

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
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pd-theme") : null;
    if (saved && THEMES.some((t) => t.id === saved)) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("pd-theme", theme);
    } catch {}
  }, [theme]);

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
      setCopied(url);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setErr("Could not copy — select the link manually.");
    }
  }

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <a className="nav-brand" href="/">
            <span className="nav-mark" />
            Painted Drop
          </a>
          <div className="nav-actions">
            <div className="theme-pills" role="group" aria-label="Color theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-pill ${theme === t.id ? "on" : ""}`}
                  data-t={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={theme === t.id}
                />
              ))}
            </div>
            <a
              className="btn btn-primary"
              href="https://discord.gg/paintedjb"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord
            </a>
          </div>
        </div>
      </nav>

      <main className="main">
        <section className="hero">
          <p className="eyebrow">File sharing</p>
          <h1>
            Drop a file.
            <br />
            <span className="hero-accent">Share the link.</span>
          </h1>
          <p className="subtitle">
            A quiet place to host art, clips, and dumps for the Painted JB community.
            Public links that work in Discord.
          </p>
        </section>

        <section
          className={`drop ${drag ? "drag" : ""} ${uploading ? "busy" : ""}`}
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
          <div className="drop-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 16V4m0 0L7 9m5-5l5 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="drop-title">
            {uploading ? progress || "Uploading…" : "Drag and drop files here"}
          </p>
          <p className="drop-hint">or click to browse · up to 50 MB · images, video, zip, pdf</p>
        </section>

        <div className="field">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Discord name (optional)"
            maxLength={32}
            aria-label="Discord name"
          />
        </div>

        {err && <p className="msg msg-error">{err}</p>}

        {lastLink && (
          <div className="share">
            <div className="share-text">
              <span className="share-label">Ready to share</span>
              <code>{lastLink}</code>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => copyLink(lastLink)}
            >
              {copied === lastLink ? "Copied" : "Copy link"}
            </button>
          </div>
        )}

        <section className="files">
          <div className="files-head">
            <h2>Recent</h2>
            <button type="button" className="btn-text" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading && files.length === 0 ? (
            <p className="empty">Loading…</p>
          ) : files.length === 0 ? (
            <p className="empty">No files yet. Yours can be the first.</p>
          ) : (
            <ul className="file-list">
              {files.map((f) => {
                const url = publicUrl(f.path);
                const isImg = (f.mime || "").startsWith("image/");
                return (
                  <li key={f.id} className="file-card">
                    <div className="file-thumb">
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" />
                      ) : (
                        <span className="file-glyph">📄</span>
                      )}
                    </div>
                    <div className="file-info">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="file-name">
                        {f.name}
                      </a>
                      <span className="file-meta">
                        {formatBytes(f.size)}
                        {f.author ? ` · ${f.author}` : ""} · {ago(f.created_at)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => copyLink(url)}
                    >
                      {copied === url ? "Copied" : "Copy"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Painted Drop · for the community</span>
        <a href="https://discord.gg/paintedjb" target="_blank" rel="noopener noreferrer">
          discord.gg/paintedjb
        </a>
      </footer>
    </div>
  );
}
