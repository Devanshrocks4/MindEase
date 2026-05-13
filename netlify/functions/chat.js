// netlify/functions/chat.js
// Fixed chatbot with demo fallback and conversation context

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

    // Get all user messages for conversation context
    let allUserMessages = [];
    if (messages && messages.length > 0) {
      allUserMessages = messages.filter(function(m) { return m.role === 'user'; }).map(function(m) { return m.content; });
    }
    var currentMessage = message || (allUserMessages.length > 0 ? allUserMessages[allUserMessages.length - 1] : '');
    
    // Combine all messages for context
    var fullConversation = allUserMessages.join(' ').toLowerCase() + ' ' + currentMessage.toLowerCase();

    // Check for API key
    var apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
    
    // If no API key, use demo responses
    if (!apiKey) {
      console.log('[chat] No API key, using demo response');
      var reply = getDemoResponse(currentMessage, allUserMessages);
      return { statusCode: 200, headers, body: JSON.stringify({ reply: reply }) };
    }

    // Try with real API
    try {
      var response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: currentMessage }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }

      var data = JSON.parse(await response.text());
      var reply = data.candidates[0].content.parts[0].text;

      if (!reply) {
        throw new Error('Empty response');
      }

      return { statusCode: 200, headers, body: JSON.stringify({ reply: reply }) };
    } catch (apiError) {
      console.log('[chat] API failed, using demo: ' + apiError.message);
      var reply = getDemoResponse(currentMessage, allUserMessages);
      return { statusCode: 200, headers, body: JSON.stringify({ reply: reply }) };
    }

  } catch (error) {
    console.error('[chat] Handler error: ' + error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
}

// Context-aware demo responses with conversation history
function getDemoResponse(currentMessage, conversationHistory) {
  conversationHistory = conversationHistory || [];
  var t = currentMessage.toLowerCase();
  var history = conversationHistory.join(' ').toLowerCase();
  var allText = history + ' ' + t;
  
  // Crisis detection - check full conversation
  var crisisWords = ['suicide', 'suicidal', 'kill myself', 'end it all', 'hurt myself', 'self harm', 'no reason to live', 'want to die', 'better off dead'];
  if (crisisWords.some(function(w) { return allText.indexOf(w) !== -1; })) {
    return "I'm really glad you reached out. What you're experiencing matters, and you deserve support right now. Please reach out to these helplines: iCall 9152987821 (Mon-Sat 8am-10pm), Vandrevala Foundation 1860-2662-345 (24/7), or Emergency 112. You're not alone. Can we talk about what's going on?";
  }
  
  // Headaches / migraine
  if (t.indexOf('headache') !== -1 || t.indexOf('head pain') !== -1 || t.indexOf('migraine') !== -1) {
    return "Frequent headaches can be really tough. From a neurological perspective, common triggers include tension, dehydration, lack of sleep, or too much screen time. Try these: stay well hydrated, take regular breaks from screens (every 20 minutes, look away for 20 seconds), and practice gentle neck stretches. How long have you been experiencing these headaches?";
  }
  
  // Anxiety
  if (t.indexOf('anxiety') !== -1 || t.indexOf('anxious') !== -1 || t.indexOf('worry') !== -1 || t.indexOf('nervous') !== -1 || t.indexOf('panic') !== -1) {
    return "I hear you. Anxiety can feel overwhelming, and what you're feeling is completely valid. A technique that often helps is box breathing: breathe in for 4 seconds, hold for 4, breathe out for 4, hold for 4. Would you like to try it together, or tell me more about what's been triggering your anxiety?";
  }
  
  // Depression / sadness / low
  if (t.indexOf('depress') !== -1 || t.indexOf('sad') !== -1 || t.indexOf('low') !== -1 || t.indexOf('unmotivated') !== -1 || t.indexOf('hopeless') !== -1 || t.indexOf('empty') !== -1) {
    return "Thank you for opening up about this. What you're experiencing takes real courage to share. Feeling low or unmotivated can make even simple tasks feel exhausting. You're not alone in this. Can you tell me how long you've been feeling this way?";
  }
  
  // Sleep issues
  if (t.indexOf('sleep') !== -1 || t.indexOf('insomnia') !== -1 || t.indexOf('tired') !== -1 || t.indexOf('exhausted') !== -1 || t.indexOf('fatigue') !== -1) {
    return "Sleep problems can really affect everything: your mood, focus, and physical health. A few things that help: keep consistent sleep/wake times, avoid screens 1 hour before bed. What's your typical bedtime routine?";
  }
  
  // Stress / overwhelmed
  if (t.indexOf('stress') !== -1 || t.indexOf('overwhelmed') !== -1 || t.indexOf('pressure') !== -1 || t.indexOf('burnout') !== -1) {
    return "Feeling overwhelmed is your mind signaling that you need some relief. It's not a weakness. Let's break this down together. What's the one thing weighing on you most right now?";
  }
  
  // Relationship issues
  if (t.indexOf('relationship') !== -1 || t.indexOf('family') !== -1 || t.indexOf('friend') !== -1 || t.indexOf('lonely') !== -1 || t.indexOf('isolation') !== -1) {
    return "Relationship struggles can be really painful. Family pressures, loneliness, or conflicts with loved ones can deeply affect our mental health. I'm here to listen without judgment. What's been happening?";
  }
  
  // Anger
  if (t.indexOf('angry') !== -1 || t.indexOf('anger') !== -1 || t.indexOf('frustrat') !== -1 || t.indexOf('annoyed') !== -1) {
    return "It's completely okay to feel angry. It's a natural emotion. Sometimes anger hides deeper feelings like hurt or frustration. What's been making you feel this way?";
  }
  
  // Default - check conversation history for context
  if (history.indexOf('headache') !== -1) {
    return "You mentioned headaches earlier. Have you tried the tips I shared? Staying hydrated and screen breaks can really help. Are they still persisting?";
  }
  
  if (history.indexOf('anxiety') !== -1 || history.indexOf('worry') !== -1) {
    return "Earlier you mentioned feeling anxious. Have you tried the box breathing we talked about? Inhale 4s, hold 4s, exhale 4s, hold 4s. Would you like to try it together now?";
  }
  
  if (history.indexOf('sad') !== -1 || history.indexOf('depress') !== -1) {
    return "You mentioned feeling low earlier. I want to check in. How are you feeling right now? And is there something that usually helps you feel a bit better?";
  }
  
  if (history.indexOf('sleep') !== -1) {
    return "Earlier you mentioned sleep issues. Have you been able to try any of the sleep hygiene tips? How have your nights been?";
  }
  
  // Default response
  return "Thank you for sharing that with me. It takes real strength to talk about what you're going through. I'm here to listen without judgment. Can you tell me more about what's been on your mind?";
}
