import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    const adminToken = process.env.ADMIN_TOKEN;
    const provided = req.headers['x-admin-token'];
    if (!adminToken) return json(res, 500, { error: 'ADMIN_TOKEN is not configured on Vercel.' });
    if (!provided || provided !== adminToken) return json(res, 401, { error: 'Unauthorized' });

    // Expected body: { filename, contentType, dataUrl }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { filename, contentType, dataUrl } = body || {};

    if (!filename || !dataUrl) {
      return json(res, 400, { error: 'Missing filename or dataUrl' });
    }

    // dataUrl like: data:image/jpeg;base64,....
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return json(res, 400, { error: 'Invalid dataUrl' });

    const ct = contentType || match[1] || 'application/octet-stream';
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    // Basic size guard (10MB here; you can lower it)
    if (buffer.length > 10 * 1024 * 1024) {
      return json(res, 413, { error: 'File too large (max 10MB)' });
    }

    // Use a unique path
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `lovesite/${Date.now()}_${safeName}`;

    const blob = await put(key, buffer, {
      access: 'public',
      contentType: ct,
      addRandomSuffix: false,
    });

    return json(res, 200, { ok: true, url: blob.url, pathname: blob.pathname, contentType: ct, size: buffer.length });
  } catch (e) {
    return json(res, 500, { error: 'Unexpected error', detail: String(e) });
  }
}

