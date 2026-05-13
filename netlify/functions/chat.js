// netlify/functions/chat.js
// Fixed chatbot with better error handling

const SYSTEM_PROMPT = `You are MindEase AI — a compassionate mental health companion. You were created for MindEase by Devansh Gupta & Team for users in India.

Guidelines:
- Be warm, empathetic, and conversational
- Validate emotions first before offering advice
- Use simple language, not clinical jargon
- Ask one question at a time
- Be culturally sensitive to Indian context
- 3-5 sentences per response
- End with a gentle question

Crisis support: If user mentions self-harm/suicide, immediately provide:
- iCall: 9152987821
- Vandrevala: 1860-2662-345
- Emergency: 112`;

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { message, messages } = body;

    console.log('[chat] Request received:', { hasMessage: !!message, hasMessages: !!messages });

    if (!message && (!messages || !Array.isArray(messages) || messages.length === 0)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing message' }) };
    }

    // Get API key - check multiple sources
    const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('[chat] No API key found');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    console.log('[chat] API key found, length:', apiKey.length);

    // Build the prompt
    let userMessage = message;
    if (messages && messages.length > 0) {
      // Get the last user message from conversation
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      userMessage = lastUserMsg ? lastUserMsg.content : message;
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`;

    // Use stable v1 API endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        })
      }
    );

    const responseText = await response.text();
    console.log('[chat] Gemini response status:', response.status);

    if (!response.ok) {
      console.error('[chat] Gemini error:', responseText);
      
      if (response.status === 400) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'INVALID_KEY' }) };
      }
      if (response.status === 429) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'RATE_LIMIT' }) };
      }
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API error' }) };
    }

    const data = JSON.parse(responseText);
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error('[chat] No reply in response:', JSON.stringify(data).substring(0, 200));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Empty response' }) };
    }

    console.log('[chat] Reply received, length:', reply.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error('[chat] Handler error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error', message: error.message })
    };
  }
}
