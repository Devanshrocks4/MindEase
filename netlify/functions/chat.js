// netlify/functions/chat.js
// Professional Psychologist AI Chatbot using Gemini API

exports.handler = async function(event) {
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

    // Build conversation history
    var conversationHistory = '';
    if (messages && messages.length > 0) {
      for (var i = 0; i < messages.length; i++) {
        var m = messages[i];
        if (m.role === 'user') {
          conversationHistory += 'User: ' + m.content + '\n';
        } else if (m.role === 'assistant') {
          conversationHistory += 'AI: ' + m.content + '\n';
        }
      }
    }

    // Get current message if not in messages array
    var currentMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : message);

    // Check for API key
    var apiKey = process.env.GEMINI_API_KEY;
    console.log('[chat] API key exists:', !!apiKey);
    
    if (!apiKey) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: 'API key not configured. Please contact the administrator.' }) };
    }

    // Build the prompt with psychologist persona
    var systemPrompt = 'You are MindEase AI, a professional and compassionate mental wellness companion. You are an expert in psychology and neurology. Your role is to:\n' +
      '1. Be an empathetic, active listener - truly hear what the person is saying\n' +
      '2. Ask thoughtful follow-up questions to understand deeper\n' +
      '3. Provide evidence-based guidance and practical coping strategies\n' +
      '4. Validate their feelings without judgment\n' +
      '5. Remember details they share and reference them in future conversations\n' +
      '6. Keep responses conversational, warm, and not too long (2-4 sentences usually)\n' +
      '7. Show genuine care and concern\n' +
      '\nImportant guidelines:\n' +
      '- Never give medical diagnoses - suggest seeing a professional if needed\n' +
      '- If they mention self-harm or suicide, immediately show Indian helplines: iCall 9152987821, Vandrevala Foundation 1860-2662-345, Emergency 112\n' +
      '- Use the conversation history to maintain context and continuity\n' +
      '- Ask ONE meaningful question at a time rather than listing multiple questions\n' +
      '- Acknowledge what they shared before moving forward\n' +
      '\nStart with a warm greeting if this is the first message.\n';

    var fullPrompt = systemPrompt;
    if (conversationHistory) {
      fullPrompt += '\nConversation so far:\n' + conversationHistory + '\n';
    }
    fullPrompt += 'User: ' + currentMessage + '\nAI:';

    console.log('[chat] Sending to Gemini with prompt length:', fullPrompt.length);

    // Call Gemini API
    var response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 600,
            topP: 0.95,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      var errText = await response.text();
      console.error('[chat] Gemini API error:', response.status, errText);
      return { statusCode: 200, headers, body: JSON.stringify({ reply: 'I apologize, but I\'m having trouble responding right now. Could you try again in a moment?' }) };
    }

    var data = JSON.parse(await response.text());
    var reply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : '';

    if (!reply || reply.trim() === '') {
      console.error('[chat] Empty response from Gemini');
      return { statusCode: 200, headers, body: JSON.stringify({ reply: 'I\'m here for you. Could you tell me more about what you\'re going through?' }) };
    }

    console.log('[chat] Got reply:', reply.substring(0, 100) + '...');

    return { statusCode: 200, headers, body: JSON.stringify({ reply: reply }) };

  } catch (error) {
    console.error('[chat] Handler error:', error.message, error.stack);
    return { statusCode: 200, headers, body: JSON.stringify({ reply: 'I\'m here for you. Tell me what\'s on your mind.' }) };
  }
};
