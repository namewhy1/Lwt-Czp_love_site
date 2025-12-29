// Vercel Blob 官方直传签名接口（Node.js Serverless Function）
// 依赖：@vercel/blob（已在 package.json dependencies）
import { handleUpload } from '@vercel/blob/server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS + 预检
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 解析 body（Vercel 会自动解析 JSON；也兼容字符串）
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body', detail: String(e) });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 鉴权：必须带 x-admin-token
        const token = req.headers['x-admin-token'];
        if (!token || token !== process.env.ADMIN_TOKEN) {
          throw new Error('Unauthorized');
        }

        // 限制类型 + 目录
        let allowedContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        let prefix = 'lovesite/images';
        if (clientPayload === 'music') {
          allowedContentTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
          prefix = 'lovesite/music';
        }

        const safePath = String(pathname || 'file').replace(/^\/+/, '').replace(/\.\./g, '');

        return {
          allowedContentTypes,
          pathname: `${prefix}/${safePath}`,
          tokenPayload: JSON.stringify({ source: clientPayload || 'image' }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob upload completed:', blob?.pathname);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (e) {
    if (String(e?.message) === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('api/upload error:', e);
    return res.status(500).json({ error: 'Failed to handle upload', detail: String(e?.message || e) });
  }
}

