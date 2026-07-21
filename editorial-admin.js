(function () {
  function downloadBackup(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `banju-content-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function replaceWithEditorialSeed(button) {
    if (!gcHasAdminSession()) {
      showToast('请先登录后台');
      return;
    }
    if (typeof window.GC_CREATE_EDITORIAL_SEED !== 'function') {
      showToast('300 篇内容生成器没有加载成功');
      return;
    }

    const meta = window.GC_EDITORIAL_SEED_META || {};
    const confirmed = window.confirm(
      `这会先下载当前内容备份，然后把云端现有文章全部替换为 ${meta.postCount || 300} 篇故事创作内容。\n\n` +
      `每个分类 ${meta.perCategory || 100} 篇，每篇 ${meta.commentsPerPost || 24} 条模拟讨论。\n\n` +
      '文章和评论会明确标注为故事创作 / 模拟讨论。确定继续吗？'
    );
    if (!confirmed) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '正在生成并写入 CloudBase…';

    try {
      const current = cloneData(getData());
      downloadBackup(current);

      const seed = window.GC_CREATE_EDITORIAL_SEED();
      const nextData = {
        ...current,
        version: Math.max(5, Number(current.version || 0)),
        site: {
          ...current.site,
          contentDisclosure: seed.disclosure,
          editorialSeedVersion: seed.version
        },
        posts: seed.posts
      };

      const serializedLength = JSON.stringify(nextData).length;
      if (serializedLength > 880000) {
        throw new Error(`生成内容体积过大（${serializedLength} 字符），已停止写入`);
      }

      await gcSaveContent(nextData);
      selectedPostId = seed.posts[0]?.id || null;
      await reloadAfterSave(`已替换为 ${seed.posts.length} 篇内容，并完成本地备份`);
    } catch (error) {
      console.error(error);
      showToast(error.message || '批量替换失败');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function installEditorialTools() {
    const stack = document.querySelector('.tool-stack');
    if (!stack || document.getElementById('replaceEditorialSeedBtn')) return;

    const note = document.createElement('p');
    note.className = 'hint editorial-admin-hint';
    note.textContent = '一键生成并替换：隐私、心事、爆料各 100 篇；每篇约 470–520 字，含 24 条带回复关系的模拟讨论。执行前会自动下载当前内容备份。';

    const button = document.createElement('button');
    button.id = 'replaceEditorialSeedBtn';
    button.className = 'danger-btn full';
    button.textContent = '备份并替换为 300 篇长内容';
    button.addEventListener('click', () => replaceWithEditorialSeed(button));

    stack.prepend(button);
    stack.parentElement?.insertBefore(note, stack);

    const commentsField = document.getElementById('postCommentsAdmin');
    const label = commentsField ? commentsField.closest('label') : null;
    if (label && label.firstChild) {
      label.firstChild.textContent = '展示评论，每行一条；以“↳”开头的行会显示为回复';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installEditorialTools);
  } else {
    installEditorialTools();
  }
}());
