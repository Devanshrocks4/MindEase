// ─────────────────────────────────────────────────────────────────
//  /mindease-prod/netlify/functions/chat.js
//
//  MindEase AI — Personal Psychologist & Counsellor
//
//  Why the previous version "wasn't working":
//    The old code wrapped EVERY failure in a try/catch and always returned
//    HTTP 200 with a generic fake reply. So you couldn't tell whether
//    Gemini was actually being called. This version surfaces real errors
//    (status 401 / 503 / 502) so the UI shows what's wrong, AND it tells
//    you the exact reason in a `debug` field when the API key is bad.
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
• USE THE CONVERSATION HISTORY. Reference details they shared earlier ("you mentioned your sleep was off last week — how is it now?"). This is what makes you feel like a real counsellor.

CONTENT YOU CAN OFFER
• Validation and normalization ("a lot of people in their twenties feel exactly this")
• Brief psychoeducation (what stress does to sleep, why rumination loops happen, the basic neuroscience of anxiety)
• Concrete coping techniques: 4-7-8 breathing, box breathing, 5-4-3-2-1 grounding, behavioural activation, sleep hygiene, journaling prompts, CBT thought-records
• Gentle reframing of self-critical thoughts (never dismissive)
• Suggestions for when to consider a professional ("if this has been going on for several weeks and is affecting your daily life, talking to a therapist could really help")

WHAT YOU NEVER DO
• Never claim to be a doctor, psychiatrist, or licensed therapist.
• Never diagnose a condition. You can say "this sounds like it could be anxiety" but never "you have GAD."
• Never prescribe medication or comment on doses.
• Never dismiss feelings — always validate first.
• Never give long lists or essay-length replies.
• Never moralize. Replace "should" with "could".

CRISIS PROTOCOL — CRITICAL
If the user mentions self-harm, suicide, wanting to die, hopelessness with active plans, severe abuse happening NOW, or any imminent danger — STOP everything and respond with:
1. A short, deeply empathetic acknowledgment (1 sentence)
2. A clear statement that you're worried and that a trained human can help right now
3. These exact resources, on separate lines:
   • iCall (free, English/Hindi): +91 9152987821 — Mon-Sat 8am-10pm
   • Vandrevala Foundation (24x7, free): 1860-2662-345 or +91 9999666555
   • Emergency Services: 112
   • DMHP Helpline (India): 1800-180-0017
4. ONE gentle question — "is there someone with you right now?"

Never list helplines for general stress — only for active crisis. For ongoing symptoms (panic attacks for weeks, suspected depression for months), suggest seeing a GP or therapist without sounding like a referral form.

You are someone they're trusting with private feelings. Earn that trust every reply.`;

const CRISIS_WORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all',
  'want to die', 'wanna die', 'better off dead', 'not worth living',
  "don't want to live", 'no reason to live', 'harm myself', 'hurt myself',
  'cut myself', 'cutting myself', 'self harm', 'self-harm', 'overdose',
];
const isCrisis = (text) => CRISIS_WORDS.some(k => text.toLowerCase().includes(k));

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
        reply: '🔑 The AI service is currently unavailable. GEMINI_API_KEY is not set on the server. Admin: add it in Netlify → Site settings → Environment variables, then trigger a fresh deploy with cache cleared.',
        debug: 'process.env.GEMINI_API_KEY is undefined in the Netlify function runtime.',
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
      ? '\n\n⚠ CRISIS DETECTED IN LATEST MESSAGE. Begin your reply by gently acknowledging their pain, then give the helpline list (iCall, Vandrevala, 112, DMHP) clearly. Do not skip this. Do not lecture. End with: "Is there someone with you right now?"'
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

    const url  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(geminiBody),
    });

    const rawText = await resp.text();
    let data = {};
    try { data = JSON.parse(rawText); } catch { /* keep raw */ }

    if (!resp.ok) {
      console.error('[chat] Gemini error:', resp.status, rawText.slice(0, 400));
      const errMsg = data?.error?.message || rawText.slice(0, 200) || 'Unknown';

      if (resp.status === 429) {
        return { statusCode: 429, headers, body: JSON.stringify({
          error: 'RATE_LIMIT',
          reply: 'I\'m getting a lot of requests right now — please try again in a minute.',
          debug: errMsg,
        }) };
      }
      if (resp.status === 400 && errMsg.toLowerCase().includes('api key')) {
        return { statusCode: 401, headers, body: JSON.stringify({
          error: 'INVALID_KEY',
          reply: '🔑 The Gemini API key is invalid or expired. Admin: regenerate one at aistudio.google.com/app/apikey and update Netlify.',
          debug: errMsg,
        }) };
      }
      return { statusCode: 502, headers, body: JSON.stringify({
        error: 'GEMINI_ERROR',
        reply: 'The AI service had a hiccup. Try sending your message again in a moment.',
        debug: `Status ${resp.status}: ${errMsg}`,
      }) };
    }

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
        debug: `blockReason=${blocked || 'none'}`,
      }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ reply: reply.trim() }) };

  } catch (err) {
    console.error('[chat] Handler exception:', err.message, err.stack);
    return { statusCode: 500, headers, body: JSON.stringify({
      error: 'INTERNAL',
      reply: 'Something went wrong on my side. Please try again — and if it keeps happening, the developer needs to check the function logs.',
      debug: err.message,
    }) };
  }
};
