"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, login, register, listMyNotes, saveNote, signOut } from "../../lib/store";

export default function Desk() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) setNotes(listMyNotes(s.username));
  }, []);

  async function onAuth(e) {
    e.preventDefault();
    setErr("");
    try {
      const s = mode === "login" ? await login(username, password) : await register(username, password);
      setSession(s);
      setNotes(listMyNotes(s.username));
      setPassword("");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  function onSave(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    try {
      saveNote(session.username, body, isPublic);
      setNotes(listMyNotes(session.username));
      setBody("");
      setOk(isPublic ? "Pinned to the wall and saved to your desk." : "Kept private on this desk.");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="mark">
          <Link href="/"><b>Lumen Desk</b></Link>
          <span>your blotter</span>
        </div>
        <nav className="nav">
          <Link href="/">The wall</Link>
          {session && (
            <button className="ghost" onClick={() => { signOut(); setSession(null); setNotes([]); }}>Lock</button>
          )}
        </nav>
      </header>
      {!session ? (
        <section className="panel" style={{ maxWidth: 460, marginTop: 40 }}>
          <p className="kicker">{mode === "login" ? "Return" : "Claim a desk"}</p>
          <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 32, marginBottom: 8 }}>
            {mode === "login" ? "Unlock your desk" : "Take a quiet seat"}
          </h2>
          <p style={{ color: "#3a3228", marginBottom: 8 }}>
            Passwords are stretched with PBKDF2 and stay in this browser. Notes marked public appear on the wall for anyone who opens the site here.
          </p>
          <form onSubmit={onAuth}>
            <label>Desk name</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            <label>Key</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {err && <p className="error">{err}</p>}
            <div className="row">
              <button className="solid" type="submit">{mode === "login" ? "Unlock" : "Claim desk"}</button>
              <button className="ghost" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
                {mode === "login" ? "I need a new desk" : "I already have one"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="panel" style={{ marginTop: 32 }}>
            <p className="kicker">Signed in as @{session.username}</p>
            <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 32 }}>Leave a note</h2>
            <form onSubmit={onSave}>
              <label>The page</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ink first. Edit later." />
              <label className="check">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Pin this to the public wall
              </label>
              {err && <p className="error">{err}</p>}
              {ok && <p className="ok">{ok}</p>}
              <div className="row">
                <button className="solid" type="submit">Save to desk</button>
              </div>
            </form>
          </section>
          <section className="wall">
            <h3>Your pages</h3>
            {notes.length === 0 ? (
              <p className="empty">Blank blotter. Write the first line.</p>
            ) : (
              <div className="grid">
                {notes.map((n) => (
                  <article className="card" key={n.id}>
                    <div className="who">{n.public ? "public" : "private"}</div>
                    <div className="body">{n.body}</div>
                    <div className="when">{new Date(n.createdAt).toLocaleString()}</div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
