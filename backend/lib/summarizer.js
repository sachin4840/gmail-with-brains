const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function summarizeEmail(email) {
  const prompt = `Analyze this email and respond in JSON only (no markdown, no code fences):
{
  "summary": "2-3 sentence summary",
  "actionItems": ["list of action items"],
  "priority": "high|medium|low",
  "suggestedReply": "suggested reply text or null",
  "category": "work|personal|newsletter|notification|spam|other"
}

Email:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body:
${email.body.substring(0, 4000)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function processInstruction(instruction, emailContext) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `You are an email assistant. ${instruction}\n\nEmail context:\nFrom: ${emailContext.from}\nSubject: ${emailContext.subject}\nBody: ${emailContext.body.substring(0, 2000)}` }],
    temperature: 0.5,
  });

  return completion.choices[0].message.content;
}

module.exports = { summarizeEmail, processInstruction };
