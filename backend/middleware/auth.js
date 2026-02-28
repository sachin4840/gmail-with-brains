const { google } = require('googleapis');
const { supabaseAdmin } = require('../lib/supabase');

/**
 * Verify Supabase JWT and attach user.
 * Frontend sends: Authorization: Bearer <supabase-access-token>
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Like requireAuth but also loads the Gmail access token from DB.
 * Refreshes the token if expired.
 */
async function requireGmail(req, res, next) {
  // First run normal auth
  await requireAuth(req, res, async () => {
    try {
      const { data: connection, error } = await supabaseAdmin
        .from('gmail_connections')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (error || !connection) {
        return res.status(403).json({ error: 'Gmail not connected. Please connect your Gmail account first.' });
      }

      // Check if token is expired and we have a refresh token
      const isExpired = connection.token_expiry && new Date(connection.token_expiry) < new Date();

      if (isExpired && connection.refresh_token) {
        // Refresh the token
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({ refresh_token: connection.refresh_token });

        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update stored token
        await supabaseAdmin
          .from('gmail_connections')
          .update({
            access_token: credentials.access_token,
            token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', req.user.id);

        req.googleAccessToken = credentials.access_token;
      } else {
        req.googleAccessToken = connection.access_token;
      }

      req.gmailEmail = connection.email;
      next();
    } catch (err) {
      console.error('Gmail token error:', err);
      return res.status(500).json({ error: 'Failed to load Gmail credentials' });
    }
  });
}

module.exports = { requireAuth, requireGmail };
