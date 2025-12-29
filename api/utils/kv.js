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
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return null;
}

export async function saveConfig(configObj) {
  const kvUrl = mustEnv('KV_REST_API_URL');
  const kvToken = mustEnv('KV_REST_API_TOKEN');

  // ✅ Upstash REST /set 的正确用法：body 必须是 JSON 数组 [key, value]
  // value 我们统一存储为 JSON 字符串，读取时再 JSON.parse
  const payload = [KEY, JSON.stringify(configObj)];

  const kvRes = await fetch(`${kvUrl}/set`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!kvRes.ok) {
    const text = await kvRes.text();
    throw new Error(`KV set failed: ${text}`);
  }

  return true;
}
