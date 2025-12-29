import { json, verifyAdminToken } from '../utils/http.js';
import { getConfig, saveConfig } from '../utils/kv.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

function tryParseJsonString(v) {
  if (typeof v !== 'string') return { ok: false };
  const s = v.trim();
  if (!s) return { ok: false };
  if (!(s.startsWith('{') || s.startsWith('[') || s.startsWith('"'))) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    return { ok: false };
  }
}

function deepNormalize(value, depth = 0) {
  if (depth > 6) return { value, changed: false, parsedStrings: 0 };

  let changed = false;
  let parsedStrings = 0;

  // 尝试把“JSON 字符串”转回对象/数组
  const parsed = tryParseJsonString(value);
  if (parsed.ok) {
    value = parsed.value;
    changed = true;
    parsedStrings += 1;
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      const outArr = [];
      for (let i = 0; i < value.length; i++) {
        const r = deepNormalize(value[i], depth + 1);
        outArr[i] = r.value;
        if (r.changed) changed = true;
        parsedStrings += r.parsedStrings;
      }
      value = outArr;
    } else {
      const outObj = {};
      for (const [k, v] of Object.entries(value)) {
        const r = deepNormalize(v, depth + 1);
        outObj[k] = r.value;
        if (r.changed) changed = true;
        parsedStrings += r.parsedStrings;
      }
      value = outObj;
    }
  }

  return { value, changed, parsedStrings };
}

function looksLikeExportBackupShape(cfg) {
  // admin.js 导出备份结构：每个字段是 localStorage 的字符串
  // 因此常见特征：basic/password/photos 等是 string 且内容像 JSON
  if (!cfg || typeof cfg !== 'object') return false;
  const candidates = ['basic', 'password', 'theme', 'photos', 'music', 'timeline', 'message', 'broadcast', 'wishlist', 'effects', 'sweetwords', 'footer', 'easterEgg'];
  return candidates.some((k) => typeof cfg[k] === 'string');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const verify = verifyAdminToken(req);
  if (!verify.valid) return json(res, verify.status, { error: verify.error });

  try {
    const current = await getConfig();
    if (!current) {
      return json(res, 200, { ok: true, message: 'No config in KV. Nothing to normalize.', changed: false });
    }

    // 1) 把 config 本身如果是字符串，先尽力 parse
    const normalized = deepNormalize(current);

    // 2) 如果像“导出备份结构”，再做一次定向处理：把每个模块的字符串 parse 成对象
    let finalCfg = normalized.value;
    let changed = normalized.changed;
    let parsedStrings = normalized.parsedStrings;

    if (looksLikeExportBackupShape(finalCfg)) {
      const keys = ['basic', 'password', 'theme', 'photos', 'music', 'timeline', 'message', 'broadcast', 'wishlist', 'effects', 'sweetwords', 'footer', 'easterEgg'];
      for (const k of keys) {
        const v = finalCfg[k];
        if (typeof v === 'string') {
          const p = tryParseJsonString(v);
          if (p.ok) {
            finalCfg[k] = p.value;
            changed = true;
            parsedStrings += 1;
          }
        }
      }
    }

    // 3) 修正 updatedAt
    finalCfg = {
      ...(finalCfg && typeof finalCfg === 'object' ? finalCfg : {}),
      updatedAt: new Date().toISOString(),
    };

    if (!changed) {
      return json(res, 200, { ok: true, message: 'Config already normalized.', changed: false, parsedStrings });
    }

    await saveConfig(finalCfg);

    return json(res, 200, {
      ok: true,
      changed: true,
      parsedStrings,
      updatedAt: finalCfg.updatedAt,
      message: 'Config normalized and saved.',
    });
  } catch (e) {
    console.error('config/normalize error:', e);
    return json(res, 500, { error: 'Failed to normalize config', detail: String(e) });
  }
}

