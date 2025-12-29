import { handleUpload, vercelBlobReadWriteToken } from '@vercel/blob/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = (await getRawBody(req)) || '{}';

    const jsonResponse = await handleUpload({
      body: JSON.parse(body),
      request: req,
      token: vercelBlobReadWriteToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const token = req.headers['x-admin-token'];
        if (!token || token !== process.env.ADMIN_TOKEN) {
          throw new Error('Unauthorized');
        }

        let allowedContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        let prefix = 'lovesite/images';
        if (clientPayload === 'music') {
          allowedContentTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
          prefix = 'lovesite/music';
        }

        const finalPathname = `${prefix}/${pathname}`;

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
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Failed to handle upload.', detail: error.message });
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

