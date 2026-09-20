"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const KINDS = [
  { id: "wip", label: "WIP" },
  { id: "feedback", label: "Feedback" },
  { id: "tip", label: "Tip" },
  { id: "collab", label: "Collab" },
  { id: "status", label: "Status" },
];

const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.id, k.label]));

function ago(iso) {
  const t = new Date(iso).getTime();
  const sec = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState("wip");
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whispers")
      .select("id, body, author, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) {
      console.error(error);
      setErr("Could not load the board.");
    } else {
      setItems(data || []);
      setErr("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 40000);
    return () => clearInterval(id);
  }, [load]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const text = body.trim();
    if (!text) {
      setErr("Write something first.");
      return;
    }
    if (text.length > 280) {
      setErr("Keep it under 280 characters.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("whispers").insert({
      body: text,
      author: author.trim() || null,
      kind,
    });
    if (error) {
      setErr(error.message || "Could not post.");
    } else {
      setBody("");
      await load();
    }
    setSubmitting(false);
  }

  const shown =
    filter === "all" ? items : items.filter((i) => (i.kind || "status") === filter);

  return (
    <div className="frame">
      <header className="header">
        <div className="brand-row">
          <div className="brand">
            <span className="dot" aria-hidden />
            <h1>Painted Board</h1>
          </div>
          <a
            className="discord-btn"
            href="https://discord.gg/paintedjb"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Discord
          </a>
        </div>
        <p className="tagline">
          Companion board for <strong>Painted JB</strong> — share WIPs, ask for feedback, drop tips, find collabs.
        </p>
      </header>

      <form className="compose" onSubmit={onSubmit}>
        <div className="kind-row">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`chip ${kind === k.id ? "on" : ""}`}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === "wip"
              ? "What are you painting / animating right now?"
              : kind === "feedback"
              ? "What do you want eyes on?"
              : kind === "tip"
              ? "Share a quick tip…"
              : kind === "collab"
              ? "Looking for…"
              : "Quick status for the server…"
          }
          maxLength={280}
          rows={3}
        />
        <div className="compose-bar">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Discord name"
            maxLength={32}
          />
          <span className="chars">{body.length}/280</span>
          <button type="submit" disabled={submitting || !body.trim()}>
            {submitting ? "…" : "Post"}
          </button>
        </div>
        {err && <p className="error">{err}</p>}
      </form>

      <div className="filters">
        <button
          type="button"
          className={`chip ${filter === "all" ? "on" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`chip ${filter === k.id ? "on" : ""}`}
            onClick={() => setFilter(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>

      <section className="feed" aria-live="polite">
        {loading && items.length === 0 ? (
          <p className="empty">Loading board…</p>
        ) : shown.length === 0 ? (
          <p className="empty">Nothing here yet. Be the first to post.</p>
        ) : (
          shown.map((w, i) => (
            <article
              key={w.id}
              className="card"
              style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
            >
              <div className="card-top">
                <span className={`tag tag-${w.kind || "status"}`}>
                  {KIND_LABEL[w.kind] || "Status"}
                </span>
                <time dateTime={w.created_at}>{ago(w.created_at)}</time>
              </div>
              <p className="text">{w.body}</p>
              <div className="meta">{w.author ? w.author : "anonymous"}</div>
            </article>
          ))
        )}
      </section>

      <footer className="foot">
        <span>{items.length} posts</span>
        <a href="https://discord.gg/paintedjb" target="_blank" rel="noopener noreferrer">
          discord.gg/paintedjb
        </a>
      </footer>
    </div>
  );
}
