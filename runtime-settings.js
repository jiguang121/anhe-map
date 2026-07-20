window.GC_DEFAULT_DATA = window.GC_DEFAULT_DATA || { site: {}, categories: [], posts: [] };
window.GC_DEFAULT_DATA.version = 4;
window.GC_DEFAULT_DATA.site = {
  ...window.GC_DEFAULT_DATA.site,
  visitorLabel: '访客模式',
  dailyFreeViews: 5,
  viewLimit: 5,
  paymentEnabled: false,
  payTitle: '今天的免费阅读额度已经用完',
  payText: '每天可免费查看 5 条完整内容。会员功能正在内测，正式开放后可无限查看；今天可以先收藏页面，明天继续。',
  payButtonText: '会员即将开放',
  loginTitle: '会员功能内测中',
  loginText: '当前阶段先开放每日免费阅读，后续再开放正式会员与支付。'
};
