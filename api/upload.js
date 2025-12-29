import { handleUpload } from '@vercel/blob/server';
import { json } from './utils/http.js';
import { safeJsonParse } from './utils/http.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  // 兼容 Vercel Node Function：req.body 可能已解析
  const parsed = safeJsonParse(req.body);
  if (!parsed.ok) return json(res, 400, { error: parsed.error || 'Invalid JSON', detail: parsed.detail });
  const body = parsed.value;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 鉴权：在生成上传许可前，必须校验管理员 Token
        const token = req.headers['x-admin-token'];
        if (!token || token !== process.env.ADMIN_TOKEN) {
          throw new Error('Unauthorized');
        }

        // 按用途限制文件类型，并把上传内容归类到 lovesite 目录
        let allowedContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        let prefix = 'lovesite';
        if (clientPayload === 'music') {
          allowedContentTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
          prefix = 'lovesite/music';
        } else {
          prefix = 'lovesite/images';
        }

        // 强制把上传路径放进我们的目录里
        const safePath = String(pathname || '').replace(/^\/+/, '');
        const finalPathname = `${prefix}/${safePath}`;

        return {
          allowedContentTypes,
          tokenPayload: JSON.stringify({ source: clientPayload || 'image' }),
          pathname: finalPathname,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.pathname, tokenPayload);
      },
    });

    return json(res, 200, jsonResponse);
  } catch (error) {
    if (String(error?.message) === 'Unauthorized') {
      return json(res, 401, { error: 'Unauthorized' });
    }
    console.error('Upload handler error:', error);
    return json(res, 500, { error: 'Failed to handle upload.', detail: String(error?.message || error) });
  }
}

