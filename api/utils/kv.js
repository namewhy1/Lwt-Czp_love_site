const KEY = 'lovesite:config';

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured on Vercel.`);
  return v;
}

export async function getConfig() {
  const kvUrl = mustEnv('KV_REST_API_URL');
  const kvToken = mustEnv('KV_REST_API_TOKEN');

  const kvRes = await fetch(`${kvUrl}/get/${encodeURIComponent(KEY)}`, {
    headers: {
      Authorization: `Bearer ${kvToken}`,
    },
  });

  if (!kvRes.ok) {
    const text = await kvRes.text();
    throw new Error(`KV get failed: ${text}`);
  }

  const data = await kvRes.json();
  const raw = data?.result ?? null;

  if (raw == null) return null;
  if (typeof raw === 'object') return raw;

  if (typeof raw === 'string') {
    // 有些历史写入会出现多层 JSON 字符串，这里最多解两层
    let v = raw;
    for (let i = 0; i < 2; i++) {
      try {
        const parsed = JSON.parse(v);
        if (typeof parsed === 'string') {
          v = parsed;
          continue;
        }
        return parsed;
      } catch {
        break;
      }
    }
    return null;
  }

  return null;
}

export async function saveConfig(configObj) {
  const kvUrl = mustEnv('KV_REST_API_URL');
  const kvToken = mustEnv('KV_REST_API_TOKEN');

  // ✅ 与你最初项目的 URL 形式保持一致：/set/{key}
  // 但修复之前的错误：只存“一层 JSON 字符串”，不要双 stringify。
  const value = JSON.stringify(configObj);

  const kvRes = await fetch(`${kvUrl}/set/${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });

  if (!kvRes.ok) {
    const text = await kvRes.text();
    throw new Error(`KV set failed: ${text}`);
  }

  return true;
}
