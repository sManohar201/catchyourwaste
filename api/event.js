// api/event.js  (Vercel Serverless Function)
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const ALLOWED_DEVICE_KEY = process.env.DEVICE_KEY || null;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'missing env vars' });
  }

  const payload = req.body;
  if (!payload || !payload.device_id) return res.status(400).json({ error: 'bad payload' });
  if (ALLOWED_DEVICE_KEY && payload.device_key !== ALLOWED_DEVICE_KEY) return res.status(403).json({ error: 'invalid device_key' });

  const url = `${SUPABASE_URL}/rest/v1/events`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    if (!r.ok) return res.status(502).send(text);
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
