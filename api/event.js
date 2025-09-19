// api/event.js — parse JSON body manually, forward to Supabase
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(200).send('OK - POST JSON to insert event');
    }

    // Parse raw body stream
    let rawBody = '';
    for await (const chunk of req) rawBody += chunk;
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('Bad JSON:', rawBody);
      return res.status(400).json({ error: 'invalid JSON', detail: e.message });
    }

    if (!payload || !payload.device_id) {
      console.error('Bad payload received:', payload);
      return res.status(400).json({ error: 'bad payload - missing device_id' });
    }

    // Optional: device key check
    const EXPECTED_KEY = process.env.DEVICE_KEY || null;
    if (EXPECTED_KEY && payload.device_key !== EXPECTED_KEY) {
      console.error('Invalid device_key:', payload.device_key, 'expected', EXPECTED_KEY);
      return res.status(403).json({ error: 'invalid device_key' });
    }

    // Supabase env vars
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_KEY env vars');
      return res.status(500).json({ error: 'server misconfigured: missing SUPABASE env vars' });
    }

    const url = `${SUPABASE_URL}/rest/v1/events`;
    console.log('Forwarding to Supabase URL:', url);
    console.log('Payload:', JSON.stringify(payload));

    const supRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const text = await supRes.text();
    console.log('Supabase status:', supRes.status);
    console.log('Supabase body:', text);

    res.status(supRes.status).type('application/json').send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'proxy exception', detail: String(err) });
  }
};
