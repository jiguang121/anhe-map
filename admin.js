const GC_STORAGE_KEY = 'gc_v2_site_data';
const GC_ADMIN_OK_KEY = 'gc_admin_ok';
const GC_MEMBER_KEY = 'gc_member';
const GC_NICKNAME_KEY = 'gc_nickname';
const GC_VIEW_COUNT_KEY = 'gc_view_count';

let selectedPostId = null;

function $(id) {
  return document.getElementById(id);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultData() {
  const data = clone(window.GC_DEFAULT_DATA);
  const now = Date.now();
  data.posts = data.posts.map(post => ({
    ...post,
    createdAt: post.createdAt || now - Number(post.createdAtOffsetMinutes || 0) * 60 * 1000,
    comments: Array.isArray(post.comments) ? post.comments : []
  }));
  return data;
}

function getData() {
  const raw = localStorage.getItem(GC_STORAGE_KEY);
  if (!raw) {
    const data = createDefaultData();
    saveData(data);
    return data;
  }
  try {
    const data = JSON.parse(raw);
    if (!data.site || !Array.isArray(data.categories) || !Array.isArray(data.posts)) {
      throw new Error('Invalid data shape');
    }
    return data;
  } catch {
    const data = createDefaultData();
    saveData(data);
    return data;
  }
}

function saveData(data) {
  data.version = 2;
  localStorage.setItem(GC_STORAGE_KEY, JSON.stringify(data));
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function requireAdmin() {
  const ok = sessionStorage.getItem(GC_ADMIN_OK_KEY) === '1';
  $('adminLoginCard').classList.toggle('hidden', ok);
  $('adminWorkspace').classList.toggle('hidden', !ok);
  if (ok) renderAdmin();
}

function fillCategoryOptions() {
  const data = getData();
  const options = data.categories.map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join('');
  $('categorySelect').innerHTML = options;
  $('postCategory').innerHTML = options;
}

function renderSiteForm() {
  const { site } = getData();
  $('siteEyebrow').value = site.eyebrow || '';
  $('siteTitle').value = site.title || '';
  $('siteSubtitle').value = site.subtitle || '';
  $('siteFeedEyebrow').value = site.feedEyebrow || '';
  $('siteShareButton').value = site.shareButtonText || '';
  $('siteVisitorLabel').value = site.visitorLabel || '';
  $('siteMemberLabel').value = site.memberLabel || '';
  $('siteViewLimit').value = Number(site.viewLimit || 5);
  $('sitePayTitle').value = site.payTitle || '';
  $('sitePayText').value = site.payText || '';
  $('sitePayButton').value = site.payButtonText || '';
  $('siteLoginText').value = site.loginText || '';
}

function renderCategoryForm() {
  const data = getData();
  const id = $('categorySelect').value || data.categories[0]?.id;
  const category = data.categories.find(item => item.id === id) || data.categories[0];
  if (!category) return;
  $('categorySelect').value = category.id;
  $('categoryName').value = category.name || '';
  $('categoryTagline').value = category.tagline || '';
}

function renderPostList() {
  const data = getData();
  const categoryName = id => data.categories.find(category => category.id === id)?.name || id;
  if (!selectedPostId && data.posts[0]) selectedPostId = data.posts[0].id;

  $('adminPostList').innerHTML = data.posts
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .map(post => `
      <button class="admin-post-item ${post.id === selectedPostId ? 'active' : ''}" data-post-id="${escapeHtml(post.id)}">
        <strong>${escapeHtml(post.title || '未命名文章')}</strong>
        <span>${escapeHtml(categoryName(post.category))} · ${post.comments?.length || 0} 条评论</span>
      </button>
    `).join('') || '<div class="empty-card">还没有文章。</div>';

  document.querySelectorAll('.admin-post-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedPostId = item.dataset.postId;
      renderPostList();
      renderPostEditor();
    });
  });
}

function renderPostEditor() {
  const data = getData();
  const post = data.posts.find(item => item.id === selectedPostId);
  if (!post) {
    $('postId').value = '';
    $('postTitleAdmin').value = '';
    $('postContentAdmin').value = '';
    $('postCommentsAdmin').value = '';
    return;
  }
  $('postId').value = post.id;
  $('postCategory').value = post.category;
  $('postTitleAdmin').value = post.title || '';
  $('postContentAdmin').value = post.content || '';
  $('postCommentsAdmin').value = (post.comments || []).join('\n');
}

function renderAdmin() {
  fillCategoryOptions();
  renderSiteForm();
  renderCategoryForm();
  renderPostList();
  renderPostEditor();
}

function bindEvents() {
  $('adminLoginBtn').addEventListener('click', () => {
    const data = getData();
    const password = $('adminLoginPassword').value.trim();
    if (password !== data.site.adminPassword) return showToast('管理密码不对');
    sessionStorage.setItem(GC_ADMIN_OK_KEY, '1');
    requireAdmin();
    showToast('已进入后台');
  });

  $('saveSiteBtn').addEventListener('click', () => {
    const data = getData();
    data.site.eyebrow = $('siteEyebrow').value.trim();
    data.site.title = $('siteTitle').value.trim();
    data.site.subtitle = $('siteSubtitle').value.trim();
    data.site.feedEyebrow = $('siteFeedEyebrow').value.trim();
    data.site.shareButtonText = $('siteShareButton').value.trim();
    data.site.visitorLabel = $('siteVisitorLabel').value.trim();
    data.site.memberLabel = $('siteMemberLabel').value.trim();
    data.site.viewLimit = Math.max(0, Number($('siteViewLimit').value || 0));
    data.site.payTitle = $('sitePayTitle').value.trim();
    data.site.payText = $('sitePayText').value.trim();
    data.site.payButtonText = $('sitePayButton').value.trim();
    data.site.loginText = $('siteLoginText').value.trim();
    saveData(data);
    showToast('基础设置已保存');
  });

  $('categorySelect').addEventListener('change', renderCategoryForm);

  $('saveCategoryBtn').addEventListener('click', () => {
    const data = getData();
    const id = $('categorySelect').value;
    const category = data.categories.find(item => item.id === id);
    if (!category) return;
    category.name = $('categoryName').value.trim() || category.name;
    category.tagline = $('categoryTagline').value.trim();
    saveData(data);
    fillCategoryOptions();
    $('categorySelect').value = id;
    renderPostList();
    showToast('入口已保存');
  });

  $('newPostBtn').addEventListener('click', () => {
    const data = getData();
    const firstCategory = data.categories[0]?.id || 'privacy';
    const post = {
      id: `post_${Date.now()}`,
      category: firstCategory,
      title: '新文章',
      content: '这里写正文。',
      createdAt: Date.now(),
      comments: []
    };
    data.posts.unshift(post);
    selectedPostId = post.id;
    saveData(data);
    renderPostList();
    renderPostEditor();
    showToast('已新建文章');
  });

  $('savePostBtn').addEventListener('click', () => {
    const data = getData();
    const post = data.posts.find(item => item.id === selectedPostId);
    if (!post) return showToast('请先选择文章');
    post.category = $('postCategory').value;
    post.title = $('postTitleAdmin').value.trim() || '未命名文章';
    post.content = $('postContentAdmin').value.trim();
    post.comments = $('postCommentsAdmin').value
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    saveData(data);
    renderPostList();
    showToast('文章已保存');
  });

  $('deletePostBtn').addEventListener('click', () => {
    if (!selectedPostId) return showToast('请先选择文章');
    const ok = window.confirm('确定删除这篇文章吗？');
    if (!ok) return;
    const data = getData();
    data.posts = data.posts.filter(post => post.id !== selectedPostId);
    selectedPostId = data.posts[0]?.id || null;
    saveData(data);
    renderPostList();
    renderPostEditor();
    showToast('文章已删除');
  });

  $('exportDataBtn').addEventListener('click', () => {
    $('dataJson').value = JSON.stringify(getData(), null, 2);
    showToast('已导出到文本框');
  });

  $('importDataBtn').addEventListener('click', () => {
    try {
      const data = JSON.parse($('dataJson').value);
      if (!data.site || !Array.isArray(data.categories) || !Array.isArray(data.posts)) {
        throw new Error('数据格式不对');
      }
      saveData(data);
      selectedPostId = data.posts[0]?.id || null;
      renderAdmin();
      showToast('已导入数据');
    } catch {
      showToast('JSON 格式不对，导入失败');
    }
  });

  $('resetDataBtn').addEventListener('click', () => {
    const ok = window.confirm('确定恢复默认内容吗？这会覆盖本机后台修改。');
    if (!ok) return;
    const data = createDefaultData();
    saveData(data);
    selectedPostId = data.posts[0]?.id || null;
    renderAdmin();
    showToast('已恢复默认内容');
  });

  $('clearMemberBtn').addEventListener('click', () => {
    localStorage.removeItem(GC_MEMBER_KEY);
    localStorage.removeItem(GC_NICKNAME_KEY);
    localStorage.removeItem(GC_VIEW_COUNT_KEY);
    showToast('已清除本机会员/浏览状态');
  });
}

bindEvents();
requireAdmin();
