"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

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
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whispers")
      .select("id, body, author, created_at")
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) {
      console.error(error);
      setErr("Could not reach the board.");
    } else {
      setItems(data || []);
      setErr("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 45000);
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
    });
    if (error) {
      setErr(error.message || "Could not send.");
    } else {
      setBody("");
      await load();
    }
    setSubmitting(false);
  }

  return (
    <div className="frame">
      <header className="header">
        <div className="brand">
          <span className="dot" aria-hidden />
          <h1>Whisper</h1>
        </div>
        <p className="tagline">A public wall of short notes about this moment.</p>
      </header>

      <form className="compose" onSubmit={onSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What are you noticing right now?"
          maxLength={280}
          rows={3}
        />
        <div className="compose-bar">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Name (optional)"
            maxLength={32}
          />
          <span className="chars">{body.length}/280</span>
          <button type="submit" disabled={submitting || !body.trim()}>
            {submitting ? "…" : "Send"}
          </button>
        </div>
        {err && <p className="error">{err}</p>}
      </form>

      <section className="feed" aria-live="polite">
        {loading && items.length === 0 ? (
          <p className="empty">Listening…</p>
        ) : items.length === 0 ? (
          <p className="empty">Quiet for now. Be the first whisper.</p>
        ) : (
          items.map((w, i) => (
            <article
              key={w.id}
              className="whisper"
              style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
            >
              <p className="text">{w.body}</p>
              <div className="meta">
                <span>{w.author ? w.author : "anonymous"}</span>
                <span className="sep">·</span>
                <time dateTime={w.created_at}>{ago(w.created_at)}</time>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="foot">
        <span>{items.length} whispers</span>
        <span>visible on every device</span>
      </footer>
    </div>
  );
}
