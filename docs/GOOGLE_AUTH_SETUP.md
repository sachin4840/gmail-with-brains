# Google OAuth & Gmail API Setup

Step-by-step guide to create Google OAuth credentials for this app.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top bar) → **New Project**
3. Name it something like `Gmail Summarizer`
4. Click **Create**
5. Make sure the new project is selected in the dropdown

---

## Step 2: Enable Gmail API

1. Go to **APIs & Services** → **Library**
   - Direct link: https://console.cloud.google.com/apis/library
2. Search for **"Gmail API"**
3. Click on it → Click **Enable**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
   - Direct link: https://console.cloud.google.com/apis/credentials/consent
2. Choose **External** (unless you have Google Workspace) → Click **Create**
3. Fill in:

| Field | Value |
|-------|-------|
| **App name** | Gmail Summarizer |
| **User support email** | Your email |
| **Developer contact email** | Your email |

4. Click **Save and Continue**

### Add Scopes
1. Click **Add or Remove Scopes**
2. Search and add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
3. Click **Update** → **Save and Continue**

### Add Test Users (Required while in "Testing" mode)
1. Click **Add Users**
2. Add your Gmail address (the one you'll test with)
3. Click **Save and Continue**

> ⚠️ While the app is in "Testing" status, ONLY test users can sign in.  
> To allow anyone to use it, submit for **verification** (requires privacy policy + domain).

---

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
   - Direct link: https://console.cloud.google.com/apis/credentials
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it `Gmail Summarizer Web`

### Authorized JavaScript Origins
Add all your frontend URLs:
```
http://localhost:5173
https://your-app.vercel.app
```

### Authorized Redirect URIs
Add your Supabase callback URL:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

> 📌 Find this in Supabase: **Authentication** → **Providers** → **Google** → Callback URL

5. Click **Create**
6. A popup shows your credentials — copy them:
   - **Client ID** → looks like `123456789-abcdef.apps.googleusercontent.com`
   - **Client Secret** → looks like `GOCSPX-xxxxxxxxxxxx`

---

## Step 5: Configure Supabase

1. Go to your Supabase project → **Authentication** → **Providers** → **Google**
2. Toggle **Enable**
3. Paste:
   - **Client ID** from Step 4
   - **Client Secret** from Step 4
4. Click **Save**

---

## Step 6: Configure Your .env Files

### Backend `.env`
```env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

### Frontend `.env`
No Google credentials needed in frontend — Supabase handles the OAuth flow.

---

## How the Auth Flow Works

```
User clicks "Sign in with Google"
        ↓
React calls supabase.auth.signInWithOAuth({ provider: 'google' })
        ↓
Browser redirects to Google consent screen
        ↓
User grants Gmail permissions
        ↓
Google redirects to Supabase callback URL
        ↓
Supabase creates/updates user, captures provider_token (Google access token)
        ↓
Supabase redirects back to your frontend
        ↓
Frontend stores:
  - Supabase session (JWT) → for app auth
  - Google provider_token → for Gmail API calls
        ↓
Frontend sends both tokens to backend on every API call
        ↓
Backend uses Google token to call Gmail API
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| **"Access blocked: This app's request is invalid"** | Redirect URI doesn't match. Check it exactly matches the Supabase callback URL. |
| **"Error 403: access_denied"** | Your email isn't added as a test user. Add it in OAuth consent screen. |
| **"Gmail API has not been enabled"** | Go to API Library and enable Gmail API for your project. |
| **Provider token is null** | Make sure you request scopes in `signInWithOAuth` and `prompt: 'consent'` is set. |
| **Token expires after 1 hour** | Google access tokens expire. User needs to re-sign in. For long-lived access, implement refresh tokens (advanced). |

---

## Moving to Production

When ready to go public:

1. **OAuth Consent Screen** → Click **Publish App**
2. Google will ask for:
   - Homepage URL
   - Privacy Policy URL
   - Terms of Service URL (optional)
3. Submit for verification (takes a few days)
4. Once approved, any Google user can sign in

---

## Security Notes

- **Never expose** `GOOGLE_CLIENT_SECRET` in frontend code
- **Never expose** `SUPABASE_SERVICE_KEY` in frontend code
- The `VITE_SUPABASE_ANON_KEY` is safe for frontend — it's rate-limited and RLS-protected
- Google provider tokens are **short-lived** (~1 hour) — this is fine for email reading sessions
