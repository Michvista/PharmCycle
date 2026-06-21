/**
 * LLM wrapper for AI Insights.
 *
 * Using Groq here because it's free-tier friendly and fast (good for live demos),
 * and its API is OpenAI-compatible, so swapping providers later (OpenAI, Gemini's
 * OpenAI-compat endpoint, etc.) only means changing BASE_URL / API_KEY / model name
 * below - the rest of the codebase (insights.controller.js) never needs to change.
 *
 * Pattern used throughout: force JSON-only output via system prompt, parse it,
 * and if parsing fails, retry once with a stricter instruction before giving up.
 */

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callLLM({ systemPrompt, userPrompt }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Add it to your .env file.');
  }

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('LLM returned no content');

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('LLM did not return valid JSON: ' + content.slice(0, 200));
  }
}

module.exports = { callLLM };
