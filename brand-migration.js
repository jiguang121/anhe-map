(() => {
  const BRAND = '半句';
  const SUBTITLE = '那些没说完、没说出口的话，都留在这里。';
  const TARGET_TITLE = location.pathname.endsWith('admin.html') ? '半句后台' : BRAND;

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && element.value !== value) element.value = value;
  }

  function applyBrand() {
    if (document.title !== TARGET_TITLE) document.title = TARGET_TITLE;
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
  window.addEventListener('load', applyBrand, { once: true });

  let attempts = 0;
  const timer = setInterval(() => {
    applyBrand();
    attempts += 1;
    if (attempts >= 60) clearInterval(timer);
  }, 1000);
})();
