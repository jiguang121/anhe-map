(() => {
  const brand = {
    eyebrow: '半句故事记录',
    title: '半句',
    subtitle: '那些没说完、没说出口的话，都留在这里。',
    feedEyebrow: '半句 · 故事记录'
  };

  let finished = false;
  let attempts = 0;
  let timer = null;

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function isOldBrand(site) {
    return site?.title === '天才俱乐部'
      || String(site?.eyebrow || '').includes('GENIUS CLUB')
      || String(site?.feedEyebrow || '').includes('GENIUS CLUB');
  }

  async function migrateBrand() {
    if (finished || !gcHasAdminSession()) return;

    try {
      const data = await gcLoadData();
      if (!data?.site || !isOldBrand(data.site)) {
        finished = true;
        stop();
        return;
      }

      data.site = { ...data.site, ...brand };
      await gcSaveContent(data);
      finished = true;
      stop();

      if (typeof refreshAdminData === 'function') await refreshAdminData();
      if (typeof renderAdmin === 'function') renderAdmin();
      if (typeof showToast === 'function') showToast('整站名称已更新为“半句”');
    } catch (error) {
      console.error('Brand migration failed:', error);
    }
  }

  migrateBrand();
  timer = setInterval(() => {
    attempts += 1;
    migrateBrand();
    if (attempts >= 600) stop();
  }, 1000);
})();