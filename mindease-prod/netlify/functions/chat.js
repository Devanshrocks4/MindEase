// netlify/functions/chat.js
// Fixed chatbot with demo fallback when no API key

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { message, messages } = body;

    if (!message && (!messages || !Array.isArray(messages) || messages.length === 0)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing message' }) };
    }

    // Get the user's message
    let userMessage = message;
    if (messages && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      userMessage = lastUserMsg ? lastUserMsg.content : message;
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
    
    // If no API key, use demo responses
    if (!apiKey) {
      console.log('[chat] No API key, using demo response');
      const reply = getDemoResponse(userMessage);
      return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
    }

    // Try with real API
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = JSON.parse(await response.text());
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) {
        throw new Error('Empty response');
      }

      return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
    } catch (apiError) {
      console.log('[chat] API failed, using demo:', apiError.message);
      const reply = getDemoResponse(userMessage);
      return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
    }

  } catch (error) {
    console.error('[chat] Handler error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
}

// Context-aware demo responses
function getDemoResponse(userMessage) {
  const t = userMessage.toLowerCase();
  
  // Headaches / migraine
  if (t.includes('headache') || t.includes('head pain') || t.includes('migraine')) {
    return "Frequent headaches can be really tough. From a neurological perspective, common triggers include tension, dehydration, lack of sleep, or too much screen time. Try these: stay well hydrated, take regular breaks from screens (every 20 minutes, look away for 20 seconds), and practice gentle neck stretches. How long have you been experiencing these headaches?";
  }
  
  // Anxiety
  if (t.includes('anxiety') || t.includes('anxious') || t.includes('worry') || t.includes('nervous')) {
    return "I hear you — anxiety can feel overwhelming, and what you're feeling is completely valid. A technique that often helps is box breathing: breathe in for 4 seconds, hold for 4, breathe out for 4, hold for 4. Would you like to try it together, or tell me more about what's been triggering your anxiety?";
  }
  
  // Depression / sadness / low
  if (t.includes('depress') || t.includes('sad') || t.includes('low') || t.includes('unmotivated') || t.includes('hopeless')) {
    return "Thank you for opening up about this. What you're experiencing takes real courage to share. Feeling low or unmotivated can make even simple tasks feel exhausting — you're not alone in this. Can you tell me how long you've been feeling this way? And is there anything that usually makes you feel even slightly better?";
  }
  
  // Sleep issues
  if (t.includes('sleep') || t.includes('insomnia') || t.includes('tired') || t.includes('exhausted')) {
    return "Sleep problems can really affect everything — your mood, focus, and physical health. Our brains need sleep to repair and consolidate memories. A few things that help: keep consistent sleep/wake times, avoid screens 1 hour before bed, and try a body scan meditation. What's your typical bedtime routine?";
  }
  
  // Stress / overwhelmed
  if (t.includes('stress') || t.includes('overwhelmed') || t.includes('pressure')) {
    return "Feeling overwhelmed is your mind signaling that you need some relief — it's not a weakness. Stress often builds when we feel we lack control. Let's break this down together. What's the one thing weighing on you most right now? Sometimes just naming it can help start to release its power.";
  }
  
  // Relationship issues
  if (t.includes('relationship') || t.includes('family') || t.includes('friend') || t.includes('lonely')) {
    return "Relationship struggles can be really painful. Family pressures, loneliness, or conflicts with loved ones can deeply affect our mental health. I'm here to listen without judgment. What's been happening, and how has it been affecting you?";
  }
  
  // Self-harm / crisis
  if (t.includes('suicide') || t.includes('kill myself') || t.includes('hurt myself') || t.includes('self harm')) {
    return "I'm really glad you reached out. What you're experiencing matters, and you deserve support right now. Please reach out to these helplines: iCall 9152987821 (Mon-Sat 8am-10pm), Vandrevala Foundation 1860-2662-345 (24/7), or Emergency 112. You're not alone — can we talk about what's going on?";
  }
  
  // Default empathetic response
  return "Thank you for sharing that with me. It takes real strength to talk about what you're going through. I'm here to listen without judgment. Can you tell me more about what's been on your mind lately, or how you're feeling about all of this?";
}
