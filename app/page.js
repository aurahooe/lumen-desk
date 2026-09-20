"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function ago(iso) {
  const t = new Date(iso).getTime();
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Home() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("links")
      .select("id, url, note, author, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error(error);
      setErr("Could not load the shelf. Check Supabase setup.");
    } else {
      setLinks(data || []);
      setErr("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setSubmitting(true);

    let finalUrl = url.trim();
    if (!finalUrl) {
      setErr("Paste a link first.");
      setSubmitting(false);
      return;
    }
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      new URL(finalUrl);
    } catch {
      setErr("That does not look like a valid URL.");
      setSubmitting(false);
      return;
    }

    const payload = {
      url: finalUrl,
      note: note.trim() || null,
      author: author.trim() || null,
    };

    const { error } = await supabase.from("links").insert(payload);
    if (error) {
      setErr(error.message || "Could not save the link.");
    } else {
      setOk("Added to the shelf.");
      setUrl("");
      setNote("");
      await load();
    }
    setSubmitting(false);
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? links.filter(
        (l) =>
          (l.note || "").toLowerCase().includes(q) ||
          (l.author || "").toLowerCase().includes(q) ||
          (l.url || "").toLowerCase().includes(q) ||
          hostFromUrl(l.url).includes(q)
      )
    : links;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="mark">
          <b>Lumen Shelf</b>
          <span>shared links</span>
        </div>
        <div className="nav">
          <span className="count">{links.length} on the shelf</span>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="kicker">Public resource dump</p>
          <h1>Drop useful links. Find them later on any device.</h1>
          <p className="lede">
            A simple shared shelf. Paste a URL, add a short note if you want, and it appears for everyone — phone, laptop, or tablet.
          </p>
        </div>

        <form className="panel submit" onSubmit={onSubmit}>
          <p className="kicker">Add to the shelf</p>
          <label>Link</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            autoComplete="url"
          />
          <label>Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why is this useful?"
            maxLength={280}
          />
          <label>Your name (optional)</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Anonymous is fine"
            maxLength={40}
          />
          {err && <p className="error">{err}</p>}
          {ok && <p className="ok">{ok}</p>}
          <div className="row">
            <button className="solid" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Put on shelf"}
            </button>
          </div>
        </form>
      </section>

      <section className="wall">
        <div className="wall-head">
          <h3>The shelf</h3>
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, sites, or names…"
          />
        </div>

        {loading ? (
          <p className="empty">Loading the shelf…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">
            {q ? "No matches." : "Shelf is empty. Be the first to add something useful."}
          </p>
        ) : (
          <div className="grid">
            {filtered.map((l, i) => (
              <article className="card" key={l.id} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <a className="url" href={l.url} target="_blank" rel="noopener noreferrer">
                  {hostFromUrl(l.url)}
                </a>
                {l.note && <div className="body">{l.note}</div>}
                <div className="meta">
                  <span className="who">{l.author ? `@${l.author}` : "anonymous"}</span>
                  <span className="when">{ago(l.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
