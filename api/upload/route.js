import { put } from '@vercel/blob';
import { json, verifyAdminToken } from '../utils/http.js';

export const config = {
  runtime: 'edge', // 使用 Edge Runtime 提升性能
};

export async function POST(req) {
  try {
    // 验证管理员权限
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.split(' ')[1];
    
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await req.json();
    if (!filename) {
      return json({ error: 'Missing filename' }, { status: 400 });
    }

    // 生成一个带签名的上传 URL
    const blob = await put(filename, null, {
      access: 'public',
      addRandomSuffix: false,
    });

    return json(blob);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return json(
      { error: 'Failed to generate upload URL', details: error.message },
      { status: 500 }
    );
  }
}
