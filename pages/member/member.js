/**
 * 会员中心页
 */

const app = getApp();
const api = require('../../services/api');
const util = require('../../utils/util');
const config = require('../../config/index');

Page({
  data: {
    packages: [],
    selectedPackageId: null,
    selectedPackagePrice: '',
    selectedPackage: null,
    userInfo: null,
    isMember: false,
    memberLevelName: '',
    memberExpireTime: '',
    loading: true,
    submitting: false
  },

  onLoad: function() {
    this.loadPackages();
    this.updateUserInfo();
  },

  onShow: function() {
    this.updateUserInfo();
  },

  updateUserInfo: function() {
    const globalData = app.globalData;
    this.setData({
      userInfo: globalData.userInfo,
      isMember: globalData.isMember,
      memberLevelName: config.MEMBER_LEVEL_NAMES[globalData.memberLevel] || '',
      memberExpireTime: globalData.memberExpireTime 
        ? util.formatDate(globalData.memberExpireTime, 'YYYY年MM月DD日')
        : ''
    });
  },

  loadPackages: function() {
    this.setData({ loading: true });
    
    api.member.getPackages().then(res => {
      if (res.code === 200) {
        const packages = res.data.map(pkg => ({
          ...pkg,
          originalPriceFormatted: util.formatPrice(pkg.originalPrice),
          currentPriceFormatted: util.formatPrice(pkg.currentPrice),
          benefits: pkg.benefits ? JSON.parse(pkg.benefits) : []
        }));
        
        // 默认选中第一个
        const selectedPackageId = packages.length > 0 ? packages[0].id : null;
        const selectedPackage = packages.length > 0 ? packages[0] : null;
        this.setData({
          packages,
          selectedPackageId,
          selectedPackagePrice: selectedPackage ? selectedPackage.currentPriceFormatted : '',
          selectedPackage: selectedPackage,
          loading: false
        });
      }
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  // 选择套餐
  onSelectPackage: function(e) {
    const id = e.currentTarget.dataset.id;
    const selectedPackage = this.data.packages.find(pkg => pkg.id === id);
    this.setData({ 
      selectedPackageId: id,
      selectedPackagePrice: selectedPackage ? selectedPackage.currentPriceFormatted : '',
      selectedPackage: selectedPackage || null
    });
  },

  // 获取选中的套餐
  getSelectedPackage: function() {
    return this.data.packages.find(pkg => pkg.id === this.data.selectedPackageId);
  },

  // 获取选中套餐价格
  getSelectedPackagePrice: function() {
    const selectedPackage = this.getSelectedPackage();
    return selectedPackage ? selectedPackage.currentPriceFormatted : '';
  },

  // 提交订单
  onSubmit: function() {
    if (!app.checkLogin()) return;
    
    const selectedPackage = this.getSelectedPackage();
    if (!selectedPackage) {
      wx.showToast({ title: '请选择套餐', icon: 'none' });
      return;
    }
    
    this.setData({ submitting: true });
    
    api.member.createOrder({
      packageId: selectedPackage.id
    }).then(res => {
      if (res.code === 200) {
        const orderData = res.data;
        
        // 调用微信支付
        wx.requestPayment({
          timeStamp: orderData.timeStamp,
          nonceStr: orderData.nonceStr,
          package: orderData.package,
          signType: orderData.signType || 'MD5',
          paySign: orderData.paySign,
          success: () => {
            wx.showToast({ title: '支付成功', icon: 'success' });
            // 刷新用户信息
            app.refreshUserInfo();
            setTimeout(() => {
              this.updateUserInfo();
            }, 1000);
          },
          fail: (err) => {
            if (err.errMsg.includes('cancel')) {
              wx.showToast({ title: '已取消支付', icon: 'none' });
            } else {
              wx.showToast({ title: '支付失败', icon: 'none' });
            }
          }
        });
      }
    }).catch(() => {
      wx.showToast({ title: '创建订单失败', icon: 'none' });
    }).finally(() => {
      this.setData({ submitting: false });
    });
  }
});
