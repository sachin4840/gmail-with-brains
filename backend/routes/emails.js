const express = require('express');
const router = express.Router();
const { requireGmail } = require('../middleware/auth');
const { fetchEmails, fetchEmailById } = require('../lib/gmail');
const { summarizeEmail } = require('../lib/summarizer');
const { supabaseAdmin } = require('../lib/supabase');

/**
 * GET /api/emails
 * Fetch emails from last 3 days (default) and return with cached summaries.
 * Query params: maxResults, days
 */
router.get('/', requireGmail, async (req, res) => {
  try {
    const { maxResults = 50, days = 3 } = req.query;

    // Build Gmail query for last N days
    const dateAfter = new Date();
    dateAfter.setDate(dateAfter.getDate() - parseInt(days));
    const dateStr = dateAfter.toISOString().split('T')[0].replace(/-/g, '/');
    const query = `after:${dateStr}`;

    const emails = await fetchEmails(req.googleAccessToken, {
      maxResults: parseInt(maxResults),
      query,
    });

    // Check cache for existing summaries
    const emailIds = emails.map((e) => e.id);
    const { data: cached } = await supabaseAdmin
      .from('email_summaries')
      .select('*')
      .in('email_id', emailIds)
      .eq('user_id', req.user.id);

    const cachedMap = {};
    (cached || []).forEach((c) => {
      cachedMap[c.email_id] = c;
    });

    const result = emails.map((email) => ({
      ...email,
      summary: cachedMap[email.id]?.summary_data || null,
      summarized: !!cachedMap[email.id],
    }));

    // Log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.user.id,
      action: 'fetch_emails',
      details: { count: emails.length, days: parseInt(days), query },
    });

    res.json({ emails: result, query, days: parseInt(days) });
  } catch (err) {
    console.error('Fetch emails error:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

/**
 * POST /api/emails/:id/summarize
 * Summarize a single email and cache the result.
 */
router.post('/:id/summarize', requireGmail, async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const { data: existing } = await supabaseAdmin
      .from('email_summaries')
      .select('*')
      .eq('email_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.json({ summary: existing.summary_data, cached: true });
    }

    const email = await fetchEmailById(req.googleAccessToken, id);
    const summary = await summarizeEmail(email);

    await supabaseAdmin.from('email_summaries').insert({
      user_id: req.user.id,
      email_id: id,
      email_subject: email.subject,
      email_from: email.from,
      summary_data: summary,
    });

    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.user.id,
      action: 'summarize_email',
      details: { email_id: id, subject: email.subject, priority: summary.priority },
    });

    res.json({ summary, cached: false });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: 'Failed to summarize email' });
  }
});

/**
 * POST /api/emails/summarize-all
 * Batch summarize emails (max 10 at a time).
 */
router.post('/summarize-all', requireGmail, async (req, res) => {
  try {
    const { emailIds } = req.body;
    if (!emailIds || !emailIds.length) {
      return res.status(400).json({ error: 'emailIds required' });
    }

    const results = [];

    for (const id of emailIds.slice(0, 10)) {
      const { data: existing } = await supabaseAdmin
        .from('email_summaries')
        .select('*')
        .eq('email_id', id)
        .eq('user_id', req.user.id)
        .single();

      if (existing) {
        results.push({ emailId: id, summary: existing.summary_data, cached: true });
        continue;
      }

      const email = await fetchEmailById(req.googleAccessToken, id);
      const summary = await summarizeEmail(email);

      await supabaseAdmin.from('email_summaries').insert({
        user_id: req.user.id,
        email_id: id,
        email_subject: email.subject,
        email_from: email.from,
        summary_data: summary,
      });

      results.push({ emailId: id, summary, cached: false });
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.user.id,
      action: 'batch_summarize',
      details: { count: results.length },
    });

    res.json({ results });
  } catch (err) {
    console.error('Batch summarize error:', err);
    res.status(500).json({ error: 'Failed to batch summarize' });
  }
});

module.exports = router;
