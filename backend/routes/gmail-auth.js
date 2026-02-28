const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * GET /api/gmail/auth-url
 * Generate Google OAuth URL for Gmail connection.
 */
router.get('/auth-url', requireAuth, (req, res) => {
  const oauth2Client = getOAuth2Client();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: req.user.id, // Pass user ID in state for callback
  });

  res.json({ url });
});

/**
 * GET /api/gmail/callback
 * Handle Google OAuth callback — exchange code for tokens and store.
 */
router.get('/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.redirect(`${process.env.FRONTEND_URL}/connect?error=missing_params`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Get the Gmail email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Upsert the gmail connection
    const { error } = await supabaseAdmin
      .from('gmail_connections')
      .upsert({
        user_id: userId,
        email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Store token error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/connect?error=store_failed`);
    }

    // Log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: userId,
      action: 'gmail_connected',
      details: { email: userInfo.email },
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?gmail=connected`);
  } catch (err) {
    console.error('Gmail callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/connect?error=auth_failed`);
  }
});

/**
 * GET /api/gmail/status
 * Check if user has a connected Gmail account.
 */
router.get('/status', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('gmail_connections')
    .select('email, connected_at, token_expiry')
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    email: data.email,
    connectedAt: data.connected_at,
    tokenExpiry: data.token_expiry,
  });
});

/**
 * POST /api/gmail/disconnect
 * Remove Gmail connection.
 */
router.post('/disconnect', requireAuth, async (req, res) => {
  await supabaseAdmin
    .from('gmail_connections')
    .delete()
    .eq('user_id', req.user.id);

  await supabaseAdmin.from('activity_logs').insert({
    user_id: req.user.id,
    action: 'gmail_disconnected',
    details: {},
  });

  res.json({ success: true });
});

module.exports = router;
