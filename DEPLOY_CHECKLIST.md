# Pre-Deployment Checklist

Complete these steps **before** running `deploy.sh`.

---

## 1. Create Accounts (all free)

- [ ] [Supabase](https://supabase.com) — Sign up (GitHub login works)
- [ ] [Vercel](https://vercel.com) — Sign up (GitHub login works)
- [ ] [Google Cloud Console](https://console.cloud.google.com) — Sign in with Google
- [ ] [OpenAI](https://platform.openai.com) — Sign up and add $5 credits (pay-per-use)

---

## 2. Supabase Setup

1. [ ] Create a **New Project** → pick a name and region
2. [ ] Wait for it to provision (~2 min)
3. [ ] Go to **SQL Editor** → paste contents of `supabase/migrations/20260228065903_initial_schema.sql` → **Run**
4. [ ] Go to **Settings → API** and copy:
   - [ ] **Project URL** → save as `SUPABASE_URL`
   - [ ] **anon public key** → save as `VITE_SUPABASE_ANON_KEY`
   - [ ] **service_role key** → save as `SUPABASE_SERVICE_KEY`

---

## 3. Google OAuth + Gmail API

Follow [docs/GOOGLE_AUTH_SETUP.md](docs/GOOGLE_AUTH_SETUP.md) for detailed steps. Quick summary:

1. [ ] Create a Google Cloud project
2. [ ] Enable **Gmail API** in API Library
3. [ ] Configure **OAuth consent screen** (External)
   - Add scopes: `gmail.readonly`, `gmail.send`, `userinfo.email`, `userinfo.profile`
   - Add your email as test user
4. [ ] Create **OAuth 2.0 Client ID** (Web application)
   - Authorized JavaScript Origins:
     ```
     http://localhost:5173
     ```
   - Authorized Redirect URIs:
     ```
     https://<your-supabase-ref>.supabase.co/auth/v1/callback
     ```
5. [ ] Copy:
   - [ ] **Client ID** → save as `GOOGLE_CLIENT_ID`
   - [ ] **Client Secret** → save as `GOOGLE_CLIENT_SECRET`

---

## 4. Connect Google to Supabase

1. [ ] In Supabase → **Authentication** → **Providers** → **Google**
2. [ ] Toggle **Enable**
3. [ ] Paste your Google Client ID and Client Secret
4. [ ] Click **Save**

---

## 5. Get OpenAI API Key

1. [ ] Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. [ ] Create a new key → save as `OPENAI_API_KEY`

---

## 6. Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

---

## 7. Create Your .env Files

### `backend/.env`
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...your-service-key
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
OPENAI_API_KEY=sk-xxxxx
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
VITE_API_URL=http://localhost:3001/api
```

---

## 8. Run Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 9. Post-Deployment Updates

After deployment, you'll get URLs for both frontend and backend. Update:

1. [ ] **Google Cloud Console** → OAuth Client → add your Vercel frontend URL to Authorized JavaScript Origins
2. [ ] **Vercel backend** → update `FRONTEND_URL` env var to your frontend URL
3. [ ] **Vercel frontend** → update `VITE_API_URL` env var to your backend URL + `/api`

The `deploy.sh` script will guide you through all of this.
