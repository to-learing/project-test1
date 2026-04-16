const app = getApp();
const api = require('../../services/api');

Page({
  data: {
    statusBarHeight: 20,
    userInfo: {
      nickName: null,
      avatarUrl: '',
      isMember: false,
      bio: '',
      followingCount: 0,
      followerCount: 0,
      topicCount: 0,
      likeCount: 0
    },
    isLoggedIn: false
  },

  onLoad(options) {
    // 获取状态栏高度，适配自定义导航栏
    if (app.globalData.systemInfo && app.globalData.systemInfo.statusBarHeight) {
      this.setData({ statusBarHeight: app.globalData.systemInfo.statusBarHeight });
    } else {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight });
    }
    this.updateUserInfo();
  },

  onShow() {
    // 设置TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.updateUserInfo();
    if (app.globalData.isLoggedIn) {
      this.refreshUserInfo();
    }
  },

  /**
   * 更新用户信息
   */
  updateUserInfo() {
    const globalData = app.globalData;
    
    if (globalData.isLoggedIn && globalData.userInfo) {
      const userInfo = globalData.userInfo;
      this.setData({
        isLoggedIn: true,
        userInfo: {
          nickName: userInfo.nickname || '微信用户',
          avatarUrl: userInfo.avatar || '',
          isMember: userInfo.isMember || false,
          bio: userInfo.bio || '',
          followingCount: userInfo.followingCount || 0,
          followerCount: userInfo.followerCount || 0,
          topicCount: userInfo.topicCount || 0,
          likeCount: userInfo.likeCount || 0
        }
      });
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: {
          nickName: null,
          avatarUrl: '',
          isMember: false,
          bio: '',
          followingCount: 0,
          followerCount: 0,
          topicCount: 0,
          likeCount: 0
        }
      });
    }
  },

  /**
   * 刷新用户信息（从服务器获取最新数据）
   */
  refreshUserInfo() {
    if (!app.globalData.isLoggedIn) return;
    
    api.user.getInfo().then(res => {
      if (res.code === 200 && res.data) {
        const userInfo = res.data;
        // 更新全局数据
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        // 更新页面数据
        this.updateUserInfo();
      }
    }).catch(err => {
      console.error('刷新用户信息失败:', err);
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    if (app.globalData.isLoggedIn) {
      this.refreshUserInfo();
    }
    wx.stopPullDownRefresh();
  },

  handleToLogin() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  handleToSettings() {
    if (!app.checkLogin()) return;
    wx.navigateTo({
      url: '/pages/my/setting/index'
    });
  },
  
  handleToProfile() {
    if (!app.checkLogin()) return;
    wx.navigateTo({
      url: '/pages/my/profile-edit/index'
    });
  },

  handleToMember() {
    if (!app.checkLogin()) return;
    wx.navigateTo({
      url: '/pages/my/member/index'
    });
  },

  handleNav(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    
    if (!app.checkLogin()) return;
    wx.navigateTo({ url });
  },

  handleTodo(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({
      title: `${name}功能开发中`,
      icon: 'none'
    });
  }
});
