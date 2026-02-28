const express = require('express');
const router = express.Router();
const { requireGmail } = require('../middleware/auth');
const { fetchEmailById, sendReply } = require('../lib/gmail');
const { processInstruction } = require('../lib/summarizer');
const { supabaseAdmin } = require('../lib/supabase');

/**
 * POST /api/actions/execute
 * Execute an instruction on an email (draft reply, extract info, etc.)
 */
router.post('/execute', requireGmail, async (req, res) => {
  try {
    const { emailId, instruction } = req.body;

    if (!emailId || !instruction) {
      return res.status(400).json({ error: 'emailId and instruction required' });
    }

    const email = await fetchEmailById(req.googleAccessToken, emailId);
    const result = await processInstruction(instruction, email);

    // Log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.user.id,
      action: 'execute_instruction',
      details: { email_id: emailId, instruction },
    });

    res.json({ result, email: { id: email.id, subject: email.subject } });
  } catch (err) {
    console.error('Execute error:', err);
    res.status(500).json({ error: 'Failed to execute instruction' });
  }
});

/**
 * POST /api/actions/reply
 * Send a reply to an email via Gmail.
 */
router.post('/reply', requireGmail, async (req, res) => {
  try {
    const { emailId, replyBody } = req.body;

    if (!emailId || !replyBody) {
      return res.status(400).json({ error: 'emailId and replyBody required' });
    }

    const email = await fetchEmailById(req.googleAccessToken, emailId);

    await sendReply(req.googleAccessToken, {
      to: email.from,
      subject: email.subject,
      body: replyBody,
      threadId: email.threadId,
    });

    // Log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.user.id,
      action: 'send_reply',
      details: { email_id: emailId, to: email.from, subject: email.subject },
    });

    res.json({ success: true, message: 'Reply sent' });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

module.exports = router;
