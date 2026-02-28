-- Gmail connections: stores OAuth tokens per user
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gmail_connections_user ON gmail_connections(user_id);

ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

-- Users can read their own connection
CREATE POLICY "Users read own gmail connection"
  ON gmail_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Service role handles insert/update
CREATE POLICY "Service manage gmail connections"
  ON gmail_connections FOR ALL
  WITH CHECK (true);
