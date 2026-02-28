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

## Setup

### 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Google** and enable it
   - Add your Google OAuth Client ID and Secret
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Run `supabase/schema.sql` in the SQL Editor
4. Copy your project URL and keys

### 2. Google Cloud Console

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Gmail API**
3. Create OAuth 2.0 credentials (Web application)
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Add scopes: `gmail.readonly`, `gmail.send`
5. Copy Client ID and Secret → use in both Supabase Google provider AND backend `.env`

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in all values
npm install
npm run dev
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in Supabase URL, anon key, API URL
npm install
npm run dev
```

### 5. Deploy (Cloud)

**Frontend:** Deploy to Vercel/Netlify
```bash
cd frontend && npm run build
# Upload dist/ folder
```

**Backend:** Deploy to Railway/Render/Fly.io
```bash
cd backend
# Set environment variables on your platform
# Deploy
```

**Environment Variables for Production:**
- Update `FRONTEND_URL` in backend to your deployed frontend URL
- Update `VITE_API_URL` in frontend to your deployed backend URL
- Update Google OAuth redirect URIs

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
