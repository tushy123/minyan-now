# Minyan Now — Claude Context

## Project Overview
- **Stack:** Next.js 16, TypeScript, Supabase (auth + DB), Tailwind, Vercel
- **Repo:** `tushy123/minyan-now` (main branch, auto-deploys to Vercel)
- **Local dev:** `npm run dev` → http://localhost:3000

## Features Built
- Google sign-in (Supabase auth)
- Friends system
- Calendar view
- Dark/light theme toggle
- Online users indicator
- Zmanim
- Map view
- Alerts
- PWA support
- Address autocomplete
- Minyan page with members list and tappable user profiles

## Changelog

### 2026-02-23
- Created this CLAUDE.md file to track changes going forward
- Changed default max distance from 100 miles to Unlimited (Infinity) so all minyanim worldwide are shown by default
- Replaced distance slider in FilterModal with preset buttons: 1 mi, 5 mi, 10 mi, 25 mi, 50 mi, Unlimited
- Updated filter logic in `useMinyanim.ts` to use `Infinity` as the unlimited sentinel
- Added `.distance-presets` / `.distance-preset-btn` CSS styles in `globals.css`

### Prior (from git history)
- `40d2cac` — Add members list to minyan page with tappable user profiles
- `209f4b8` — Add address autocomplete and faster polling
- `3b2815e` — Fix Vercel build: prevent auth/callback prerender and harden Supabase init
- `b124acc` — Fix build crash when Supabase env vars are missing
- `a7f4e80` — Add friends, calendar, theme, and online users features
- `c5cc264` — Initial commit
