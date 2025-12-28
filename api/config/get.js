export default async function handler(req, res) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) {
      return res.status(500).json({ error: 'KV is not configured on Vercel.' });
    }

    const key = 'lovesite:config';

    const kvRes = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${kvToken}`,
      },
    });

    if (!kvRes.ok) {
      const text = await kvRes.text();
      return res.status(500).json({ error: 'KV get failed', detail: text });
    }

    const data = await kvRes.json();

    // Upstash REST returns: { result: <value|null> }
    let raw = data?.result ?? null;

    // Standardize: always return object or null
    let config = null;
    if (raw == null) {
      config = null;
    } else if (typeof raw === 'object') {
      config = raw;
    } else if (typeof raw === 'string') {
      try {
        config = JSON.parse(raw);
      } catch (e) {
        // If it's not valid JSON, treat as no config
        config = null;
      }
    } else {
      config = null;
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ config });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error', detail: String(e) });
  }
}
