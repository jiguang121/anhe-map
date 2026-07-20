const cloudbase = require('@cloudbase/node-sdk');
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

function defaultContent() {
  const now = Date.now();
  return {
    version: 4,
    site: {
      eyebrow: 'GENIUS CLUB · 匿名内场',
      title: '天才俱乐部',
      subtitle: '把不适合公开说的话，放进一个会漂浮的秘密房间。',
      feedEyebrow: 'GENIUS CLUB',
      shareButtonText: '匿名分享',
      visitorLabel: '访客模式',
      memberLabel: '会员模式',
      dailyFreeViews: 5,
      viewLimit: 5,
      paymentEnabled: false,
      payTitle: '今天的免费阅读额度已经用完',
      payText: '每天可免费查看 5 条完整内容。会员功能正在内测，正式开放后可无限查看；今天可以先收藏页面，明天继续。',
      payButtonText: '会员即将开放',
      loginTitle: '会员功能内测中',
      loginText: '当前阶段先开放每日免费阅读，后续再开放正式会员与支付。'
    },
    categories: [
      { id: 'privacy', name: '隐私', tagline: '不能说的边界', orbClass: 'orb-privacy' },
      { id: 'mind', name: '心事', tagline: '没人接住的念头', orbClass: 'orb-mind' },
      { id: 'leak', name: '爆料', tagline: '风声从这里开始', orbClass: 'orb-leak' }
    ],
    posts: [
      {
        id: 'p_privacy_1',
        category: 'privacy',
        title: '我把最真实的一面藏得很好',
        content: '白天我像一个很正常的人，回消息、做事、开玩笑。可是只有我自己知道，我真正害怕的是被别人看见那个不够体面的自己。',
        createdAt: now - 38 * 60 * 1000,
        comments: ['有时候越正常的人，越需要一个出口。', '这里至少可以不用装。']
      },
      {
        id: 'p_privacy_2',
        category: 'privacy',
        title: '有些关系，我已经在心里退场了',
        content: '我没有拉黑，也没有吵架，只是突然发现，我已经不期待那个人理解我了。关系还在，但我已经不在里面了。',
        createdAt: now - 88 * 60 * 1000,
        comments: ['懂，这种退场是安静的。']
      },
      {
        id: 'p_mind_1',
        category: 'mind',
        title: '我总觉得自己不该只过这种人生',
        content: '不是现在的生活完全不好，而是我心里一直有个声音：我不应该只是这样上班、吃饭、睡觉、等时间过去。我想要一点更大的东西。',
        createdAt: now - 120 * 60 * 1000,
        comments: ['这种不甘心，可能就是入口。', '我也经常有这个感觉。']
      },
      {
        id: 'p_mind_2',
        category: 'mind',
        title: '成年人最难的是没有人接住你',
        content: '小时候难过可以哭，长大后难过还要回消息。很多时候不是事情多严重，而是身边没有一个可以完全说真话的人。',
        createdAt: now - 200 * 60 * 1000,
        comments: ['太准了。', '匿名反而更像真实。']
      },
      {
        id: 'p_leak_1',
        category: 'leak',
        title: '有人表面光鲜，其实早就欠了一圈钱',
        content: '朋友圈里越是展示精致生活的人，不一定真的过得好。有些人的体面全靠借来的现金流撑着，只是没人把账本摊开看。',
        createdAt: now - 260 * 60 * 1000,
        comments: ['很多人是在演稳定。', '账本比朋友圈诚实。']
      },
      {
        id: 'p_leak_2',
        category: 'leak',
        title: '公司最会画饼的人，往往最懂人性',
        content: '很多承诺不是为了兑现，而是为了让你暂时继续卖力。等你发现的时候，饼已经换了一张新的。',
        createdAt: now - 330 * 60 * 1000,
        comments: ['这句可以贴工位上。']
      }
    ]
  };
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
  return db.collection(collection).doc(id).set(data);
}

async function removeDocument(collection, id) {
  try {
    await db.collection(collection).doc(id).remove();
  } catch (error) {
    if (!/not exist|not found|DOCUMENT_NOT_EXIST/i.test(error.message || '')) throw error;
  }
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

async function getContent() {
  const record = await getDocument(CONTENT_COLLECTION, 'main');
  if (record?.data) return record.data;
  return saveContent(defaultContent());
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
        .limit(100)
        .get();
      const rows = (result.data || []).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      return ok(rows);
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
