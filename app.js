const categoryMap = {
  privacy: '隐私',
  mind: '心事',
  leak: '爆料'
};

const seedPosts = [
  {
    id: crypto.randomUUID(),
    category: 'privacy',
    title: '我把最真实的一面藏得很好',
    content: '白天我像一个很正常的人，回消息、做事、开玩笑。可是只有我自己知道，我真正害怕的是被别人看见那个不够体面的自己。',
    createdAt: Date.now() - 1000 * 60 * 38,
    comments: ['有时候越正常的人，越需要一个出口。', '这里至少可以不用装。']
  },
  {
    id: crypto.randomUUID(),
    category: 'privacy',
    title: '有些关系，我已经在心里退场了',
    content: '我没有拉黑，也没有吵架，只是突然发现，我已经不期待那个人理解我了。关系还在，但我已经不在里面了。',
    createdAt: Date.now() - 1000 * 60 * 88,
    comments: ['懂，这种退场是安静的。']
  },
  {
    id: crypto.randomUUID(),
    category: 'mind',
    title: '我总觉得自己不该只过这种人生',
    content: '不是现在的生活完全不好，而是我心里一直有个声音：我不应该只是这样上班、吃饭、睡觉、等时间过去。我想要一点更大的东西。',
    createdAt: Date.now() - 1000 * 60 * 120,
    comments: ['这种不甘心，可能就是入口。', '我也经常有这个感觉。']
  },
  {
    id: crypto.randomUUID(),
    category: 'mind',
    title: '成年人最难的是没有人接住你',
    content: '小时候难过可以哭，长大后难过还要回消息。很多时候不是事情多严重，而是身边没有一个可以完全说真话的人。',
    createdAt: Date.now() - 1000 * 60 * 200,
    comments: ['太准了。', '匿名反而更像真实。']
  },
  {
    id: crypto.randomUUID(),
    category: 'leak',
    title: '有人表面光鲜，其实早就欠了一圈钱',
    content: '朋友圈里越是展示精致生活的人，不一定真的过得好。有些人的体面全靠借来的现金流撑着，只是没人把账本摊开看。',
    createdAt: Date.now() - 1000 * 60 * 260,
    comments: ['很多人是在演稳定。', '账本比朋友圈诚实。']
  },
  {
    id: crypto.randomUUID(),
    category: 'leak',
    title: '公司最会画饼的人，往往最懂人性',
    content: '很多承诺不是为了兑现，而是为了让你暂时继续卖力。等你发现的时候，饼已经换了一张新的。',
    createdAt: Date.now() - 1000 * 60 * 330,
    comments: ['这句可以贴工位上。']
  }
];

const state = {
  currentCategory: 'privacy',
  currentPostId: null,
  isMember: localStorage.getItem('gc_member') === '1',
  nickname: localStorage.getItem('gc_nickname') || '',
  viewCount: Number(localStorage.getItem('gc_view_count') || 0)
};

function getPosts() {
  const raw = localStorage.getItem('gc_posts');
  if (!raw) {
    localStorage.setItem('gc_posts', JSON.stringify(seedPosts));
    return seedPosts;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem('gc_posts', JSON.stringify(seedPosts));
    return seedPosts;
  }
}

function savePosts(posts) {
  localStorage.setItem('gc_posts', JSON.stringify(posts));
}

function $(id) {
  return document.getElementById(id);
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
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff} 分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`;
  return `${Math.floor(diff / 1440)} 天前`;
}

function updateStatus() {
  $('memberStatus').textContent = state.isMember ? `会员模式 · ${state.nickname || '匿名天才'}` : '游客模式';
  $('viewCount').textContent = state.isMember ? '会员可查看全部内容' : `今日已浏览 ${state.viewCount} / 5`;
}

function renderPosts() {
  updateStatus();
  $('categoryTitle').textContent = categoryMap[state.currentCategory];
  const posts = getPosts()
    .filter(post => post.category === state.currentCategory)
    .sort((a, b) => b.createdAt - a.createdAt);

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
          <span>${post.comments?.length || 0} 条评论 · ${categoryMap[post.category]}</span>
          <button class="read-btn" data-post-id="${post.id}">查看完整内容</button>
        </div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.read-btn').forEach(btn => {
    btn.addEventListener('click', () => openPost(btn.dataset.postId));
  });
}

function openPost(postId) {
  if (!state.isMember && state.viewCount >= 5) {
    openModal('payModal');
    return;
  }

  const posts = getPosts();
  const post = posts.find(item => item.id === postId);
  if (!post) return;

  if (!state.isMember) {
    state.viewCount += 1;
    localStorage.setItem('gc_view_count', String(state.viewCount));
  }

  state.currentPostId = postId;
  $('detailMeta').textContent = `匿名成员 · ${formatTime(post.createdAt)} · ${categoryMap[post.category]}`;
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

function addPost({ category, title, content }) {
  const posts = getPosts();
  posts.unshift({
    id: crypto.randomUUID(),
    category,
    title,
    content,
    createdAt: Date.now(),
    comments: []
  });
  savePosts(posts);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bindEvents() {
  document.querySelectorAll('.orb').forEach(orb => {
    orb.addEventListener('click', () => {
      state.currentCategory = orb.dataset.category;
      switchScreen('feed');
      renderPosts();
    });
  });

  $('backBtn').addEventListener('click', () => switchScreen('home'));
  $('shareBtn').addEventListener('click', () => {
    $('postModalTitle').textContent = `分享到「${categoryMap[state.currentCategory]}」`;
    openModal('postModal');
  });
  $('loginBtn').addEventListener('click', () => openModal('loginModal'));
  $('adminBtn').addEventListener('click', () => openModal('adminModal'));

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  $('submitPost').addEventListener('click', () => {
    const title = $('postTitle').value.trim();
    const content = $('postContent').value.trim();
    if (!title || !content) return showToast('标题和内容都要写');
    addPost({ category: state.currentCategory, title, content });
    $('postTitle').value = '';
    $('postContent').value = '';
    closeModal('postModal');
    renderPosts();
    showToast('已匿名发布');
  });

  $('submitComment').addEventListener('click', () => {
    const value = $('commentInput').value.trim();
    if (!value) return showToast('先写一句评论');
    const posts = getPosts();
    const post = posts.find(item => item.id === state.currentPostId);
    if (!post) return;
    post.comments = post.comments || [];
    post.comments.push(value);
    savePosts(posts);
    $('commentInput').value = '';
    renderComments(post);
    renderPosts();
  });

  $('submitLogin').addEventListener('click', () => {
    const nickname = $('nicknameInput').value.trim() || '匿名天才';
    state.isMember = true;
    state.nickname = nickname;
    localStorage.setItem('gc_member', '1');
    localStorage.setItem('gc_nickname', nickname);
    closeModal('loginModal');
    updateStatus();
    showToast('已进入会员模式');
  });

  $('mockPayBtn').addEventListener('click', () => {
    state.isMember = true;
    state.nickname = state.nickname || '匿名天才';
    localStorage.setItem('gc_member', '1');
    localStorage.setItem('gc_nickname', state.nickname);
    closeModal('payModal');
    updateStatus();
    showToast('演示会员已开通');
  });

  $('submitAdminPost').addEventListener('click', () => {
    const password = $('adminPassword').value.trim();
    const category = $('adminCategory').value;
    const title = $('adminTitle').value.trim();
    const content = $('adminContent').value.trim();
    if (password !== 'genius-admin') return showToast('管理密码不对');
    if (!title || !content) return showToast('标题和内容都要写');
    addPost({ category, title, content });
    $('adminTitle').value = '';
    $('adminContent').value = '';
    closeModal('adminModal');
    if (state.currentCategory === category) renderPosts();
    showToast('后台内容已添加');
  });
}

bindEvents();
updateStatus();
