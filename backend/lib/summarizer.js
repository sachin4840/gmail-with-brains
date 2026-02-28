const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

Respond in JSON format:
{
  "summary": "...",
  "actionItems": ["..."],
  "priority": "high|medium|low",
  "suggestedReply": "..." or null,
  "category": "work|personal|newsletter|notification|spam|other"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result;
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  return completion.choices[0].message.content;
}

module.exports = { summarizeEmail, processInstruction };
