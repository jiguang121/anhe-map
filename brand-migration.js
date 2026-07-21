(() => {
  const BRAND = '半句';
  const SUBTITLE = '那些没说完、没说出口的话，都留在这里。';

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && element.value !== value) element.value = value;
  }

  function applyBrand() {
    document.title = location.pathname.endsWith('admin.html') ? '半句后台' : BRAND;
    setText('homeEyebrow', BRAND);
    setText('homeTitle', BRAND);
    setText('homeSubtitle', SUBTITLE);
    setText('feedEyebrow', BRAND);
    setValue('siteEyebrow', BRAND);
    setValue('siteTitle', BRAND);
    setValue('siteSubtitle', SUBTITLE);
    setValue('siteFeedEyebrow', BRAND);

    const adminMark = document.querySelector('.admin-header .eyebrow');
    if (adminMark && adminMark.textContent !== BRAND) adminMark.textContent = BRAND;
  }

  applyBrand();
  document.addEventListener('DOMContentLoaded', applyBrand, { once: true });
  new MutationObserver(applyBrand).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  setInterval(applyBrand, 1000);
})();