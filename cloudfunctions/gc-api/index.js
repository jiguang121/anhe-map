const cloudbase = require('@cloudbase/js-sdk');
const crypto = require('crypto');

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const db = app.database();

const CONTENT_COLLECTION = 'gc_content';
const USAGE_COLLECTION = 'gc_usage';
const SUBMISSION_COLLECTION = 'gc_submissions';
const SESSION_COLLECTION = 'gc_admin_sessions';
const MEMBERSHIP_COLLECTION = 'gc_memberships';
const ORDER_COLLECTION = 'gc_orders';

function ok(data = null) {
  return { ok: true, data };
}

function fail(message, code = 'BAD_REQUEST') {
  return { ok: false, code, message };
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function beijingDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

async function getDocument(collection, id) {
  try {
    const result = await db.collection(collection).doc(id).get();
    if (Array.isArray(result.data)) return result.data[0] || null;
    return result.data || null;
  } catch (error) {
    if (/not exist|not found|DOCUMENT_NOT_EXIST/i.test(error.message || '')) return null;
    throw error;
  }
}

async function setDocument(collection, id, data) {
  return db.collection(collection).doc(id).set({ ...data, _id: id });
}

async function removeDocument(collection, id) {
  try {
    await db.collection(collection).doc(id).remove();
  } catch (error) {
    if (!/not exist|not found|DOCUMENT_NOT_EXIST/i.test(error.message || '')) throw error;
  }
}

async function getContent() {
  const record = await getDocument(CONTENT_COLLECTION, 'main');
  return record?.data || null;
}

async function saveContent(data) {
  const serialized = JSON.stringify(data);
  if (serialized.length > 900000) throw new Error('站点内容过大，请精简后再保存');
  if (!data?.site || !Array.isArray(data.categories) || !Array.isArray(data.posts)) {
    throw new Error('站点数据格式不正确');
  }

  const safeData = JSON.parse(serialized);
  safeData.version = 4;
  safeData.site.paymentEnabled = false;
  safeData.site.dailyFreeViews = Math.max(
    0,
    Math.min(100, Number(safeData.site.dailyFreeViews ?? safeData.site.viewLimit ?? 5))
  );
  safeData.site.viewLimit = safeData.site.dailyFreeViews;

  await setDocument(CONTENT_COLLECTION, 'main', {
    data: safeData,
    updatedAt: Date.now()
  });
  return safeData;
}

async function isMember(visitorId) {
  const id = hash(visitorId).slice(0, 40);
  const membership = await getDocument(MEMBERSHIP_COLLECTION, id);
  return Boolean(membership && membership.status === 'active' && Number(membership.expiresAt || 0) > Date.now());
}

async function viewState(visitorId) {
  const content = await getContent();
  const limit = Math.max(0, Number(content?.site?.dailyFreeViews ?? content?.site?.viewLimit ?? 5));
  const member = await isMember(visitorId);
  if (member) return { allowed: true, count: 0, limit, isMember: true };

  const usageId = `${beijingDate()}_${hash(visitorId).slice(0, 32)}`;
  const usage = await getDocument(USAGE_COLLECTION, usageId);
  const viewedPostIds = Array.isArray(usage?.viewedPostIds) ? usage.viewedPostIds : [];
  return {
    allowed: viewedPostIds.length < limit,
    count: viewedPostIds.length,
    limit,
    isMember: false,
    usageId,
    viewedPostIds
  };
}

async function checkView(visitorId, postId) {
  const state = await viewState(visitorId);
  if (state.isMember) return state;
  if (state.viewedPostIds.includes(postId)) return { ...state, allowed: true };
  if (state.viewedPostIds.length >= state.limit) return { ...state, allowed: false };

  const nextIds = [...state.viewedPostIds, postId];
  await setDocument(USAGE_COLLECTION, state.usageId, {
    visitorHash: hash(visitorId),
    date: beijingDate(),
    viewedPostIds: nextIds,
    count: nextIds.length,
    updatedAt: Date.now()
  });

  return {
    allowed: true,
    count: nextIds.length,
    limit: state.limit,
    isMember: false
  };
}

async function createSubmission(type, payload) {
  const now = Date.now();
  const record = {
    type,
    status: 'pending',
    visitorHash: hash(payload.visitorId),
    createdAt: now,
    updatedAt: now
  };

  if (type === 'post') {
    record.category = cleanText(payload.category, 30);
    record.title = cleanText(payload.title, 60);
    record.content = cleanText(payload.content, 1200);
    if (!record.category || !record.title || !record.content) throw new Error('投稿内容不完整');
  } else {
    record.postId = cleanText(payload.postId, 80);
    record.content = cleanText(payload.content, 240);
    if (!record.postId || !record.content) throw new Error('评论内容不完整');
  }

  const result = await db.collection(SUBMISSION_COLLECTION).add(record);
  return { id: result.id || result._id, status: 'pending' };
}

function configuredAdminPassword() {
  return String(process.env.GC_ADMIN_PASSWORD || '');
}

async function adminLogin(password) {
  const configured = configuredAdminPassword();
  if (!configured) throw new Error('云函数尚未设置 GC_ADMIN_PASSWORD 环境变量');

  const actualHash = Buffer.from(hash(password));
  const expectedHash = Buffer.from(hash(configured));
  if (actualHash.length !== expectedHash.length || !crypto.timingSafeEqual(actualHash, expectedHash)) {
    throw new Error('管理密码不正确');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hash(token);
  await setDocument(SESSION_COLLECTION, tokenHash, {
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    createdAt: Date.now()
  });
  return { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
}

async function requireAdmin(token) {
  if (!token) throw new Error('管理员会话不存在，请重新登录');
  const tokenHash = hash(token);
  const session = await getDocument(SESSION_COLLECTION, tokenHash);
  if (!session || Number(session.expiresAt || 0) <= Date.now()) {
    await removeDocument(SESSION_COLLECTION, tokenHash);
    throw new Error('管理员会话已过期，请重新登录');
  }
  return tokenHash;
}

exports.main = async (event = {}) => {
  try {
    const action = event.action;

    if (action === 'health') {
      return ok({ service: 'gc-api', version: 4, time: Date.now() });
    }

    if (action === 'getContent') {
      return ok(await getContent());
    }

    if (action === 'viewStatus') {
      return ok(await viewState(cleanText(event.visitorId, 120)));
    }

    if (action === 'checkView') {
      const visitorId = cleanText(event.visitorId, 120);
      const postId = cleanText(event.postId, 100);
      if (!visitorId || !postId) return fail('缺少访客或文章标识');
      return ok(await checkView(visitorId, postId));
    }

    if (action === 'submitPost') {
      return ok(await createSubmission('post', event));
    }

    if (action === 'submitComment') {
      return ok(await createSubmission('comment', event));
    }

    if (action === 'adminLogin') {
      return ok(await adminLogin(String(event.password || '')));
    }

    if (action === 'adminLogout') {
      const tokenHash = hash(String(event.token || ''));
      await removeDocument(SESSION_COLLECTION, tokenHash);
      return ok({ loggedOut: true });
    }

    if (action === 'saveContent') {
      await requireAdmin(String(event.token || ''));
      return ok(await saveContent(event.data));
    }

    if (action === 'listSubmissions') {
      await requireAdmin(String(event.token || ''));
      const result = await db.collection(SUBMISSION_COLLECTION)
        .where({ status: 'pending' })
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      return ok(result.data || []);
    }

    if (action === 'setMembership') {
      await requireAdmin(String(event.token || ''));
      const visitorId = cleanText(event.visitorId, 120);
      const visitorHash = hash(visitorId).slice(0, 40);
      await setDocument(MEMBERSHIP_COLLECTION, visitorHash, {
        status: event.status === 'active' ? 'active' : 'inactive',
        expiresAt: Number(event.expiresAt || 0),
        updatedAt: Date.now()
      });
      return ok({ updated: true });
    }

    if (action === 'createOrderPlaceholder') {
      const order = {
        visitorHash: hash(cleanText(event.visitorId, 120)),
        status: 'payment_disabled',
        amount: 0,
        createdAt: Date.now()
      };
      const result = await db.collection(ORDER_COLLECTION).add(order);
      return ok({ id: result.id || result._id, status: order.status });
    }

    return fail('未知操作', 'UNKNOWN_ACTION');
  } catch (error) {
    console.error(error);
    return fail(error.message || '服务器内部错误', 'SERVER_ERROR');
  }
};
