"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dispatch from "../data/dispatch.json";
import { getSession, listWall, signOut } from "../lib/store";

function ago(iso) {
  const t = new Date(iso).getTime();
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [wall, setWall] = useState([]);

  useEffect(() => {
    setSession(getSession());
    setWall(listWall());
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="mark">
          <b>Lumen Desk</b>
          <span>hourly board</span>
        </div>
        <nav className="nav">
          <Link href="/desk">Your desk</Link>
          {session ? (
            <>
              <span style={{ fontSize: 13, color: "#7a6e5b" }}>{session.username}</span>
              <button className="ghost" onClick={() => { signOut(); setSession(null); }}>Lock</button>
            </>
          ) : (
            <Link className="solid" href="/desk">Sit down</Link>
          )}
        </nav>
      </header>
      <section className="hero">
        <div>
          <p className="kicker">Edition {dispatch.edition} · refreshed on the hour</p>
          <h1>A quiet room that keeps the hour.</h1>
          <p className="lede">Write at your desk. Keep a note private, or pin it to the public wall. The dispatch on the right changes every hour.</p>
        </div>
        <aside className="dispatch">
          <p className="kicker">Today&apos;s dispatch</p>
          <h2>{dispatch.headline}</h2>
          <p>{dispatch.body}</p>
          <div className="pulses">
            {dispatch.pulses.map((p) => (
              <span className="chip" key={p.label}>{p.label}: {p.value}</span>
            ))}
          </div>
        </aside>
      </section>
      <section className="wall">
        <h3>The wall</h3>
        <div className="grid">
          {wall.map((n, i) => (
            <article className="card" key={n.id} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="who">@{n.author}</div>
              <div className="body">{n.body}</div>
              <div className="when">{ago(n.createdAt)}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
