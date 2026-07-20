const GC_STORAGE_KEY = 'gc_v4_site_data';
const GC_VISITOR_KEY = 'gc_visitor_id';
const GC_ADMIN_TOKEN_KEY = 'gc_admin_token';

function gcClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function gcCreateDefaultData() {
  const data = gcClone(window.GC_DEFAULT_DATA);
  const now = Date.now();
  data.version = 4;
  data.site = {
    ...data.site,
    visitorLabel: '访客模式',
    dailyFreeViews: Number(data.site?.dailyFreeViews ?? data.site?.viewLimit ?? 5),
    viewLimit: Number(data.site?.dailyFreeViews ?? data.site?.viewLimit ?? 5),
    paymentEnabled: false,
    payTitle: '今天的免费阅读额度已经用完',
    payText: '每天可免费查看 5 条完整内容。会员功能正在内测，正式开放后可无限查看；今天可以先收藏页面，明天继续。',
    payButtonText: '会员即将开放',
    loginTitle: '会员功能内测中',
    loginText: '当前阶段先开放每日免费阅读，后续再开放正式会员与支付。'
  };
  data.posts = (data.posts || []).map(post => ({
    ...post,
    createdAt: post.createdAt || now - Number(post.createdAtOffsetMinutes || 0) * 60 * 1000,
    comments: Array.isArray(post.comments) ? post.comments : []
  }));
  return data;
}

function gcLocalGetData() {
  const raw = localStorage.getItem(GC_STORAGE_KEY);
  if (!raw) {
    const data = gcCreateDefaultData();
    gcLocalSaveData(data);
    return data;
  }
  try {
    const data = JSON.parse(raw);
    if (!data.site || !Array.isArray(data.categories) || !Array.isArray(data.posts)) {
      throw new Error('Invalid local data');
    }
    return data;
  } catch {
    const data = gcCreateDefaultData();
    gcLocalSaveData(data);
    return data;
  }
}

function gcLocalSaveData(data) {
  localStorage.setItem(GC_STORAGE_KEY, JSON.stringify(data));
}

function gcVisitorId() {
  let id = localStorage.getItem(GC_VISITOR_KEY);
  if (!id) {
    id = `visitor_${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GC_VISITOR_KEY, id);
  }
  return id;
}

function gcLoadScript(src, ready) {
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-gc-src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error(`加载失败：${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.gcSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载失败：${src}`));
    document.head.appendChild(script);
  });
}

async function gcEnsureCloudConfig() {
  await gcLoadScript('./cloudbase-config.js?v=5', () => Boolean(window.GC_CLOUDBASE_CONFIG));
  const config = window.GC_CLOUDBASE_CONFIG;
  if (!config?.envId || !config?.accessKey) {
    throw new Error('CloudBase 环境配置不完整');
  }
  return config;
}

function gcIsCloudMode() {
  return true;
}

function gcAdminToken() {
  return sessionStorage.getItem(GC_ADMIN_TOKEN_KEY) || '';
}

function gcHasAdminSession() {
  return Boolean(gcAdminToken());
}

function gcTryParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function gcNormalizeCloudResult(response) {
  let result = response;

  if (result?.body?.data?.response_data !== undefined) {
    result = result.body.data.response_data;
  } else if (result?.data?.response_data !== undefined) {
    result = result.data.response_data;
  } else if (result?.result !== undefined) {
    result = result.result;
  }

  result = gcTryParseJson(result);

  if (result?.result !== undefined && result.ok === undefined) {
    result = gcTryParseJson(result.result);
  }

  if (typeof result === 'string') {
    return { ok: false, message: result };
  }

  return result || { ok: false, message: '云函数没有返回结果' };
}

async function gcCall(action, payload = {}) {
  const config = await gcEnsureCloudConfig();
  const functionName = config.functionName || 'gc-api';
  const endpoint = `https://${config.envId}.api.tcloudbasegateway.com/v1/functions/${encodeURIComponent(functionName)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.accessKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal
    });

    const text = await response.text();
    const body = gcTryParseJson(text);

    if (!response.ok) {
      const message = body?.message || body?.errorMessage || text || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const result = gcNormalizeCloudResult(body);
    if (!result.ok) throw new Error(result.message || '云端请求失败');
    return result;
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? '连接 CloudBase 超时，请稍后重试'
      : (error?.message || String(error));

    if (/not found|function.*exist|FUNCTION_NOT_FOUND/i.test(message)) {
      throw new Error('CloudBase 已连接，但 gc-api 云函数尚未部署');
    }
    if (/cors|illegal source|origin|failed to fetch/i.test(message)) {
      throw new Error('浏览器无法访问 CloudBase HTTP API，请检查网络或安全来源配置');
    }
    if (/authority|forbidden|unauthorized|authentication|ACTION_FORBIDDEN|EXCEED_AUTHORITY/i.test(message)) {
      throw new Error('CloudBase 拒绝了当前调用，请检查云函数 HTTP API 权限');
    }
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}

async function gcLoadData() {
  try {
    const result = await gcCall('getContent');
    gcLocalSaveData(result.data);
    return result.data;
  } catch (error) {
    console.warn('CloudBase load failed, using cached local data:', error);
    return gcLocalGetData();
  }
}

async function gcGetViewStatus() {
  try {
    return (await gcCall('viewStatus', { visitorId: gcVisitorId() })).data;
  } catch {
    const data = gcLocalGetData();
    const limit = Number(data.site?.dailyFreeViews ?? data.site?.viewLimit ?? 5);
    const key = `gc_daily_views_${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })}`;
    const ids = JSON.parse(localStorage.getItem(key) || '[]');
    return { allowed: ids.length < limit, count: ids.length, limit, isMember: false };
  }
}

async function gcCheckView(postId) {
  try {
    return (await gcCall('checkView', { visitorId: gcVisitorId(), postId })).data;
  } catch {
    const data = gcLocalGetData();
    const limit = Number(data.site?.dailyFreeViews ?? data.site?.viewLimit ?? 5);
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    const key = `gc_daily_views_${date}`;
    const ids = JSON.parse(localStorage.getItem(key) || '[]');
    if (!ids.includes(postId) && ids.length >= limit) {
      return { allowed: false, count: ids.length, limit, isMember: false };
    }
    if (!ids.includes(postId)) ids.push(postId);
    localStorage.setItem(key, JSON.stringify(ids));
    return { allowed: true, count: ids.length, limit, isMember: false };
  }
}

async function gcSubmitPost({ category, title, content }) {
  return (await gcCall('submitPost', { visitorId: gcVisitorId(), category, title, content })).data;
}

async function gcSubmitComment(postId, content) {
  return (await gcCall('submitComment', { visitorId: gcVisitorId(), postId, content })).data;
}

async function gcSaveContent(data) {
  await gcCall('saveContent', { token: gcAdminToken(), data });
  gcLocalSaveData(data);
}

async function gcSaveSite(site) {
  const data = await gcLoadData();
  data.site = { ...data.site, ...site };
  await gcSaveContent(data);
}

async function gcSaveCategory(category) {
  const data = await gcLoadData();
  const target = data.categories.find(item => item.id === category.id);
  if (target) Object.assign(target, category);
  await gcSaveContent(data);
}

async function gcCreatePost({ category, title, content }) {
  if (!gcHasAdminSession()) return gcSubmitPost({ category, title, content });
  const data = await gcLoadData();
  const post = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category,
    title,
    content,
    createdAt: Date.now(),
    comments: []
  };
  data.posts.unshift(post);
  await gcSaveContent(data);
  return post;
}

async function gcUpdatePost(post) {
  const data = await gcLoadData();
  const target = data.posts.find(item => item.id === post.id);
  if (!target) throw new Error('文章不存在');
  Object.assign(target, post);
  await gcSaveContent(data);
}

async function gcDeletePost(postId) {
  const data = await gcLoadData();
  data.posts = data.posts.filter(post => post.id !== postId);
  await gcSaveContent(data);
}

async function gcAddComment(postId, content) {
  return gcSubmitComment(postId, content);
}

async function gcSignInAdmin(_email, password) {
  const result = await gcCall('adminLogin', { password });
  sessionStorage.setItem(GC_ADMIN_TOKEN_KEY, result.data.token);
  return result.data;
}

async function gcSignOutAdmin() {
  const token = gcAdminToken();
  if (token) {
    try {
      await gcCall('adminLogout', { token });
    } catch {
      // 云端退出失败时也清除本地会话。
    }
  }
  sessionStorage.removeItem(GC_ADMIN_TOKEN_KEY);
}
