import { handleUpload, vercelBlobReadWriteToken } from '@vercel/blob/server';

export default async function handler(req, res) {
  // ✅ 解决 www / 非 www 重定向导致的跨域预检与 fetch 失败：加 CORS + 支持 OPTIONS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bodyStr = (await getRawBody(req)) || '{}';
    let body;
    try {
      body = JSON.parse(bodyStr);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body', detail: String(e) });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: vercelBlobReadWriteToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // ✅ 鉴权：管理员口令必须匹配
        const token = req.headers['x-admin-token'];
        if (!token || token !== process.env.ADMIN_TOKEN) {
          throw new Error('Unauthorized');
        }

        // ✅ 限制可上传类型 + 统一存储路径
        let allowedContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        let prefix = 'lovesite/images';

        if (clientPayload === 'music') {
          allowedContentTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
          prefix = 'lovesite/music';
        }

        const safePath = String(pathname || 'file').replace(/^\/+/, '').replace(/\.\./g, '');
        const finalPathname = `${prefix}/${safePath}`;

        return {
          allowedContentTypes,
          pathname: finalPathname,
          tokenPayload: JSON.stringify({ source: clientPayload || 'image' }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.pathname, tokenPayload);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    if (String(error?.message) === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Failed to handle upload.', detail: String(error?.message || error) });
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}
