-- ============================================
-- Gmail Summarizer - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Email summaries cache
CREATE TABLE IF NOT EXISTS email_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_id TEXT NOT NULL,
  email_subject TEXT,
  email_from TEXT,
  summary_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, email_id)
);

-- Activity / audit logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_summaries_user ON email_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_email_summaries_email ON email_summaries(email_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Row Level Security
ALTER TABLE email_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own summaries
CREATE POLICY "Users read own summaries"
  ON email_summaries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only read their own logs
CREATE POLICY "Users read own logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (backend uses service key)
CREATE POLICY "Service insert summaries"
  ON email_summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service insert logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);
