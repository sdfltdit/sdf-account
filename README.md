# SDF Clothing — Invoice Admin

Internal admin panel for managing invoices, clients, and payment tracking.

---

## Stack
- **Next.js 14** (static export)
- **Supabase** — database + auth
- **Cloudflare Pages** — hosting

---

## Setup Guide

### Step 1 — Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. Go to **Authentication → Users** → Add User → add your email + password
4. Go to **Project Settings → API** → copy:
   - Project URL
   - anon / public key

### Step 2 — GitHub

1. Create a new **private** repository on GitHub
2. Upload all these files (drag & drop or use GitHub web UI)
3. Create a file called `.env.local` (copy from `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   ⚠️ **Do NOT commit `.env.local`** — it's in `.gitignore`

### Step 3 — Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Create application → Pages
2. Connect GitHub → select your repo
3. Build settings:
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `npm run build`
   - **Output directory**: `out`
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Deploy!

---

## Pages

| Page | URL | What it does |
|------|-----|-------------|
| Login | `/login` | Sign in with Supabase auth |
| Dashboard | `/dashboard` | Overview stats + recent invoices |
| Invoices | `/invoices` | Full list with filter/search |
| Invoice Detail | `/invoices/[id]` | View + update status |
| New Invoice | `/new-invoice` | Create sample/correction/bulk invoice |
| Clients | `/clients` | Client list + add new |
| Payments | `/payments` | Payment tracking with progress bars |

---

## Updating

To update the app, just edit files on GitHub — Cloudflare Pages will auto-redeploy.
