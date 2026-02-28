const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Summarize an email and extract actionable instructions.
 */
async function summarizeEmail(email) {
  const prompt = `You are an email assistant. Analyze this email and provide:
1. A concise summary (2-3 sentences)
2. Any action items or instructions found in the email
3. Priority level: high, medium, or low
4. Suggested response (if a reply seems needed, otherwise null)

Email:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body:
${email.body.substring(0, 4000)}

Respond in JSON format only, no other text:
{
  "summary": "...",
  "actionItems": ["..."],
  "priority": "high|medium|low",
  "suggestedReply": "..." or null,
  "category": "work|personal|newsletter|notification|spam|other"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20250404',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse summary response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Execute an instruction derived from an email (draft reply, create task, etc.)
 */
async function processInstruction(instruction, emailContext) {
  const prompt = `You are an email assistant. Based on this instruction and email context, generate the appropriate output.

Instruction: ${instruction}

Email context:
From: ${emailContext.from}
Subject: ${emailContext.subject}
Body: ${emailContext.body.substring(0, 2000)}

Provide a helpful, professional response. If the instruction is to draft a reply, write a complete reply email. If it's to summarize, provide a summary. If it's to extract info, extract it clearly.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20250404',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text;
}

module.exports = { summarizeEmail, processInstruction };
