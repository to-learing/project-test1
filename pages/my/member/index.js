Page({
  data: {
    userInfo: {},
    isMember: false,
    memberLevel: 0,
    packages: [
      { id: 1, name: '月度会员', originalPrice: 199.00, currentPrice: 199.00, desc: '解锁数据大盘、全文阅读', tag: null },
      { id: 2, name: '季度会员', originalPrice: 599.00, currentPrice: 499.00, desc: '解锁数据大盘、全文阅读', tag: '推荐' },
      { id: 3, name: '年度会员', originalPrice: 1999.00, currentPrice: 1699.00, desc: '解锁数据大盘、全文阅读', tag: '热门' }
    ],
    currentPackageId: 2, // 默认选中季卡
    selectedPackage: {},
    rightsList: [
      { name: '数据大盘', desc: '深度数据分析', icon: 'chart-pie' },
      { name: '全文阅读', desc: '畅读全站内容', icon: 'book-open' },
      { name: '免广告', desc: '清爽阅读体验', icon: 'close-circle' },
      { name: '专属标识', desc: '彰显尊贵身份', icon: 'sketch' },
      { name: '优先客服', desc: '专属VIP通道', icon: 'service' },
      { name: '生日礼遇', desc: '专属生日惊喜', icon: 'gift' },
    ]
  },

  onLoad() {
    const app = getApp();
    const defaultPackageId = 2; // Default to popular/recommended
    this.setData({
        userInfo: app.globalData?.userInfo || { nickName: '测试用户' },
        isMember: app.globalData?.isMember || false,
        memberLevel: 1,
        selectedPackage: this.data.packages.find(p => p.id === defaultPackageId) || this.data.packages[0]
    });
  },

  selectPackage(e) {
    const { id } = e.currentTarget.dataset;
    const selected = this.data.packages.find(p => p.id === id);
    if (selected) {
      this.setData({
        currentPackageId: id,
        selectedPackage: selected
      });
    }
  },

  handlePay() {
    const { selectedPackage } = this.data;
    wx.showToast({
      title: `模拟支付 ¥${selectedPackage.currentPrice}`,
      icon: 'none'
    });
  }
});