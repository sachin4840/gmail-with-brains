const { createClient } = require('@supabase/supabase-js');

// Service-role client for backend operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = { supabaseAdmin };
