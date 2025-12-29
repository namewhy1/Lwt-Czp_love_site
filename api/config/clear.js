import { json, verifyAdminToken } from '../utils/http.js';

const KEY = 'lovesite:config';

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured on Vercel.`);
  return v;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const verify = verifyAdminToken(req);
  if (!verify.valid) {
    return json(res, verify.status, { error: verify.error });
  }

  try {
    const kvUrl = mustEnv('KV_REST_API_URL');
    const kvToken = mustEnv('KV_REST_API_TOKEN');

    // Upstash KV REST DEL
    const delRes = await fetch(`${kvUrl}/del/${encodeURIComponent(KEY)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
      },
    });

    if (!delRes.ok) {
      const text = await delRes.text();
      return json(res, 500, { error: 'KV del failed', detail: text });
    }

    return json(res, 200, { ok: true, message: 'Config key deleted' });
  } catch (e) {
    console.error('config/clear error:', e);
    return json(res, 500, { error: 'Failed to delete config', detail: String(e) });
  }
}

