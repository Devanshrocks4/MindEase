const express = require('express');
const router  = express.Router();

/**
 * POST /api/chat/message
 * Optional server-side proxy for Gemini calls.
 * This hides your API key from the client.
 * In production, add auth middleware before this route.
 */
router.post('/message', async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'Gemini API key not configured on server. Use client-side mode.' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const geminiMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "I'm here for you. Can you tell me more?";

    res.json({ text });
  } catch (err) {
    console.error('[Chat proxy error]', err);
    res.status(500).json({ error: 'Failed to reach Gemini API' });
  }
});

module.exports = router;
