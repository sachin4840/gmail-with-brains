const { google } = require('googleapis');

/**
 * Create an authenticated Gmail client from a user's Google access token.
 */
function getGmailClient(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

/**
 * Fetch a list of recent emails (metadata + snippet).
 */
async function fetchEmails(accessToken, { maxResults = 20, query = 'is:inbox' } = {}) {
  const gmail = getGmailClient(accessToken);

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });

  const messages = listRes.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });
      return parseEmail(detail.data);
    })
  );

  return emails;
}

/**
 * Fetch a single email by ID.
 */
async function fetchEmailById(accessToken, emailId) {
  const gmail = getGmailClient(accessToken);
  const detail = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full',
  });
  return parseEmail(detail.data);
}

/**
 * Parse a Gmail message into a clean object.
 */
function parseEmail(message) {
  const headers = message.payload.headers || [];
  const getHeader = (name) =>
    (headers.find((h) => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

  let body = '';

  // Try to get plain text body
  if (message.payload.parts) {
    const textPart = message.payload.parts.find(
      (p) => p.mimeType === 'text/plain'
    );
    if (textPart && textPart.body && textPart.body.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    } else {
      // Fallback to HTML part
      const htmlPart = message.payload.parts.find(
        (p) => p.mimeType === 'text/html'
      );
      if (htmlPart && htmlPart.body && htmlPart.body.data) {
        body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        // Strip HTML tags for summarization
        body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  } else if (message.payload.body && message.payload.body.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  return {
    id: message.id,
    threadId: message.threadId,
    snippet: message.snippet,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    body: body.substring(0, 10000), // Cap body length
    labels: message.labelIds || [],
  };
}

/**
 * Send a reply to an email.
 */
async function sendReply(accessToken, { to, subject, body, threadId, messageId }) {
  const gmail = getGmailClient(accessToken);

  const raw = createRawEmail({ to, subject: `Re: ${subject}`, body, messageId });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
      threadId,
    },
  });
}

/**
 * Create a base64url-encoded RFC 2822 email.
 */
function createRawEmail({ to, subject, body, messageId }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
  ];
  if (messageId) {
    lines.push(`In-Reply-To: ${messageId}`);
    lines.push(`References: ${messageId}`);
  }
  lines.push('', body);

  const email = lines.join('\r\n');
  return Buffer.from(email).toString('base64url');
}

module.exports = { fetchEmails, fetchEmailById, sendReply };
