export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const adminToken = process.env.ADMIN_TOKEN;

    if (!kvUrl || !kvToken) {
      return res.status(500).json({ error: 'KV is not configured on Vercel.' });
    }

    if (!adminToken) {
      return res.status(500).json({ error: 'ADMIN_TOKEN is not configured on Vercel.' });
    }

    const provided = req.headers['x-admin-token'];
    if (!provided || provided !== adminToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const config = body?.config;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Missing config object' });
    }

    // Attach updatedAt on server side
    config.updatedAt = Date.now();

    const key = 'lovesite:config';

    // Upstash REST /set expects JSON string as value; we store as string to keep compatibility
    const kvRes = await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(config)),
    });

    if (!kvRes.ok) {
      const text = await kvRes.text();
      return res.status(500).json({ error: 'KV set failed', detail: text });
    }

    return res.status(200).json({ ok: true, updatedAt: config.updatedAt });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error', detail: String(e) });
  }
}

