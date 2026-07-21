window.GC_DEFAULT_DATA = {
  version: 2,
  site: {
    eyebrow: '半句',
    title: '半句',
    subtitle: '那些没说完、没说出口的话，都留在这里。',
    feedEyebrow: '半句',
    shareButtonText: '匿名分享',
    visitorLabel: '游客模式',
    memberLabel: '会员模式',
    viewLimit: 5,
    payTitle: '你已经看完 5 条免费内容',
    payText: '继续查看完整内容，需要登录会员。当前版本是演示入口，后续可以接微信登录、手机号登录或真实支付。',
    payButtonText: '模拟开通会员',
    loginTitle: '演示登录',
    loginText: '输入任意昵称即可成为“会员”。这是前端演示，不是真实账号系统。'
  },
  categories: [
    { id: 'privacy', name: '隐私', tagline: '不能说的边界', orbClass: 'orb-privacy' },
    { id: 'mind', name: '心事', tagline: '没人接住的念头', orbClass: 'orb-mind' },
    { id: 'leak', name: '爆料', tagline: '风声从这里开始', orbClass: 'orb-leak' }
  ],
  posts: [
    {
      id: 'p_privacy_1',
      category: 'privacy',
      title: '我把最真实的一面藏得很好',
      content: '白天我像一个很正常的人，回消息、做事、开玩笑。可是只有我自己知道，我真正害怕的是被别人看见那个不够体面的自己。',
      createdAtOffsetMinutes: 38,
      comments: ['有时候越正常的人，越需要一个出口。', '这里至少可以不用装。']
    },
    {
      id: 'p_privacy_2',
      category: 'privacy',
      title: '有些关系，我已经在心里退场了',
      content: '我没有拉黑，也没有吵架，只是突然发现，我已经不期待那个人理解我了。关系还在，但我已经不在里面了。',
      createdAtOffsetMinutes: 88,
      comments: ['懂，这种退场是安静的。']
    },
    {
      id: 'p_mind_1',
      category: 'mind',
      title: '我总觉得自己不该只过这种人生',
      content: '不是现在的生活完全不好，而是我心里一直有个声音：我不应该只是这样上班、吃饭、睡觉、等时间过去。我想要一点更大的东西。',
      createdAtOffsetMinutes: 120,
      comments: ['这种不甘心，可能就是入口。', '我也经常有这个感觉。']
    },
    {
      id: 'p_mind_2',
      category: 'mind',
      title: '成年人最难的是没有人接住你',
      content: '小时候难过可以哭，长大后难过还要回消息。很多时候不是事情多严重，而是身边没有一个可以完全说真话的人。',
      createdAtOffsetMinutes: 200,
      comments: ['太准了。', '匿名反而更像真实。']
    },
    {
      id: 'p_leak_1',
      category: 'leak',
      title: '有人表面光鲜，其实早就欠了一圈钱',
      content: '朋友圈里越是展示精致生活的人，不一定真的过得好。有些人的体面全靠借来的现金流撑着，只是没人把账本摊开看。',
      createdAtOffsetMinutes: 260,
      comments: ['很多人是在演稳定。', '账本比朋友圈诚实。']
    },
    {
      id: 'p_leak_2',
      category: 'leak',
      title: '公司最会画饼的人，往往最懂人性',
      content: '很多承诺不是为了兑现，而是为了让你暂时继续卖力。等你发现的时候，饼已经换了一张新的。',
      createdAtOffsetMinutes: 330,
      comments: ['这句可以贴工位上。']
    }
  ]
};