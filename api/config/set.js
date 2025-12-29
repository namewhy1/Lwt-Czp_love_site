import { json, safeJsonParse, verifyAdminToken } from '../utils/http.js';
import { getConfig, saveConfig } from '../utils/kv.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  // 只接受 POST
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  // 校验管理员 Token
  const verify = verifyAdminToken(req);
  if (!verify.valid) {
    return json(res, verify.status, { error: verify.error });
  }

  // 解析 Body
  const parsed = safeJsonParse(req.body);
  if (!parsed.ok) return json(res, 400, { error: parsed.error || 'Invalid JSON', detail: parsed.detail });
  const body = parsed.value || {};

  const newCfg = body.config;
  if (!newCfg || typeof newCfg !== 'object') {
    return json(res, 400, { error: 'Missing config object' });
  }

  try {
    // 合并旧配置（保留未修改部分）
    const existing = (await getConfig()) || {};
    const merged = {
      ...existing,
      ...newCfg,
      updatedAt: new Date().toISOString(),
    };

    await saveConfig(merged);

    return json(res, 200, { ok: true, updatedAt: merged.updatedAt });
  } catch (e) {
    console.error('config/set error:', e);
    return json(res, 500, { error: 'Failed to save config', detail: String(e) });
  }
}
