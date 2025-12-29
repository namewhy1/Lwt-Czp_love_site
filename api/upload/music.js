import { put } from '@vercel/blob';
import { json, verifyAdminToken } from '../utils/http.js';

export const config = {
  api: {
    bodyParser: false, // 必须禁用，才能处理二进制流
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  // 验证管理员权限
  const verify = verifyAdminToken(req);
  if (!verify.valid) {
    return json(res, verify.status, { error: verify.error });
  }

  const filename = req.headers['x-filename'] || 'music.mp3';
  if (!filename) {
    return json(res, 400, { error: 'Missing x-filename header' });
  }

  try {
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `lovesite/music/${Date.now()}_${safeName}`;

    // 直接从请求体上传到 Vercel Blob
    const blob = await put(key, req, {
      access: 'public',
      contentType: req.headers['content-type'] || 'audio/mpeg',
      addRandomSuffix: false,
    });

    return json(res, 200, { ok: true, ...blob });

  } catch (e) {
    console.error('upload/music error:', e);
    return json(res, 500, { error: 'Failed to upload music', detail: String(e) });
  }
}
