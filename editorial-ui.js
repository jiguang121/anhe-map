(function () {
  const DEFAULT_DISCLOSURE = '部分内容为平台匿名故事创作与模拟讨论，用于早期内容展示；内容不对应任何可识别的真实个人、机构或事件。';

  function commentParts(comment) {
    if (comment && typeof comment === 'object') {
      return {
        reply: Boolean(comment.replyTo || comment.parentId),
        author: String(comment.author || '匿名读者'),
        content: String(comment.content || '')
      };
    }

    let text = String(comment || '').trim();
    const reply = text.startsWith('↳');
    text = text.replace(/^↳\s*/, '');
    const separatorIndex = text.indexOf('：');
    return {
      reply,
      author: separatorIndex > 0 ? text.slice(0, separatorIndex).trim() : '匿名读者',
      content: separatorIndex > 0 ? text.slice(separatorIndex + 1).trim() : text
    };
  }

  function installNotice() {
    const stats = document.querySelector('.stats-card');
    if (!stats) return null;
    let notice = document.getElementById('editorialNotice');
    if (!notice) {
      notice = document.createElement('p');
      notice.id = 'editorialNotice';
      notice.className = 'editorial-notice';
      stats.insertAdjacentElement('afterend', notice);
    }

    const data = typeof state !== 'undefined' ? state.data : null;
    const hasEditorial = Boolean(data && Array.isArray(data.posts) && data.posts.some(post => post.editorial));
    const disclosure = data && data.site && data.site.contentDisclosure
      ? data.site.contentDisclosure
      : (hasEditorial ? DEFAULT_DISCLOSURE : '');
    notice.textContent = disclosure;
    notice.hidden = !disclosure;
    return notice;
  }

  function renderEditorialComments(post) {
    const comments = Array.isArray(post && post.comments) ? post.comments : [];
    const list = $('commentList');
    if (!comments.length) {
      list.innerHTML = '<div class="comment-item">暂无公开评论。</div>';
      return;
    }

    list.innerHTML = comments.map(comment => {
      const item = commentParts(comment);
      const replyClass = item.reply ? ' comment-reply' : '';
      const badge = item.reply ? '<span class="reply-badge">回复</span>' : '';
      return '<div class="comment-item' + replyClass + '">' +
        '<div class="comment-author">' + badge + escapeHtml(item.author) + '</div>' +
        '<div class="comment-text">' + escapeHtml(item.content) + '</div>' +
        '</div>';
    }).join('');
  }

  if (typeof renderComments === 'function') {
    renderComments = renderEditorialComments;
  }

  if (typeof openPost === 'function') {
    const originalOpenPost = openPost;
    openPost = function (postId) {
      originalOpenPost(postId);
      const data = typeof getData === 'function' ? getData() : null;
      const post = data && Array.isArray(data.posts) ? data.posts.find(item => item.id === postId) : null;
      if (post && post.editorial && $('detailMeta')) {
        $('detailMeta').textContent = '匿名故事创作 · ' + formatTime(post.createdAt) + ' · ' + categoryName(data, post.category);
      }
    };
  }

  if (typeof renderPosts === 'function') {
    const originalRenderPosts = renderPosts;
    renderPosts = function () {
      originalRenderPosts();
      installNotice();
    };
  }

  setTimeout(installNotice, 0);
}());
