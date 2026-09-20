# Painted Drop

Gofile-style file drop for **Painted JB** ([discord.gg/paintedjb](https://discord.gg/paintedjb)).

- Drag & drop upload (max 50 MB)
- Public share links (Supabase Storage)
- Recent drops list with copy link
- Optional Discord name on upload

## Stack

- Next.js 14
- Supabase Storage bucket `drops` + table `public.drops`

## Env

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
