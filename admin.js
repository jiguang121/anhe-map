const GC_MEMBER_KEY = 'gc_member';
const GC_NICKNAME_KEY = 'gc_nickname';
const GC_VIEW_COUNT_KEY = 'gc_view_count';

let selectedPostId = null;
let adminData = null;

function $(id) {
  return document.getElementById(id);
}

function getData() {
  return adminData || gcCreateDefaultData();
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function refreshAdminData() {
  const loaded = await gcLoadData();
  adminData = loaded || gcLocalGetData();
}

async function requireAdmin() {
  const ok = gcHasAdminSession();
  $('adminLoginCard').classList.toggle('hidden', ok);
  $('adminWorkspace').classList.toggle('hidden', !ok);
  $('adminEmailLabel').classList.add('hidden');
  $('adminModeHint').textContent = '当前使用腾讯云 CloudBase 国内后台。请输入云函数环境变量中设置的管理员密码。';

  if (ok) {
    await refreshAdminData();
    renderAdmin();
  }
}

function fillCategoryOptions() {
  const data = getData();
  const options = data.categories
    .map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`)
    .join('');
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
  $('siteViewLimit').value = Number(site.dailyFreeViews ?? site.viewLimit ?? 5);
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
    .slice()
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

async function reloadAfterSave(message) {
  await refreshAdminData();
  renderAdmin();
  showToast(message);
}

function normalizeComments(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean).slice(0, 50);
  }
  if (typeof value === 'string') {
    return value.split('\n').map(item => item.trim()).filter(Boolean).slice(0, 50);
  }
  return [];
}

function normalizeImportedPosts(rawPosts) {
  if (!Array.isArray(rawPosts)) throw new Error('JSON 中没有可导入的文章数组');

  const data = getData();
  const validCategories = new Set(data.categories.map(category => category.id));
  const fallbackCategory = data.categories[0]?.id || 'privacy';
  const baseTime = Date.now();

  return rawPosts.map((rawPost, index) => {
    if (!rawPost || typeof rawPost !== 'object') {
      throw new Error(`第 ${index + 1} 篇文章格式不正确`);
    }

    const title = String(rawPost.title || '').trim();
    const content = String(rawPost.content || '').trim();
    if (!title || !content) {
      throw new Error(`第 ${index + 1} 篇文章缺少标题或正文`);
    }

    const rawId = String(rawPost.id || '').trim();
    const id = rawId || `import_${baseTime}_${index + 1}_${Math.random().toString(36).slice(2, 7)}`;
    const category = validCategories.has(rawPost.category) ? rawPost.category : fallbackCategory;
    const createdAt = Number(rawPost.createdAt) > 0
      ? Number(rawPost.createdAt)
      : baseTime - index * 7 * 60 * 1000;

    return {
      id: id.slice(0, 100),
      category,
      title: title.slice(0, 80),
      content: content.slice(0, 5000),
      createdAt,
      comments: normalizeComments(rawPost.comments)
    };
  });
}

function extractPostsFromImport(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray(raw.posts)) return raw.posts;
  throw new Error('请粘贴文章数组，或包含 posts 数组的 JSON');
}

function mergeImportedPosts(currentData, incomingPosts) {
  const incomingIds = new Set(incomingPosts.map(post => post.id));
  const untouchedPosts = currentData.posts.filter(post => !incomingIds.has(post.id));
  return {
    ...cloneData(currentData),
    posts: [...incomingPosts, ...untouchedPosts]
  };
}

function bindEvents() {
  $('adminLoginBtn').addEventListener('click', async () => {
    const password = $('adminLoginPassword').value.trim();
    if (!password) return showToast('请输入管理密码');
    try {
      await gcSignInAdmin('', password);
      await requireAdmin();
      showToast('已进入 CloudBase 后台');
    } catch (error) {
      console.error(error);
      showToast(error.message || '登录失败');
    }
  });

  $('saveSiteBtn').addEventListener('click', async () => {
    const data = getData();
    const dailyFreeViews = Math.max(0, Number($('siteViewLimit').value || 0));
    const site = {
      ...data.site,
      eyebrow: $('siteEyebrow').value.trim(),
      title: $('siteTitle').value.trim(),
      subtitle: $('siteSubtitle').value.trim(),
      feedEyebrow: $('siteFeedEyebrow').value.trim(),
      shareButtonText: $('siteShareButton').value.trim(),
      visitorLabel: $('siteVisitorLabel').value.trim(),
      memberLabel: $('siteMemberLabel').value.trim(),
      dailyFreeViews,
      viewLimit: dailyFreeViews,
      paymentEnabled: false,
      payTitle: $('sitePayTitle').value.trim(),
      payText: $('sitePayText').value.trim(),
      payButtonText: $('sitePayButton').value.trim(),
      loginText: $('siteLoginText').value.trim()
    };
    try {
      await gcSaveSite(site);
      await reloadAfterSave('基础设置已保存到 CloudBase');
    } catch (error) {
      console.error(error);
      showToast(error.message || '保存失败');
    }
  });

  $('categorySelect').addEventListener('change', renderCategoryForm);

  $('saveCategoryBtn').addEventListener('click', async () => {
    const data = getData();
    const id = $('categorySelect').value;
    const category = data.categories.find(item => item.id === id);
    if (!category) return;
    const nextCategory = {
      ...category,
      name: $('categoryName').value.trim() || category.name,
      tagline: $('categoryTagline').value.trim()
    };
    try {
      await gcSaveCategory(nextCategory);
      await reloadAfterSave('入口设置已保存到 CloudBase');
    } catch (error) {
      console.error(error);
      showToast(error.message || '保存失败');
    }
  });

  $('newPostBtn').addEventListener('click', async () => {
    const data = getData();
    const firstCategory = data.categories[0]?.id || 'privacy';
    try {
      const post = await gcCreatePost({ category: firstCategory, title: '新文章', content: '这里写正文。' });
      selectedPostId = post.id;
      await reloadAfterSave('已在 CloudBase 新建文章');
    } catch (error) {
      console.error(error);
      showToast(error.message || '新建失败');
    }
  });

  $('savePostBtn').addEventListener('click', async () => {
    if (!selectedPostId) return showToast('请先选择文章');
    const post = {
      id: selectedPostId,
      category: $('postCategory').value,
      title: $('postTitleAdmin').value.trim() || '未命名文章',
      content: $('postContentAdmin').value.trim(),
      comments: $('postCommentsAdmin').value
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean)
    };
    try {
      await gcUpdatePost(post);
      await reloadAfterSave('文章已保存到 CloudBase');
    } catch (error) {
      console.error(error);
      showToast(error.message || '保存失败');
    }
  });

  $('deletePostBtn').addEventListener('click', async () => {
    if (!selectedPostId) return showToast('请先选择文章');
    if (!window.confirm('确定删除这篇文章吗？')) return;
    try {
      await gcDeletePost(selectedPostId);
      selectedPostId = null;
      await reloadAfterSave('文章已从 CloudBase 删除');
    } catch (error) {
      console.error(error);
      showToast(error.message || '删除失败');
    }
  });

  $('loadStarterBtn').addEventListener('click', () => {
    const posts = Array.isArray(window.GC_STARTER_POSTS) ? window.GC_STARTER_POSTS : [];
    if (!posts.length) return showToast('首批内容文件没有加载成功');
    $('dataJson').value = JSON.stringify(posts, null, 2);
    showToast(`已载入 ${posts.length} 篇，确认内容后点击“导入下方 JSON 到云端”`);
  });

  $('importDataBtn').addEventListener('click', async () => {
    const rawText = $('dataJson').value.trim();
    if (!rawText) return showToast('请先载入或粘贴 JSON');

    try {
      const parsed = JSON.parse(rawText);
      const importedPosts = normalizeImportedPosts(extractPostsFromImport(parsed));
      const duplicateCount = importedPosts.filter(post => getData().posts.some(item => item.id === post.id)).length;
      const message = `将导入 ${importedPosts.length} 篇文章。${duplicateCount ? `其中 ${duplicateCount} 篇会更新同 ID 文章。` : ''}其他已有文章不会删除。确定继续吗？`;
      if (!window.confirm(message)) return;

      const nextData = mergeImportedPosts(getData(), importedPosts);
      await gcSaveContent(nextData);
      selectedPostId = importedPosts[0]?.id || selectedPostId;
      await reloadAfterSave(`已导入 ${importedPosts.length} 篇文章到 CloudBase`);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'JSON 导入失败');
    }
  });

  $('exportDataBtn').addEventListener('click', () => {
    $('dataJson').value = JSON.stringify(getData(), null, 2);
    showToast('已导出当前全部内容到文本框');
  });

  $('resetDataBtn').addEventListener('click', () => {
    showToast('为避免误删云端数据，已关闭一键重置');
  });

  $('clearMemberBtn').addEventListener('click', () => {
    localStorage.removeItem(GC_MEMBER_KEY);
    localStorage.removeItem(GC_NICKNAME_KEY);
    localStorage.removeItem(GC_VIEW_COUNT_KEY);
    showToast('已清除本机旧版会员状态');
  });
}

bindEvents();
requireAdmin();
