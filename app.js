const state = {
  data: null,
  currentCategory: 'privacy',
  currentPostId: null
};

const BANJU_SITE_BRAND = {
  eyebrow: '半句故事记录',
  title: '半句',
  subtitle: '那些没说完、没说出口的话，都留在这里。',
  feedEyebrow: '半句 · 故事记录'
};

function $(id) {
  return document.getElementById(id);
}

function getData() {
  return state.data || gcCreateDefaultData();
}

function applyBanjuBrand(data) {
  if (!data?.site) return data;
  const oldBrandDetected = data.site.title === '天才俱乐部'
    || String(data.site.eyebrow || '').includes('GENIUS CLUB')
    || String(data.site.feedEyebrow || '').includes('GENIUS CLUB');

  if (oldBrandDetected) {
    data.site = { ...data.site, ...BANJU_SITE_BRAND };
  }
  return data;
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
  setTimeout(() => toast.classList.remove('show'), 2400);
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
  const loaded = await gcLoadData();
  state.data = applyBanjuBrand(loaded || gcLocalGetData());
  if (!state.data.categories.some(category => category.id === state.currentCategory)) {
    state.currentCategory = state.data.categories[0]?.id || 'privacy';
  }
}

function renderHome() {
  const data = getData();
  document.title = '半句故事记录';
  $('homeEyebrow').textContent = data.site.eyebrow || BANJU_SITE_BRAND.eyebrow;
  $('homeTitle').textContent = data.site.title || BANJU_SITE_BRAND.title;
  $('homeSubtitle').textContent = data.site.subtitle || BANJU_SITE_BRAND.subtitle;
  $('shareBtn').textContent = data.site.shareButtonText || '匿名分享';
  $('feedEyebrow').textContent = data.site.feedEyebrow || BANJU_SITE_BRAND.feedEyebrow;
  $('payTitle').textContent = '会员功能预留';
  $('payText').textContent = '当前版本全部内容开放浏览。';
  $('mockPayBtn').textContent = '返回内容';
  $('loginTitle').textContent = '会员功能预留';
  $('loginText').textContent = '当前版本无需登录即可浏览全部内容。';

  $('orbStage').innerHTML = data.categories.map(category => `
    <button class="orb ${escapeHtml(category.orbClass || '')}" data-category="${escapeHtml(category.id)}">
      <span>${escapeHtml(category.name)}</span>
      <small>${escapeHtml(category.tagline)}</small>
    </button>
  `).join('');
}

function updateStatus() {
  $('memberStatus').textContent = '开放浏览';
  $('viewCount').textContent = '全部内容均可查看';
}

function renderPosts() {
  const data = getData();
  updateStatus();
  $('categoryTitle').textContent = categoryName(data, state.currentCategory);
  const posts = data.posts
    .filter(post => post.category === state.currentCategory)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  if (!posts.length) {
    $('postList').innerHTML = '<div class="empty-card">这个分类还没有公开内容。</div>';
    return;
  }

  $('postList').innerHTML = posts.map(post => {
    const preview = post.content.length > 72 ? `${post.content.slice(0, 72)}……` : post.content;
    return `
      <article class="post-card">
        <div class="post-meta">
          <span>匿名读者</span>
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
  const post = data.posts.find(item => item.id === postId);
  if (!post) return;

  state.currentPostId = postId;
  $('detailMeta').textContent = `匿名读者 · ${formatTime(post.createdAt)} · ${categoryName(data, post.category)}`;
  $('detailTitle').textContent = post.title;
  $('detailContent').textContent = post.content;
  renderComments(post);
  openModal('detailModal');
}

function renderComments(post) {
  const comments = post.comments || [];
  $('commentList').innerHTML = comments.length
    ? comments.map(comment => `<div class="comment-item">${escapeHtml(comment)}</div>`).join('')
    : '<div class="comment-item">暂无公开评论。</div>';
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
    $('postModalTitle').textContent = `投稿到「${categoryName(data, state.currentCategory)}」`;
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
      await gcSubmitPost({ category: state.currentCategory, title, content });
      $('postTitle').value = '';
      $('postContent').value = '';
      closeModal('postModal');
      showToast('投稿已提交，审核通过后会公开');
    } catch (error) {
      console.error(error);
      showToast(error.message || '投稿失败，请稍后重试');
    }
  });

  $('submitComment').addEventListener('click', async () => {
    const value = $('commentInput').value.trim();
    if (!value) return showToast('先写一句评论');
    if (!state.currentPostId) return showToast('没有找到当前文章');

    const button = $('submitComment');
    button.disabled = true;
    button.textContent = '发布中…';

    try {
      const result = await gcSubmitComment(state.currentPostId, value);
      $('commentInput').value = '';

      if (result?.status === 'pending') {
        showToast('评论已提交审核');
        return;
      }

      await refreshData();
      const post = getData().posts.find(item => item.id === state.currentPostId);
      if (post) renderComments(post);
      renderPosts();
      showToast('评论已发布');
    } catch (error) {
      console.error(error);
      showToast(error.message || '评论失败，请稍后重试');
    } finally {
      button.disabled = false;
      button.textContent = '发布评论';
    }
  });

  $('submitLogin').addEventListener('click', () => closeModal('loginModal'));
  $('mockPayBtn').addEventListener('click', () => closeModal('payModal'));
}

async function init() {
  $('postList').innerHTML = '<div class="empty-card">内容加载中……</div>';
  await refreshData();
  renderHome();
  bindEvents();
  updateStatus();
}

init();