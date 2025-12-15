require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'dall-e-3';

app.use(cors());
app.use(express.json({ limit: '8mb' }));

// Vercel may invoke this Serverless Function directly at `/server/index.js`.
// Return a friendly response instead of a 404.
app.get(['/server/index.js', '/'], (_req, res) => {
  res.status(200).send('ok');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ready: Boolean(OPENAI_API_KEY) });
});

app.post('/api/generate', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY missing in server/.env' });
    }
    const prompt = (req.body?.prompt || '').toString().trim();
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt,
        size: '1024x1024',
        n: 1,
        response_format: 'b64_json'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error', response.status, errorText);
      return res.status(response.status).json({ error: errorText || 'AI request failed', status: response.status });
    }

    const json = await response.json();
    const image = json?.data?.[0]?.b64_json;

    if (!image) return res.status(500).json({ error: 'No image returned from provider' });

    res.json({ image });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// Vercel (@vercel/node) runs this file as a Serverless Function.
// In that environment we must NOT call `listen()`; we export the Express app.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Santa PFP server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
