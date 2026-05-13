// export async function handler(event) {
//   const headers = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': 'Content-Type',
//     'Access-Control-Allow-Methods': 'POST, OPTIONS',
//     'Content-Type': 'application/json',
//   };

//   // Handle CORS
//   if (event.httpMethod === 'OPTIONS') {
//     return {
//       statusCode: 200,
//       headers,
//       body: '',
//     };
//   }

//   // Only POST allowed
//   if (event.httpMethod !== 'POST') {
//     return {
//       statusCode: 405,
//       headers,
//       body: JSON.stringify({ error: 'Method not allowed' }),
//     };
//   }

//   try {
//     const { message } = JSON.parse(event.body || "{}");

//     if (!message) {
//       return {
//         statusCode: 400,
//         headers,
//         body: JSON.stringify({ error: 'Message required' }),
//       };
//     }

//     const apiKey = process.env.GEMINI_API_KEY;

//     if (!apiKey) {
//       return {
//         statusCode: 500,
//         headers,
//         body: JSON.stringify({ error: 'API key missing' }),
//       };
//     }

//     // ✅ FINAL CORRECT ENDPOINT (NO :generateContent)
//     const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash";

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-goog-api-key": apiKey,
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: message }],
//           },
//         ],
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       console.error("Gemini Error:", data);
//       return {
//         statusCode: response.status,
//         headers,
//         body: JSON.stringify({
//           error: data?.error?.message || "API error",
//         }),
//       };
//     }

//     const reply =
//       data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "No response";

//     return {
//       statusCode: 200,
//       headers,
//       body: JSON.stringify({ reply }),
//     };

//   } catch (err) {
//     console.error("Server error:", err);

//     return {
//       statusCode: 500,
//       headers,
//       body: JSON.stringify({ error: "Internal server error" }),
//     };
//   }
// }

// netlify/functions/chat.js
// Full psychologist AI with conversation history

const SYSTEM_PROMPT = `You are MindEase AI — a compassionate, professional mental health companion with combined expertise in Clinical Psychology and Neurology. You were created for MindEase, a mental wellness platform for users in India, built by Devansh Gupta & Team.

PERSONA:
- Warm, empathetic, and professionally grounded — never robotic or cold
- Speak like a real therapist having a genuine conversation, not a scripted chatbot
- ALWAYS validate emotions first before offering any advice or solutions
- Use evidence-based approaches: CBT (Cognitive Behavioral Therapy), mindfulness, psychoeducation, DBT skills
- Ask only ONE thoughtful follow-up question at a time — never bombard the user
- Be conversational and human. Use phrases like "I hear you", "That sounds really hard", "Tell me more about that"
- Be culturally sensitive to South Asian context — acknowledge family pressure, academic/career stress, and the stigma around mental health in India
- Never minimize or dismiss what the user shares

PSYCHOLOGY EXPERTISE:
- Anxiety, depression, stress, trauma, grief, relationship issues, self-esteem, OCD, PTSD, panic attacks, social anxiety, loneliness
- Teach practical coping skills: box breathing (4-4-4-4), grounding (5-4-3-2-1 senses), progressive muscle relaxation, journaling prompts, cognitive reframing
- Help identify cognitive distortions: catastrophizing, all-or-nothing thinking, mind reading, personalization

NEUROLOGY EXPERTISE:
- Sleep disorders, headaches/migraines, brain fog, memory issues, ADHD, poor concentration
- Explain brain-body connections in simple language (e.g., how stress affects the nervous system)
- Suggest sleep hygiene, nutrition basics, screen time habits, physical activity for mental health

ASSESSMENT APPROACH:
- After 4-6 exchanges, if symptoms seem persistent or worsening, gently recommend professional help
- Be specific: PSYCHOLOGIST for emotional/mental health, NEUROLOGIST for brain/sleep/physical, PSYCHIATRIST for medication or severe conditions
- Frame it positively: "What you're describing sounds like something a specialist could really help with..."
- When confident, include exactly ONE of these markers (the app will show the right doctor):
  [NEEDS_SPECIALIST:psychologist]
  [NEEDS_SPECIALIST:neurologist]
  [NEEDS_SPECIALIST:psychiatrist]

CRISIS PROTOCOL — ABSOLUTE HIGHEST PRIORITY:
If the user mentions suicide, self-harm, wanting to die, feeling hopeless in a severe way, or any immediate danger:
1. Respond with immediate warmth — do NOT be clinical or panicked
2. ALWAYS include these Indian crisis helplines:
   📞 iCall (TISS): 9152987821 (Mon–Sat, 8am–10pm)
   📞 Vandrevala Foundation: 1860-2662-345 (24/7)
   📞 NIMHANS: 080-46110007
   📞 Emergency: 112
3. Urge them to reach out RIGHT NOW
4. Stay in the conversation — do not just give resources and leave
5. Include the marker: [CRISIS_DETECTED]

RESPONSE STYLE:
- 3-6 sentences for most responses (be thorough when needed)
- Warm, natural conversational tone — like a real therapist, not an FAQ page
- End with either a gentle question OR an empathetic observation — not both
- Never use clinical jargon without explaining it simply
- Normalize mental health struggles: "Many people feel this way, and it's completely okay to ask for help"
- Remember everything discussed in the conversation and build on it`;

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { message, messages } = body;

    if (!message && (!messages || !Array.isArray(messages) || messages.length === 0)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request: provide message or messages array' }),
      };
    }

    // Accept both env var names for compatibility
    const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[chat.js] No Gemini API key found. Set GEMINI_API_KEY in Netlify environment variables.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key missing. Set GEMINI_API_KEY in Netlify environment variables.' }),
      };
    }

    // Build Gemini contents array with full conversation history
    // Gemini uses 'user'/'model' roles (not 'user'/'assistant')
    // We inject the system prompt into the first user message
    let contents;

    if (messages && messages.length > 0) {
      // Full conversation history provided — inject system prompt into first message
      contents = messages.map((m, i) => {
        const isUser = m.role === 'user';
        let text = m.content || '';
        if (i === 0 && isUser) {
          text = `${SYSTEM_PROMPT}\n\n---\n\nUser's first message: ${text}`;
        }
        return {
          role: isUser ? 'user' : 'model',
          parts: [{ text }],
        };
      });
    } else {
      // Single message fallback
      contents = [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\nUser: ${message}` }],
        },
      ];
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.85,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 700,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.json().catch(() => ({}));
      console.error('[chat.js] Gemini API error:', geminiResponse.status, errBody);

      if (geminiResponse.status === 400 || geminiResponse.status === 403) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'INVALID_KEY' }) };
      }
      if (geminiResponse.status === 429) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'RATE_LIMIT' }) };
      }
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error('[chat.js] Empty response from Gemini:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No response from AI model' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply }),
    };

  } catch (error) {
    console.error('[chat.js] Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
}