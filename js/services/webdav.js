// ==========================================
// js/services/webdav.js
// 作用：封装 WebDAV 协议，实现与坚果云的数据收发
//
// 端点策略（A1）：
//   1. 用户手填的「同步通道」永远第一优先（换域名 / 换反代不必改代码）；
//   2. 本地 http 调试（:8000）优先直连局域网代理（同网段最快）；
//   3. 其次自建域名（Worker 绑定的自定义域名），再其次 workers.dev；
//   4. HTTPS 页面不能调 http 端点（混合内容会被拦），本地代理自动跳过；
//   5. 单端点超时 / 网络不可达 / 5xx 时自动换下一个，全部失败才报错并列出尝试过的通道。
// ==========================================

const ENDPOINTS = {
  // 自建域名（Worker 绑定的自定义域名），排在 workers.dev 之前
  domain: { label: '自建域名', base: 'https://dav.noamet.ccwu.cc/dav/' },
  worker: { label: 'Cloudflare Worker', base: 'https://guitar-webdav-proxy.cuimao513.workers.dev/dav/' },
  // 局域网代理同网段应秒回，压到 10s，别让一次失联卡住 90s
  local: { label: '本地代理', base: 'http://192.168.0.200:8081/dav/', cap: 10000 }
};

// 备份文件可能几十 MB（乐谱转 Base64），上传给足时间；下载与探测可以短一些
const TIMEOUT = { upload: 90000, download: 45000, meta: 20000 };

let lastEndpoint = null;

// 当前页面能安全使用的端点顺序：本地代理（仅 http 调试页）→ 自建域名 → Worker
function customEndpoint() {
  try {
    const base = (localStorage.getItem('gs_dav_base') || '').trim();
    if (!base) return null;
    return { label: '自定义端点', base: base.endsWith('/') ? base : base + '/' };
  } catch (err) {
    return null;
  }
}

function candidates() {
  const list = [];
  // 用户手填的通道最高优先（换域名或换反代时不必改代码）
  const custom = customEndpoint();
  if (custom) list.push(custom);
  // 本地代理只能用于 http 调试页 —— HTTPS 页面调用 http 会被混合内容直接拦掉
  if (location.protocol !== 'https:') list.push(ENDPOINTS.local);
  list.push(ENDPOINTS.domain);
  list.push(ENDPOINTS.worker);
  return list;
}

function normalizePath(remotePath) {
  return String(remotePath || '').replace(/^\/+/, '').trim();
}

function buildUrl(endpoint, remotePath) {
  return endpoint.base + encodeURI(normalizePath(remotePath));
}

function basicAuth(username, password) {
  // 坚果云用「邮箱 + 应用密码」的 Basic Auth；应用密码全是 ASCII，btoa 安全
  return { 'Authorization': `Basic ${btoa(`${username}:${password}`)}` };
}

async function fetchWithTimeout(url, init, timeoutMs, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`${label} 响应超时（${Math.round(timeoutMs / 1000)} 秒）`);
    // TypeError: Failed to fetch —— 断网 / DNS / CORS / 混合内容都会落到这里
    throw new Error(`${label} 网络不可达`);
  } finally {
    clearTimeout(timer);
  }
}

// 统一请求入口：失败自动换端点；5xx 视为端点异常，同样换
async function request(remotePath, init, { timeoutMs = TIMEOUT.meta } = {}) {
  const list = candidates();
  let lastErr = null;

  for (let i = 0; i < list.length; i++) {
    const ep = list[i];
    const effectiveTimeout = Math.min(timeoutMs, ep.cap || timeoutMs);
    try {
      const res = await fetchWithTimeout(buildUrl(ep, remotePath), init, effectiveTimeout, ep.label);
      if (res.status >= 500 && i < list.length - 1) {
        lastErr = new Error(`${ep.label} 服务异常（HTTP ${res.status}）`);
        console.warn('[WebDAV]', lastErr.message, '→ 换下一个端点');
        continue;
      }
      lastEndpoint = ep;
      return res;
    } catch (err) {
      lastErr = err;
      console.warn('[WebDAV]', `${ep.label} 不可用：${err.message}`, i < list.length - 1 ? '→ 换下一个端点' : '');
    }
  }

  const tried = list.map(ep => ep.label).join(' / ');
  throw new Error(`${lastErr ? lastErr.message : '网络不可达'}（已尝试：${tried}）`);
}

// 备份路径的父目录不存在时，尝试逐级建目录（坚果云首次同步常见 409）
async function ensureFolder(username, password, remotePath) {
  const segments = normalizePath(remotePath).split('/').slice(0, -1).filter(Boolean);
  if (!segments.length) return false;

  let created = false;
  for (let i = 1; i <= segments.length; i++) {
    const path = segments.slice(0, i).join('/') + '/';
    const res = await request(path, { method: 'MKCOL', headers: basicAuth(username, password) }, { timeoutMs: TIMEOUT.meta });
    // 201 新建成功；405 已存在；403 无权限等留给随后 PUT 报错
    if (res.ok || res.status === 405) created = true;
  }
  return created;
}

export const webdavService = {
  getHeaders(username, password) {
    return basicAuth(username, password);
  },

  // 最近一次成功请求走的通道，用于 UI 提示「走的是哪条路」
  getEndpointLabel() {
    return lastEndpoint ? lastEndpoint.label : '';
  },

  // 上传文件（备份数据）
  async upload(username, password, remotePath, dataStr) {
    const headers = {
      ...basicAuth(username, password),
      'Content-Type': 'application/json;charset=utf-8'
    };

    let res = await request(remotePath, { method: 'PUT', headers, body: dataStr }, { timeoutMs: TIMEOUT.upload });
    if (res.ok) return lastEndpoint.label;

    if (res.status === 401) throw new Error('账号或应用密码错误');

    if (res.status === 409 || res.status === 404) {
      // 云端目录不存在 → 补建后重试一次
      try {
        await ensureFolder(username, password, remotePath);
      } catch (err) {
        console.warn('[WebDAV] 自动建目录失败:', err.message);
      }
      res = await request(remotePath, { method: 'PUT', headers, body: dataStr }, { timeoutMs: TIMEOUT.upload });
      if (res.ok) return lastEndpoint.label;
      if (res.status === 401) throw new Error('账号或应用密码错误');
      throw new Error(`上传失败：云端目录不可写（HTTP ${res.status}），请先在坚果云里建好文件夹`);
    }

    throw new Error(`上传失败: HTTP ${res.status}`);
  },

  // 下载文件（获取备份数据）
  async download(username, password, remotePath) {
    const res = await request(remotePath, { method: 'GET', headers: basicAuth(username, password) }, { timeoutMs: TIMEOUT.download });

    if (!res.ok) {
      if (res.status === 404) throw new Error('云端没有找到备份文件');
      if (res.status === 401) throw new Error('账号或应用密码错误');
      throw new Error(`下载失败: HTTP ${res.status}`);
    }

    return await res.text();
  },

  // 连通性探测：上传前先确认哪条通道能用，避免把几十 MB 数据扔进失联的网络
  async probe(username, password, remotePath) {
    if (!username || !password) throw new Error('请先填写账号与应用密码');
    const res = await request(remotePath, {
      method: 'PROPFIND',
      headers: { ...basicAuth(username, password), 'Depth': '0' }
    }, { timeoutMs: TIMEOUT.meta });

    if (res.status === 401) throw new Error('账号或应用密码错误');
    // 405 / 501：端点通了，只是代理没放开 PROPFIND —— 也算连通
    if (res.status === 405 || res.status === 501) return { endpoint: lastEndpoint.label, exists: null };

    return { endpoint: lastEndpoint.label, exists: res.ok || res.status === 207 };
  }
};
