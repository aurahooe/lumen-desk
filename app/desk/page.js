"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function handleFromEmail(email) {
  const raw = (email || "reader").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  const base = raw.slice(0, 18) || "reader";
  return base.length >= 3 ? base : `${base}desk`;
}

export default function Desk() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      if (data.user) {
        ensureProfile(data.user);
        loadNotes(data.user.id);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        ensureProfile(u);
        loadNotes(u.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function ensureProfile(u) {
    const handle = handleFromEmail(u.email);
    await supabase.from("profiles").upsert(
      {
        id: u.id,
        handle,
        display_name: handle,
      },
      { onConflict: "id" }
    );
  }

  async function loadNotes(uid) {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  }

  async function auth(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const fn =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
    const { data, error } = await fn;
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (mode === "signup" && data?.user && !data.session) {
      setErr("Check your inbox to confirm the desk, then sign in.");
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    setBusy(true);
    await ensureProfile(user);
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      is_public: isPublic,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setTitle("");
    setBody("");
    setIsPublic(false);
    loadNotes(user.id);
  }

  async function toggle(note) {
    await supabase
      .from("notes")
      .update({ is_public: !note.is_public, updated_at: new Date().toISOString() })
      .eq("id", note.id);
    loadNotes(user.id);
  }

  async function remove(id) {
    await supabase.from("notes").delete().eq("id", id);
    loadNotes(user.id);
  }

  return (
    <div className="wrap">
      <header className="mast">
        <div className="wordmark">
          Paper<em>hour</em>
        </div>
        <div className="mast-meta">{user ? user.email : "Unsigned"}</div>
      </header>
      <nav className="nav">
        <a href="/">Front</a>
        <a href="/desk">Desk</a>
        {user && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              supabase.auth.signOut();
            }}
          >
            Sign out
          </a>
        )}
      </nav>
      {!user ? (
        <section className="panel">
          <div className="kicker">{mode === "signup" ? "Open a desk" : "Return"}</div>
          <h1 className="lead" style={{ fontSize: 42 }}>
            Your pages stay until you publish them.
          </h1>
          <form onSubmit={auth}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {err && <p className="err">{err}</p>}
            <div className="row">
              <button disabled={busy}>
                {busy ? "Working…" : mode === "signup" ? "Create desk" : "Sign in"}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "I already have one" : "Need a desk"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="panel">
            <div className="kicker">New page</div>
            <form onSubmit={save}>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              <label>Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
              <label className="check">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Mark public — it will appear on the front
              </label>
              {err && <p className="err">{err}</p>}
              <div className="row">
                <button disabled={busy}>Keep this</button>
              </div>
            </form>
          </section>
          <div className="kicker">Your pages</div>
          <div className="desk-list">
            {notes.length === 0 && <p>Nothing on the desk yet.</p>}
            {notes.map((n) => (
              <div className="desk-item" key={n.id}>
                <div>
                  <strong>{n.title}</strong>
                  <p style={{ margin: "6px 0 0" }}>{n.body}</p>
                </div>
                <div className="row" style={{ margin: 0 }}>
                  <span className="pill">{n.is_public ? "Public" : "Private"}</span>
                  <button type="button" className="ghost" onClick={() => toggle(n)}>
                    {n.is_public ? "Hide" : "Publish"}
                  </button>
                  <button type="button" className="ghost" onClick={() => remove(n.id)}>
                    Burn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
