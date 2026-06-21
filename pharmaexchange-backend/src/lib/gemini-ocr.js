/**
 * Gemini Vision OCR for medicine labels.
 * Free key: https://aistudio.google.com/apikey (starts with AIzaSy...)
 */

const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];

async function callGemini(model, base64, mimeType) {
  const key = process.env.GEMINI_API_KEY;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Read this pharmaceutical medicine package label. Return ONLY valid JSON:
{"medicineName":"","strength":"","dosageForm":"","batchNumber":"","expiryDate":"","category":""}
Rules: medicineName = drug name only (e.g. Paracetamol). strength like 500mg. expiryDate as YYYY-MM-DD or "". Empty string if unreadable.`,
              },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${model} (${response.status}): ${err.slice(0, 150)}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error(`${model}: no response`);

  return JSON.parse(raw);
}

async function extractMedicineLabel(base64OrDataUrl, mimeType = 'image/jpeg') {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const base64 = base64OrDataUrl.replace(/^data:image\/\w+;base64,/, '');
  let lastError;

  for (const model of MODELS) {
    try {
      return await callGemini(model, base64, mimeType);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

module.exports = { extractMedicineLabel };
