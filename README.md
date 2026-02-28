# Gmail Summarizer

AI-powered Gmail client that reads, summarizes, and acts on your emails.

**Stack:** React + Node.js/Express + Supabase + OpenAI + Gmail API

## Architecture

```
┌─────────────┐      ┌─────────────────┐      ┌──────────────┐
│   React UI  │─────▶│  Express API    │─────▶│  Gmail API   │
│  (Vite)     │      │  (3 routes)     │      │              │
└──────┬──────┘      └──────┬──────────┘      └──────────────┘
       │                    │
       │                    ▼
       │             ┌──────────────┐      ┌──────────────┐
       └────────────▶│  Supabase    │      │  OpenAI API  │
                     │  Auth + DB   │      │  (summaries) │
                     └──────────────┘      └──────────────┘
```

### Backend APIs (only 3 essential routes)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/emails` | Fetch inbox emails (with cached summaries) |
| POST | `/api/emails/:id/summarize` | Summarize a single email |
| POST | `/api/emails/summarize-all` | Batch summarize emails |
| POST | `/api/actions/execute` | Run AI instruction on an email |
| POST | `/api/actions/reply` | Send a reply via Gmail |

### Frontend → Supabase Direct (no backend needed)

- **Auth** — Supabase Google OAuth (handles login/signup/session)
- **Activity Logs** — Read via Supabase client with RLS
- **User Profile** — Managed by Supabase Auth

## Documentation

| Guide | Description |
|-------|-------------|
| [Deploy Checklist](DEPLOY_CHECKLIST.md) | **Start here** — everything to configure before deploying |
| [Google Auth Setup](docs/GOOGLE_AUTH_SETUP.md) | Step-by-step Google OAuth & Gmail API credentials |
| [Deployment Guide](docs/DEPLOYMENT.md) | Detailed hosting options (Vercel, Render, Railway) |

## Quick Start (Local Development)

### 1. Google & Supabase Setup
Follow [docs/GOOGLE_AUTH_SETUP.md](docs/GOOGLE_AUTH_SETUP.md) to create credentials, then configure Supabase.

### 2. Database
Run `supabase/schema.sql` in your Supabase SQL Editor.

### 3. Backend
```bash
cd backend
cp .env.example .env    # Fill in all values (see comments in file)
npm install
npm run dev             # Runs on http://localhost:3001
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env    # Fill in Supabase URL + anon key
npm install
npm run dev             # Runs on http://localhost:5173
```

### 5. Deploy (Everything Free)

```bash
# Complete DEPLOY_CHECKLIST.md first, then:
chmod +x deploy.sh
./deploy.sh
```

Deploys both frontend AND backend to **Vercel free tier**. Zero cost (except ~$0.01/50 summaries on OpenAI).

See [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) for what to configure before running.

## Features

- ✅ Google OAuth via Supabase (handles Gmail token)
- ✅ Fetch inbox emails with Gmail API
- ✅ AI-powered email summarization (priority, category, action items)
- ✅ Execute custom instructions on emails
- ✅ Send replies directly from the app
- ✅ Suggested AI replies
- ✅ Summary caching in Supabase
- ✅ Activity logging
- ✅ Gmail search queries
- ✅ Dark theme UI
- ✅ Responsive design
