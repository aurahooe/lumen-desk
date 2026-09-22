"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function pad(n) { return String(n).padStart(2, "0"); }

const FALLBACK = {
  headline: "The desk is open.",
  editorial: "Nothing public has been featured yet. Leave a note. If it is meant to be seen, mark it public.",
};

export default function Home() {
  const [now, setNow] = useState(new Date());
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    load();
    const poll = setInterval(load, 60 * 1000);
    return () => {
      sub.subscription.unsubscribe();
      clearInterval(poll);
    };
  }, []);

  async function load() {
    const { data: hours } = await supabase.from("hours").select("*").order("slot", { ascending: false }).limit(1);
    setHour(hours?.[0] || null);
    const { data: publicNotes } = await supabase
      .from("notes")
      .select("id,title,body,created_at,user_id")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(24);
    setNotes(publicNotes || []);
  }

  const remainMin = 60 - now.getMinutes();
  const spent = (now.getMinutes() * 60 + now.getSeconds()) / 3600;

  return (
    <div className="wrap">
      <header className="mast">
        <div className="wordmark">Paper<em>hour</em></div>
        <div className="mast-meta">Vol. I · Public reading room</div>
      </header>
      <nav className="nav">
        <a href="/">Front</a>
        <a href="/desk">{user ? "Your desk" : "Sign in"}</a>
      </nav>
      <section className="hero">
        <div>
          <div className="kicker">This hour</div>
          <h1 className="lead">A quiet board for things<br />worth keeping.</h1>
          <p className="lead-copy">Write privately. Mark a piece public when it should be seen. Every hour the room turns over and one piece is set on the table.</p>
        </div>
        <div className="clock">
          <strong>{pad(now.getHours())}:{pad(now.getMinutes())}</strong>
          <span>{remainMin} minutes until the next turn</span>
        </div>
      </section>
      <div className="hourbar" style={{ "--spent": spent }}><i /></div>
      <article className="hour-card">
        <div className="kicker">Featured dispatch</div>
        <h2>{hour?.headline || FALLBACK.headline}</h2>
        <p>{hour?.editorial || FALLBACK.editorial}</p>
      </article>
      <div className="kicker" style={{ marginBottom: 12 }}>Public notes</div>
      {notes.length === 0 ? (
        <p>The public table is empty. Be the first to set something down.</p>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <article className="note" key={n.id}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <div className="who">{new Date(n.created_at).toLocaleString()}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
