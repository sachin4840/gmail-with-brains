# Deployment Guide — Free Hosting

## Architecture

```
Frontend (Vercel - Free)  →  Backend (Render - Free)  →  Gmail API
         ↓                          ↓                     
    Supabase (Free)           Supabase (Free)          OpenAI API
    (Auth + DB reads)         (DB writes)              (pay-per-use)
```

## Cost Breakdown

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | Free | 100GB bandwidth/month |
| **Render** | Free | Free | Spins down after 15min inactivity, 750hrs/month |
| **Supabase** | Free | Free | 500MB DB, 50K auth users, 2GB bandwidth |
| **OpenAI** | Pay-as-you-go | ~$0.15/1M tokens (gpt-4o-mini) | Very cheap for email summaries |

> **Note:** Render free tier spins down after 15 min of no requests. First request after sleep takes ~30-50 seconds. For always-on, use Render Starter ($7/mo) or Railway ($5/mo).

---

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Pick a name, set a database password, choose a region
3. Wait for project to provision (~2 min)

### Enable Google Auth Provider
1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable**
3. Enter your Google Client ID and Client Secret (see [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md))
4. Note the **Callback URL** shown — you'll need it for Google Console:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

### Run Database Schema
1. Go to **SQL Editor** → **New Query**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**
4. Verify tables exist under **Table Editor**

### Get Your Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY` (frontend)
   - **service_role secret key** → `SUPABASE_SERVICE_KEY` (backend only, never expose!)

---

## Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) → Sign up (GitHub login works)
2. Click **New** → **Web Service**
3. Connect your GitHub repo: `sachin4840/gmail-with-brains`
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `gmail-summarizer-api` |
| **Region** | Pick closest to you |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

5. Add **Environment Variables** (under "Environment"):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-key
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```

> ⚠️ Leave `FRONTEND_URL` as placeholder for now — update after deploying frontend.

6. Click **Deploy Web Service**
7. Note your backend URL: `https://gmail-summarizer-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up (GitHub login works)
2. Click **Add New** → **Project**
3. Import `sachin4840/gmail-with-brains`
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Add **Environment Variables**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://gmail-summarizer-api.onrender.com/api
```

6. Click **Deploy**
7. Note your frontend URL: `https://your-app.vercel.app`

---

## Step 4: Update Cross-References

### Update Render (Backend)
1. Go to Render dashboard → your service → **Environment**
2. Update `FRONTEND_URL` to your Vercel URL (e.g., `https://gmail-with-brains.vercel.app`)
3. Render will auto-redeploy

### Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client
3. Add to **Authorized JavaScript Origins**:
   ```
   https://your-app.vercel.app
   ```
4. Add to **Authorized Redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

---

## Step 5: Test

1. Open your Vercel URL
2. Click "Sign in with Google"
3. Authorize Gmail access
4. Your inbox should load
5. Click "Summarize" on any email

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Backend takes 30+ seconds** | Normal on Render free tier (cold start). Wait for it. |
| **401 Unauthorized** | Google token expired. Sign out and sign in again. |
| **CORS errors** | Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash). |
| **Google OAuth error** | Check redirect URI matches Supabase callback URL exactly. |
| **Summaries fail** | Check OpenAI API key is valid and has credits. |
| **"Missing Google access token"** | The provider token wasn't captured. Sign out, clear localStorage, sign in again. |

---

## Alternative: Deploy Backend to Railway (Recommended)

Railway gives **$5 free credits** on signup (no credit card). No cold starts — much better UX than Render free tier.

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select `sachin4840/gmail-with-brains`
4. Railway auto-detects the app. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Start Command** | `node server.js` |

5. Go to **Variables** tab, add all env vars:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-key
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```

6. Go to **Settings** → **Networking** → **Generate Domain**
7. Your backend URL: `https://gmail-with-brains-production.up.railway.app`
8. Update `VITE_API_URL` in Vercel with this URL

### Railway vs Render (Free Tier Comparison)

| | Railway | Render |
|--|---------|--------|
| **Cost** | $5 free credits (then pay-as-you-go) | Truly free (750hrs/mo) |
| **Cold starts** | ❌ None — always warm | ✅ Yes — 30-50s after 15min idle |
| **Speed** | Fast | Slow on free tier |
| **Credit card** | Not required initially | Not required |
| **Best for** | Demo/testing (credits last ~1 month) | Long-term free hosting |

---

## Alternative Free Hosts

| Service | Type | Notes |
|---------|------|-------|
| **Fly.io** | Backend | 3 shared VMs free, needs Dockerfile |
| **Cyclic.sh** | Backend | Serverless, no cold starts, 100K requests/mo |
| **Netlify** | Frontend | Alternative to Vercel, similar features |
| **Cloudflare Pages** | Frontend | Unlimited bandwidth, very fast |
