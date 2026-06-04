const GC_MEMBER_KEY = 'gc_member';
const GC_NICKNAME_KEY = 'gc_nickname';
const GC_VIEW_COUNT_KEY = 'gc_view_count';

const state = {
  data: null,
  currentCategory: 'privacy',
  currentPostId: null,
  isMember: localStorage.getItem(GC_MEMBER_KEY) === '1',
  nickname: localStorage.getItem(GC_NICKNAME_KEY) || '',
  viewCount: Number(localStorage.getItem(GC_VIEW_COUNT_KEY) || 0)
};

function $(id) {
  return document.getElementById(id);
}

function getData() {
  return state.data || gcCreateDefaultData();
}

function getCategoryById(data, id) {
  return data.categories.find(category => category.id === id) || data.categories[0];
}

function categoryName(data, id) {
  return getCategoryById(data, id)?.name || id;
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function openModal(id) {
  const modal = $(id);
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const modal = $(id);
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active-screen'));
  $(screenId).classList.add('active-screen');
}

function formatTime(timestamp) {
  const diff = Math.floor((Date.now() - Number(timestamp || Date.now())) / 60000);
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff} 分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`;
  return `${Math.floor(diff / 1440)} 天前`;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function refreshData() {
  state.data = await gcLoadData();
  if (!state.data.categories.some(category => category.id === state.currentCategory)) {
    state.currentCategory = state.data.categories[0]?.id || 'privacy';
  }
}

function renderHome() {
  const data = getData();
  $('homeEyebrow').textContent = data.site.eyebrow;
  $('homeTitle').textContent = data.site.title;
  $('homeSubtitle').textContent = data.site.subtitle;
  $('shareBtn').textContent = data.site.shareButtonText || '匿名分享';
  $('feedEyebrow').textContent = data.site.feedEyebrow || 'GENIUS CLUB';
  $('payTitle').textContent = data.site.payTitle || '你已经看完免费内容';
  $('payText').textContent = data.site.payText || '继续查看完整秘密，需要登录会员。';
  $('mockPayBtn').textContent = data.site.payButtonText || '模拟开通会员';
  $('loginTitle').textContent = data.site.loginTitle || '演示登录';
  $('loginText').textContent = data.site.loginText || '输入任意昵称即可成为会员。';

  $('orbStage').innerHTML = data.categories.map(category => `
    <button class="orb ${escapeHtml(category.orbClass || '')}" data-category="${escapeHtml(category.id)}">
      <span>${escapeHtml(category.name)}</span>
      <small>${escapeHtml(category.tagline)}</small>
    </button>
  `).join('');
}

function updateStatus() {
  const data = getData();
  const limit = Number(data.site.viewLimit || 5);
  $('memberStatus').textContent = state.isMember
    ? `${data.site.memberLabel || '会员模式'} · ${state.nickname || '匿名天才'}`
    : data.site.visitorLabel || '游客模式';
  $('viewCount').textContent = state.isMember
    ? '会员可查看全部内容'
    : `今日已浏览 ${state.viewCount} / ${limit}`;
}

function renderPosts() {
  const data = getData();
  updateStatus();
  $('categoryTitle').textContent = categoryName(data, state.currentCategory);
  const posts = data.posts
    .filter(post => post.category === state.currentCategory)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  if (!posts.length) {
    $('postList').innerHTML = '<div class="empty-card">这个分类还没有内容。你可以先匿名发布一条，或者到后台添加。</div>';
    return;
  }

  $('postList').innerHTML = posts.map(post => {
    const preview = post.content.length > 72 ? `${post.content.slice(0, 72)}……` : post.content;
    return `
      <article class="post-card">
        <div class="post-meta">
          <span>匿名成员</span>
          <span>${formatTime(post.createdAt)}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(preview)}</p>
        <div class="card-actions">
          <span>${post.comments?.length || 0} 条评论 · ${escapeHtml(categoryName(data, post.category))}</span>
          <button class="read-btn" data-post-id="${escapeHtml(post.id)}">查看完整内容</button>
        </div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.read-btn').forEach(btn => {
    btn.addEventListener('click', () => openPost(btn.dataset.postId));
  });
}

function openPost(postId) {
  const data = getData();
  const limit = Number(data.site.viewLimit || 5);
  if (!state.isMember && state.viewCount >= limit) {
    openModal('payModal');
    return;
  }

  const post = data.posts.find(item => item.id === postId);
  if (!post) return;

  if (!state.isMember) {
    state.viewCount += 1;
    localStorage.setItem(GC_VIEW_COUNT_KEY, String(state.viewCount));
  }

  state.currentPostId = postId;
  $('detailMeta').textContent = `匿名成员 · ${formatTime(post.createdAt)} · ${categoryName(data, post.category)}`;
  $('detailTitle').textContent = post.title;
  $('detailContent').textContent = post.content;
  renderComments(post);
  updateStatus();
  openModal('detailModal');
}

function renderComments(post) {
  const comments = post.comments || [];
  $('commentList').innerHTML = comments.length
    ? comments.map(comment => `<div class="comment-item">${escapeHtml(comment)}</div>`).join('')
    : '<div class="comment-item">还没有评论，做第一个说话的人。</div>';
}

function bindEvents() {
  $('orbStage').addEventListener('click', event => {
    const orb = event.target.closest('.orb');
    if (!orb) return;
    state.currentCategory = orb.dataset.category;
    switchScreen('feed');
    renderPosts();
  });

  $('backBtn').addEventListener('click', () => switchScreen('home'));
  $('shareBtn').addEventListener('click', () => {
    const data = getData();
    $('postModalTitle').textContent = `分享到「${categoryName(data, state.currentCategory)}」`;
    openModal('postModal');
  });
  $('loginBtn').addEventListener('click', () => openModal('loginModal'));

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  $('submitPost').addEventListener('click', async () => {
    const title = $('postTitle').value.trim();
    const content = $('postContent').value.trim();
    if (!title || !content) return showToast('标题和内容都要写');
    try {
      await gcCreatePost({ category: state.currentCategory, title, content });
      $('postTitle').value = '';
      $('postContent').value = '';
      closeModal('postModal');
      await refreshData();
      renderHome();
      renderPosts();
      showToast(gcIsCloudMode() ? '已发布到云端' : '已匿名发布到本机');
    } catch (error) {
      console.error(error);
      showToast('发布失败，请稍后重试');
    }
  });

  $('submitComment').addEventListener('click', async () => {
    const value = $('commentInput').value.trim();
    if (!value) return showToast('先写一句评论');
    try {
      await gcAddComment(state.currentPostId, value);
      $('commentInput').value = '';
      await refreshData();
      const post = getData().posts.find(item => item.id === state.currentPostId);
      if (post) renderComments(post);
      renderPosts();
    } catch (error) {
      console.error(error);
      showToast('评论失败，请稍后重试');
    }
  });

  $('submitLogin').addEventListener('click', () => {
    const nickname = $('nicknameInput').value.trim() || '匿名天才';
    state.isMember = true;
    state.nickname = nickname;
    localStorage.setItem(GC_MEMBER_KEY, '1');
    localStorage.setItem(GC_NICKNAME_KEY, nickname);
    closeModal('loginModal');
    updateStatus();
    showToast('已进入会员模式');
  });

  $('mockPayBtn').addEventListener('click', () => {
    state.isMember = true;
    state.nickname = state.nickname || '匿名天才';
    localStorage.setItem(GC_MEMBER_KEY, '1');
    localStorage.setItem(GC_NICKNAME_KEY, state.nickname);
    closeModal('payModal');
    updateStatus();
    showToast('演示会员已开通');
  });
}

async function init() {
  $('postList').innerHTML = '<div class="empty-card">内容加载中……</div>';
  await refreshData();
  renderHome();
  bindEvents();
  updateStatus();
}

init();
