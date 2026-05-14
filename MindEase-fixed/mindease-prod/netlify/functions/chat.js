// ─────────────────────────────────────────────────────────────────
//  /netlify/functions/chat.js
//
//  Replace your existing file with this. Path:
//    mindease-prod/netlify/functions/chat.js
//
//  What changed vs your old version:
//    • Accepts BOTH { message } and { messages: [...] } from the client
//      (your Chat.js sends an array — the old function expected a string,
//      which is why every request 400'd and the bot never replied)
//    • Adds a MindEase system prompt so the bot stays on-topic
//    • Sends the full conversation history to Gemini for context
//    • Returns helpful error codes the UI already handles
// ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MindEase AI — a compassionate, evidence-informed mental wellness companion.
Style:
• Warm, validating, never preachy. Mirror the user's feelings before offering anything.
• Short paragraphs. Plain language. No clinical jargon unless the user uses it first.
• Ask one gentle follow-up question per turn when appropriate.
• If the user shows signs of crisis (self-harm, suicidal ideation, abuse), respond with empathy and gently share that talking to a trained human helps — iCall India: +91 9152987821, Vandrevala Foundation: 1860-2662-345, or 112 in emergencies. Do NOT give clinical diagnoses.
• You can discuss CBT techniques, grounding (5-4-3-2-1), breathing (4-7-8, box breathing), sleep hygiene, journaling, and basic neuroscience of stress.
• Never claim to be a doctor or therapist. Encourage professional help when issues persist for weeks.
Keep replies under 180 words unless explicitly asked for more.`;

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const body = JSON.parse(event.body || '{}');

    // Accept either { messages: [...] } (new) or { message: "..." } (legacy)
    let history = [];
    if (Array.isArray(body.messages) && body.messages.length) {
      history = body.messages;
    } else if (typeof body.message === 'string' && body.message.trim()) {
      history = [{ role: 'user', content: body.message }];
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'INVALID_PAYLOAD', detail: 'Expected { messages: [...] } or { message: "..." }' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API_KEY_MISSING', detail: 'GEMINI_API_KEY env var is not set in Netlify' }) };
    }

    // Build Gemini "contents" array.
    // Gemini uses roles "user" and "model". The system prompt is prepended as a
    // user instruction (Gemini 1.5 supports systemInstruction natively too).
    const contents = history
      .filter(m => m && typeof m.content === 'string' && m.content.trim())
      .map(m => ({
        role: (m.role === 'assistant' || m.role === 'bot' || m.role === 'model') ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const geminiBody = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature:     0.8,
        topK:            40,
        topP:            0.95,
        maxOutputTokens: 600,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(geminiBody),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('[chat] Gemini API error:', resp.status, data);
      if (resp.status === 429) return { statusCode: 429, headers, body: JSON.stringify({ error: 'RATE_LIMIT' }) };
      if (resp.status === 400 && data?.error?.message?.toLowerCase().includes('api key')) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'INVALID_KEY' }) };
      }
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API_ERROR', detail: data?.error?.message || 'Unknown Gemini error' }) };
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      console.error('[chat] No reply in Gemini response:', data);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'NO_RESPONSE' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };

  } catch (err) {
    console.error('[chat] Handler error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'INTERNAL', detail: err.message }) };
  }
}
