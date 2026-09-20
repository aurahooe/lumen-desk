# Lumen Shelf

A public shared link & resource dump. Anyone can drop a useful link with an optional note. Everything lives in a real database, so it shows on every device (phone, laptop, tablet).

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres) for public links
- Fully responsive

## Setup (required once)

### 1. Create a free Supabase project

1. Go to [https://supabase.com](https://supabase.com) → New project
2. Copy the **Project URL** and **anon public** key (Settings → API)

### 2. Create the table

In the Supabase SQL editor, run:

```sql
create table public.links (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  note text,
  author text,
  created_at timestamptz not null default now()
);

-- Allow anyone to read and insert (public shelf)
alter table public.links enable row level security;

create policy "Public read"
  on public.links for select
  using (true);

create policy "Public insert"
  on public.links for insert
  with check (true);
```

### 3. Environment variables

Copy `.env.example` → `.env.local` (local) and also add the same values in the **Vercel project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Pushes to `main` auto-deploy on Vercel. Make sure the two `NEXT_PUBLIC_SUPABASE_*` env vars are set in the Vercel dashboard (Production + Preview).
