# Whisper

A public wall of short notes about this moment.
Anyone can leave a whisper. They appear for everyone, on every device.

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres)
- Fully responsive

## Database

Table `whispers`:

```sql
create table public.whispers (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 280),
  author text,
  created_at timestamptz not null default now()
);
```

Public read + insert via RLS.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Local

```bash
npm install
npm run dev
```
