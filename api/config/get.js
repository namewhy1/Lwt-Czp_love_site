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
    const config = data?.result || null;

    // Cache-busting + allow client caching if you want (here: no-cache)
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ config });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error', detail: String(e) });
  }
}

