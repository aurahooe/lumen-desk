const USERS = "ld_users_v1";
const SESSION = "ld_session_v1";
const NOTES = "ld_notes_v1";
const WALL = "ld_wall_v1";

async function digest(pass, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 120000 },
    key,
    256
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSession() {
  return read(SESSION, null);
}
export function signOut() {
  localStorage.removeItem(SESSION);
}

export async function register(username, password) {
  const name = username.trim().toLowerCase();
  if (name.length < 3) throw new Error("Name needs at least 3 letters.");
  if (password.length < 6) throw new Error("Password needs at least 6 characters.");
  const users = read(USERS, []);
  if (users.some((u) => u.username === name)) throw new Error("That desk is already claimed.");
  const salt = crypto.randomUUID();
  const hash = await digest(password, salt);
  users.push({ username: name, salt, hash, createdAt: new Date().toISOString() });
  write(USERS, users);
  write(SESSION, { username: name, since: Date.now() });
  return getSession();
}

export async function login(username, password) {
  const name = username.trim().toLowerCase();
  const users = read(USERS, []);
  const user = users.find((u) => u.username === name);
  if (!user) throw new Error("No desk under that name.");
  const hash = await digest(password, user.salt);
  if (hash !== user.hash) throw new Error("Wrong key for this desk.");
  write(SESSION, { username: name, since: Date.now() });
  return getSession();
}

export function listMyNotes(username) {
  return read(NOTES, []).filter((n) => n.author === username).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listWall() {
  const local = read(WALL, []);
  const seeded = [
    {
      id: "seed-1",
      author: "iris",
      body: "Left the window open. The room smells like rain on warm stone.",
      createdAt: "2026-09-20T08:12:00.000Z",
    },
    {
      id: "seed-2",
      author: "nolen",
      body: "If you find this: the espresso on the corner is better after two.",
      createdAt: "2026-09-20T10:41:00.000Z",
    },
  ];
  const map = new Map();
  [...seeded, ...local].forEach((n) => map.set(n.id, n));
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveNote(username, body, isPublic) {
  const text = body.trim();
  if (!text) throw new Error("Write something first.");
  const note = {
    id: crypto.randomUUID(),
    author: username,
    body: text,
    public: !!isPublic,
    createdAt: new Date().toISOString(),
  };
  const notes = read(NOTES, []);
  notes.push(note);
  write(NOTES, notes);
  if (note.public) {
    const wall = read(WALL, []);
    wall.push({ id: note.id, author: note.author, body: note.body, createdAt: note.createdAt });
    write(WALL, wall);
  }
  return note;
}
