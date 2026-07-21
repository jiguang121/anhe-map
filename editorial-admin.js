(function () {
  const EXTRA_AUTHORS = [
    '晚风','北岸','旧信箱','三点水','夜航','白噪音','青禾','小岛来信','远山','凌晨两点',
    '窗台猫','半杯咖啡','雨停以后','无声处','落日邮差','路灯下','慢半拍','拾光','玻璃海','一页书'
  ];

  const EXTRA_ROOTS = {
    privacy: [
      '这种事情最难的地方，是当事人每天还要照常生活，旁人根本看不出来。',
      '我能理解为什么一直没说，有些真相不是一句坦白就能收尾的。',
      '读到那个小细节时很难受，长期隐瞒真的会改变一个人的所有习惯。',
      '关系里最可怕的不是争吵，是你已经不敢让对方看见完整的自己。',
      '有些秘密看起来是一个人的选择，实际上背后牵着整个家庭。',
      '先别急着逼自己立刻坦白，至少先把事实和可能的后果整理清楚。'
    ],
    mind: [
      '这种“什么都能做，但什么都不期待”的状态，我也经历过一段时间。',
      '成年人很多低谷确实没有明显事件，只是日子一点点失去颜色。',
      '我觉得你不是不努力，而是已经太久没有问过自己真正想要什么。',
      '看到这里突然很有共鸣，外表正常和内心稳定完全是两回事。',
      '别用别人更辛苦来否定自己的感受，难受不需要先取得资格。',
      '有时候先恢复睡眠和生活节奏，比急着找到人生答案更重要。'
    ],
    leak: [
      '这种机制比单个坏人更难处理，因为每个人都只负责流程里很小的一段。',
      '最有用的是把时间、金额、承诺和证据列清楚，不要只和客服反复争论。',
      '我在别的行业见过类似操作，公开规则和真正执行之间经常差很多。',
      '很多人不是认可结果，只是被拖到没有时间和精力继续追。',
      '这类内容可以提醒大家识别流程，但确实要避免暴露具体个人信息。',
      '看完最大的感受是，普通人一定要保留截图、合同和每次沟通记录。'
    ]
  };

  const EXTRA_REPLIES = [
    '同意，人在事情里面的时候很难像旁观者一样迅速看清。',
    '你这句说到重点了，长期积累往往比最后一次冲突更伤人。',
    '我也有类似感受，真正需要的常常不是建议，而是先被完整听见。',
    '不过现实成本也要考虑，有些决定确实不能只靠一时勇气。',
    '是的，先做一个最小的动作，比逼自己一次解决所有问题更实际。',
    '看到你的回复才发现，原来很多人的反应都很相似。',
    '我有一点不同看法，有时候继续沉默的代价也会越来越大。',
    '这也是为什么记录很重要，时间久了很多细节连自己都会记混。',
    '谢谢你没有直接评判，当事人最怕的往往就是被一句话定性。',
    '没错，表面没事不代表事情已经过去，只是暂时没人再提。'
  ];

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

  function stableNumber(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function commentTarget(post, index) {
    const seed = stableNumber(`${post.id || post.title}_${index}`);
    const bucket = seed % 100;
    if (bucket < 15) return 3 + (seed % 5);          // 3–7，少量冷门内容
    if (bucket < 40) return 8 + (seed % 7);          // 8–14
    if (bucket < 75) return 15 + (seed % 9);         // 15–23，主体区间
    if (bucket < 95) return 24 + (seed % 11);        // 24–34
    return 35 + (seed % 10);                         // 35–44，少量热门内容
  }

  function extraLine(post, index, position) {
    const category = EXTRA_ROOTS[post.category] ? post.category : 'mind';
    const author = EXTRA_AUTHORS[(stableNumber(post.id) + position * 7 + index) % EXTRA_AUTHORS.length];
    if (position % 3 !== 2) {
      const text = EXTRA_ROOTS[category][(stableNumber(post.title) + position + index) % EXTRA_ROOTS[category].length];
      return `匿名·${author}：${text}`;
    }
    const parent = EXTRA_AUTHORS[(stableNumber(post.id) + position * 5 + index + 3) % EXTRA_AUTHORS.length];
    const text = EXTRA_REPLIES[(stableNumber(post.title) + position * 3 + index) % EXTRA_REPLIES.length];
    return `↳ 匿名·${author} 回复 匿名·${parent}：${text}`;
  }

  function applyNaturalCommentDistribution(posts) {
    return posts.map((post, index) => {
      const isEditorial = post.editorial === true || String(post.id || '').startsWith('editorial_');
      if (!isEditorial) return post;

      const target = commentTarget(post, index);
      const current = Array.isArray(post.comments) ? post.comments.slice() : [];
      const next = current.slice(0, target);
      while (next.length < target) {
        next.push(extraLine(post, index, next.length));
      }
      return { ...post, comments: next };
    });
  }

  function describeDistribution(posts) {
    const counts = posts
      .filter(post => post.editorial === true || String(post.id || '').startsWith('editorial_'))
      .map(post => Array.isArray(post.comments) ? post.comments.length : 0);
    if (!counts.length) return '没有找到故事创作文章';
    const total = counts.reduce((sum, value) => sum + value, 0);
    return `最少 ${Math.min(...counts)} 条，最多 ${Math.max(...counts)} 条，平均 ${(total / counts.length).toFixed(1)} 条`;
  }

  async function reshapeCurrentComments(button) {
    if (!gcHasAdminSession()) return showToast('请先登录后台');
    const current = cloneData(getData());
    const editorialCount = current.posts.filter(post => post.editorial === true || String(post.id || '').startsWith('editorial_')).length;
    if (!editorialCount) return showToast('没有找到可调整的故事创作文章');

    const confirmed = window.confirm(
      `将只调整现有 ${editorialCount} 篇故事创作文章的评论数量，不修改标题和正文。\n\n` +
      '调整后少的约 3–7 条，多的约 35–44 条，并保留评论回复关系。执行前会自动下载备份。确定继续吗？'
    );
    if (!confirmed) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '正在调整评论数量…';

    try {
      downloadBackup(current);
      const posts = applyNaturalCommentDistribution(current.posts);
      const nextData = {
        ...current,
        site: {
          ...current.site,
          editorialCommentDistribution: 'natural-v1'
        },
        posts
      };
      await gcSaveContent(nextData);
      await reloadAfterSave(`评论数量已调整：${describeDistribution(posts)}`);
    } catch (error) {
      console.error(error);
      showToast(error.message || '评论数量调整失败');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
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
      `每个分类 ${meta.perCategory || 100} 篇；评论数量将自然分布在 3–44 条之间，并包含回复关系。\n\n` +
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
      const distributedPosts = applyNaturalCommentDistribution(seed.posts);
      const nextData = {
        ...current,
        version: Math.max(5, Number(current.version || 0)),
        site: {
          ...current.site,
          contentDisclosure: seed.disclosure,
          editorialSeedVersion: seed.version,
          editorialCommentDistribution: 'natural-v1'
        },
        posts: distributedPosts
      };

      const serializedLength = JSON.stringify(nextData).length;
      if (serializedLength > 880000) {
        throw new Error(`生成内容体积过大（${serializedLength} 字符），已停止写入`);
      }

      await gcSaveContent(nextData);
      selectedPostId = distributedPosts[0]?.id || null;
      await reloadAfterSave(`已替换为 ${distributedPosts.length} 篇内容；${describeDistribution(distributedPosts)}`);
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
    note.textContent = '故事创作内容共 300 篇。评论数量采用自然分布：少量文章只有几条，普通文章十几到二十多条，少量热门文章三十至四十多条。操作前会自动下载当前内容备份。';

    const reshapeButton = document.createElement('button');
    reshapeButton.id = 'reshapeEditorialCommentsBtn';
    reshapeButton.className = 'primary-btn full';
    reshapeButton.textContent = '只调整现有文章的评论数量';
    reshapeButton.addEventListener('click', () => reshapeCurrentComments(reshapeButton));

    const replaceButton = document.createElement('button');
    replaceButton.id = 'replaceEditorialSeedBtn';
    replaceButton.className = 'danger-btn full';
    replaceButton.textContent = '备份并替换为 300 篇长内容';
    replaceButton.addEventListener('click', () => replaceWithEditorialSeed(replaceButton));

    stack.prepend(replaceButton);
    stack.prepend(reshapeButton);
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
