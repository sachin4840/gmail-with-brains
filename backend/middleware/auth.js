const { supabaseAdmin } = require('../lib/supabase');

/**
 * Middleware to verify Supabase JWT and attach user + Google token.
 * Frontend sends: Authorization: Bearer <supabase-access-token>
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the Supabase JWT
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get the user's Google provider token from their identity
    const googleIdentity = user.identities?.find(
      (i) => i.provider === 'google'
    );

    // The provider_token is passed from frontend (stored after OAuth)
    const googleAccessToken = req.headers['x-google-token'];

    if (!googleAccessToken) {
      return res.status(401).json({ error: 'Missing Google access token. Re-authenticate with Google.' });
    }

    req.user = user;
    req.googleAccessToken = googleAccessToken;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { requireAuth };
