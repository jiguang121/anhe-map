const GC_ADMIN_OK_KEY = 'gc_admin_ok';
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

async function refreshAdminData() {
  adminData = await gcLoadData();
}

async function requireAdmin() {
  const ok = sessionStorage.getItem(GC_ADMIN_OK_KEY) === '1';
  $('adminLoginCard').classList.toggle('hidden', ok);
  $('adminWorkspace').classList.toggle('hidden', !ok);
  $('adminEmailLabel').classList.toggle('hidden', !gcIsCloudMode());
  $('adminModeHint').textContent = gcIsCloudMode()
    ? '当前是 Supabase 云数据库模式。请使用已加入 gc_admins 的管理员邮箱和密码登录。'
    : '当前还没配置 Supabase，是本地演示模式。管理密码：genius-admin。';

  if (ok) {
    await refreshAdminData();
    renderAdmin();
  }
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

async function reloadAfterSave(message) {
  await refreshAdminData();
  renderAdmin();
  showToast(message);
}

function bindEvents() {
  $('adminLoginBtn').addEventListener('click', async () => {
    const password = $('adminLoginPassword').value.trim();
    try {
      if (gcIsCloudMode()) {
        const email = $('adminLoginEmail').value.trim();
        if (!email || !password) return showToast('邮箱和密码都要填写');
        await gcSignInAdmin(email, password);
      } else {
        const data = gcLocalGetData();
        if (password !== data.site.adminPassword) return showToast('管理密码不对');
      }
      sessionStorage.setItem(GC_ADMIN_OK_KEY, '1');
      await requireAdmin();
      showToast('已进入后台');
    } catch (error) {
      console.error(error);
      showToast(error.message || '登录失败');
    }
  });

  $('saveSiteBtn').addEventListener('click', async () => {
    const data = getData();
    const site = {
      ...data.site,
      eyebrow: $('siteEyebrow').value.trim(),
      title: $('siteTitle').value.trim(),
      subtitle: $('siteSubtitle').value.trim(),
      feedEyebrow: $('siteFeedEyebrow').value.trim(),
      shareButtonText: $('siteShareButton').value.trim(),
      visitorLabel: $('siteVisitorLabel').value.trim(),
      memberLabel: $('siteMemberLabel').value.trim(),
      viewLimit: Math.max(0, Number($('siteViewLimit').value || 0)),
      payTitle: $('sitePayTitle').value.trim(),
      payText: $('sitePayText').value.trim(),
      payButtonText: $('sitePayButton').value.trim(),
      loginText: $('siteLoginText').value.trim()
    };
    try {
      await gcSaveSite(site);
      await reloadAfterSave(gcIsCloudMode() ? '基础设置已保存到云端' : '基础设置已保存到本机');
    } catch (error) {
      console.error(error);
      showToast('保存失败，请检查权限');
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
      await reloadAfterSave(gcIsCloudMode() ? '入口已保存到云端' : '入口已保存到本机');
    } catch (error) {
      console.error(error);
      showToast('保存失败，请检查权限');
    }
  });

  $('newPostBtn').addEventListener('click', async () => {
    const data = getData();
    const firstCategory = data.categories[0]?.id || 'privacy';
    try {
      const post = await gcCreatePost({ category: firstCategory, title: '新文章', content: '这里写正文。' });
      selectedPostId = post.id;
      await reloadAfterSave(gcIsCloudMode() ? '已在云端新建文章' : '已在本机新建文章');
    } catch (error) {
      console.error(error);
      showToast('新建失败，请检查权限');
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
      await reloadAfterSave(gcIsCloudMode() ? '文章已保存到云端' : '文章已保存到本机');
    } catch (error) {
      console.error(error);
      showToast('保存失败，请检查权限');
    }
  });

  $('deletePostBtn').addEventListener('click', async () => {
    if (!selectedPostId) return showToast('请先选择文章');
    const ok = window.confirm('确定删除这篇文章吗？');
    if (!ok) return;
    try {
      await gcDeletePost(selectedPostId);
      selectedPostId = null;
      await reloadAfterSave(gcIsCloudMode() ? '文章已从云端删除' : '文章已从本机删除');
    } catch (error) {
      console.error(error);
      showToast('删除失败，请检查权限');
    }
  });

  $('exportDataBtn').addEventListener('click', () => {
    $('dataJson').value = JSON.stringify(getData(), null, 2);
    showToast('已导出到文本框');
  });

  $('importDataBtn').addEventListener('click', () => {
    showToast('V3 云端导入暂未开放；本机模式可继续用 V2 导入');
  });

  $('resetDataBtn').addEventListener('click', () => {
    showToast('V3 暂不允许一键重置，避免误删云端内容');
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
