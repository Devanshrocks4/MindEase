// ─────────────────────────────────────────────────────────────────
//  /mindease-prod/netlify/functions/chat.js
//
//  MindEase AI — Personal Psychologist & Counsellor
//
//  FIX (May 2026): Gemini 1.5 models were shut down by Google.
//  Updated model to gemini-2.5-flash. Also added a fallback chain
//  so if the primary model is unavailable, we try alternatives
//  before reporting failure.
// ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MindEase AI — a warm, professional mental wellness companion modelled on a skilled clinical psychologist with neuroscience training. You serve users primarily in India.

YOUR CORE ROLE
You are a counsellor first and an information source second. Your job is to make the person feel HEARD, then gently help them understand what they're feeling, then offer a small, doable next step.

CONVERSATIONAL STYLE
• Sound like a real therapist, not a chatbot. Warm, unhurried, never preachy.
• Start every reply by acknowledging or reflecting back what the user shared. They must feel heard before anything else.
• Ask ONE thoughtful follow-up question per turn — never list multiple questions.
• Keep replies to 2-5 short sentences. No bullet lists unless explicitly asked. No emojis unless they used one first.
• Use plain language. Avoid clinical jargon unless the user uses it first.
• Match their register: if they write casually, you write casually. If formally, you do the same.
• USE THE CONVERSATION HISTORY. Reference details they shared earlier ("you mentioned your sleep was off last week — how is it now?").

CONTENT YOU CAN OFFER
• Validation and normalization ("a lot of people in their twenties feel exactly this")
• Brief psychoeducation (what stress does to sleep, why rumination loops happen, the basic neuroscience of anxiety)
• Concrete coping techniques: 4-7-8 breathing, box breathing, 5-4-3-2-1 grounding, behavioural activation, sleep hygiene, journaling prompts, CBT thought-records
• Gentle reframing of self-critical thoughts
• Suggestions for when to consider a professional

WHAT YOU NEVER DO
• Never claim to be a doctor or licensed therapist.
• Never diagnose a condition.
• Never prescribe medication or comment on doses.
• Never dismiss feelings — always validate first.
• Never give long lists or essay-length replies.

CRISIS PROTOCOL — CRITICAL
If the user mentions self-harm, suicide, wanting to die, hopelessness with active plans, severe abuse happening NOW, or any imminent danger — STOP everything and respond with:
1. A short, deeply empathetic acknowledgment (1 sentence)
2. A clear statement that you're worried and that a trained human can help right now
3. These exact resources, on separate lines:
   • iCall (free, English/Hindi): +91 9152987821 — Mon-Sat 8am-10pm
   • Vandrevala Foundation (24×7, free): 1860-2662-345 or +91 9999666555
   • Emergency Services: 112
   • DMHP Helpline (India): 1800-180-0017
4. ONE gentle question — "is there someone with you right now?"

You are someone they're trusting with private feelings. Earn that trust every reply.`;

const CRISIS_WORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all',
  'want to die', 'wanna die', 'better off dead', 'not worth living',
  "don't want to live", 'no reason to live', 'harm myself', 'hurt myself',
  'cut myself', 'cutting myself', 'self harm', 'self-harm', 'overdose',
];
const isCrisis = (text) => CRISIS_WORDS.some(k => text.toLowerCase().includes(k));

// Fallback chain — try these models in order if the primary fails
const MODEL_CHAIN = [
  "gemini-2.5-flash",         // primary — current production model
  "gemini-2.5-flash-lite",    // cheaper/faster fallback
  "gemini-2.0-flash-001",     // older fallback (works until June 2026)
];

async function callGemini(modelName, apiKey, geminiBody, timeoutMs = 8000) {
  // Use AbortController so we don't blow past Netlify's function timeout
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      signal: controller.signal,
    });
    return resp;
  } finally {
    clearTimeout(t);
  }
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }) };

  try {
    const body = JSON.parse(event.body || '{}');

    let history = [];
    if (Array.isArray(body.messages) && body.messages.length) {
      history = body.messages;
    } else if (typeof body.message === 'string' && body.message.trim()) {
      history = [{ role: 'user', content: body.message }];
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({
        error: 'INVALID_PAYLOAD',
        reply: '⚠ The chat is misconfigured. Please refresh the page.',
        debug: 'Expected { messages: [...] } or { message: "..." }',
      }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 503, headers, body: JSON.stringify({
        error: 'API_KEY_MISSING',
        reply: '🔑 The AI service is currently unavailable. GEMINI_API_KEY is not set on the server.',
        debug: 'process.env.GEMINI_API_KEY is undefined',
      }) };
    }

    const contents = history
      .filter(m => m && typeof m.content === 'string' && m.content.trim())
      .map(m => ({
        role:  (m.role === 'assistant' || m.role === 'bot' || m.role === 'model') ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({
        error: 'EMPTY_HISTORY',
        reply: 'Please type a message and I\'ll respond.',
      }) };
    }

    const lastUserMsg = [...history].reverse().find(m => (m.role === 'user' || !m.role))?.content || '';
    const crisisOverride = isCrisis(lastUserMsg)
      ? '\n\n⚠ CRISIS DETECTED IN LATEST MESSAGE. Begin by gently acknowledging their pain, then give the helpline list (iCall, Vandrevala, 112, DMHP) clearly. End with: "Is there someone with you right now?"'
      : '';

    const geminiBody = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + crisisOverride }] },
      contents,
      generationConfig: {
        temperature:     0.85,
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

    // ── Try each model in the fallback chain ─────────────────────
    let lastErrCode = 0, lastErrMsg = '', resp = null, modelUsed = '';

    for (const modelName of MODEL_CHAIN) {
      try {
        resp = await callGemini(modelName, apiKey, geminiBody, 7500);
        if (resp.ok) { modelUsed = modelName; break; }

        const errText = await resp.text();
        let errData = {};
        try { errData = JSON.parse(errText); } catch {}
        lastErrCode = resp.status;
        lastErrMsg = (errData?.error?.message || errText || '').slice(0, 300);
        console.error(`[chat] ${modelName} returned ${resp.status}: ${lastErrMsg}`);

        // If it's an auth or rate-limit issue, no point trying fallbacks
        if (resp.status === 401 || resp.status === 403 || resp.status === 429) break;
        // For 404 (model gone) or 5xx, fall through to next model
      } catch (fetchErr) {
        lastErrCode = 0;
        lastErrMsg = fetchErr.message;
        console.error(`[chat] ${modelName} fetch failed: ${fetchErr.message}`);
        if (fetchErr.name === 'AbortError') {
          // Timeout — bail out rather than hit Netlify's hard timeout
          return { statusCode: 504, headers, body: JSON.stringify({
            error: 'TIMEOUT',
            reply: 'The AI is taking longer than usual to respond. Please try again — sometimes the first request after a quiet period is slow.',
            debug: `Aborted after 7.5s on ${modelName}`,
          }) };
        }
      }
    }

    // ── No model worked ──────────────────────────────────────────
    if (!resp || !resp.ok) {
      const errLower = lastErrMsg.toLowerCase();

      if (lastErrCode === 401 || lastErrCode === 403 || errLower.includes('api key not valid') || errLower.includes('api_key_invalid')) {
        return { statusCode: 401, headers, body: JSON.stringify({
          error: 'INVALID_KEY',
          reply: '🔑 The Gemini API key is invalid or expired. Get a fresh one at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY in Netlify.',
          debug: `Status ${lastErrCode}: ${lastErrMsg}`,
        }) };
      }
      if (lastErrCode === 429 || errLower.includes('quota') || errLower.includes('rate')) {
        return { statusCode: 429, headers, body: JSON.stringify({
          error: 'RATE_LIMIT',
          reply: 'I\'ve hit my hourly limit. Please try again in a minute — or check your Google AI Studio quota.',
          debug: `Status ${lastErrCode}: ${lastErrMsg}`,
        }) };
      }

      return { statusCode: 502, headers, body: JSON.stringify({
        error: 'ALL_MODELS_FAILED',
        reply: 'The AI service is temporarily unreachable. We tried 3 model versions and none responded. Check the Netlify function logs for details.',
        debug: `Last: status ${lastErrCode} — ${lastErrMsg}`,
        modelsAttempted: MODEL_CHAIN,
      }) };
    }

    // ── Got a successful response — parse it ─────────────────────
    const rawText = await resp.text();
    let data = {};
    try { data = JSON.parse(rawText); } catch {}

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n');

    if (!reply) {
      const blocked = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      console.error('[chat] No reply. finishReason/blockReason:', blocked);
      return { statusCode: 502, headers, body: JSON.stringify({
        error: 'NO_RESPONSE',
        reply: blocked === 'SAFETY'
          ? 'I want to be helpful with what you shared, but my safety filters held that response back. Could you tell me a little more about how you\'re feeling?'
          : 'I\'m here. Could you share a little more about what\'s on your mind?',
        debug: `blockReason=${blocked || 'none'}, model=${modelUsed}`,
      }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({
      reply: reply.trim(),
      _model: modelUsed,  // helps debugging
    }) };

  } catch (err) {
    console.error('[chat] Handler exception:', err.message, err.stack);
    return { statusCode: 500, headers, body: JSON.stringify({
      error: 'INTERNAL',
      reply: 'Something went wrong on my side. Please try again.',
      debug: err.message,
    }) };
  }
};