const app = getApp();

Page({
  data: {
    isLoggedIn: false
  },

  onLoad() {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  onShow() {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/my/index'
            });
          }, 1000);
        }
      }
    });
  }
});