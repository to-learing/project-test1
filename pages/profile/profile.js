/**
 * 个人中心页
 */

const app = getApp();
const api = require('../../services/api');
const util = require('../../utils/util');
const config = require('../../config/index');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    isMember: false,
    memberLevelName: '',
    memberExpireTime: '',
    menus: [
      { icon: 'notes-o', title: '我的话题', url: '/pages/topic/list/list?mine=1' },
      { icon: 'star-o', title: '我的收藏', url: '' },
      { icon: 'clock-o', title: '浏览历史', url: '' },
      { icon: 'setting-o', title: '设置', url: '' }
    ]
  },

  onLoad: function() {
    this.updateUserInfo();
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.updateUserInfo();
  },

  updateUserInfo: function() {
    const globalData = app.globalData;
    
    this.setData({
      userInfo: globalData.userInfo,
      isLoggedIn: globalData.isLoggedIn,
      isMember: globalData.isMember,
      memberLevelName: config.MEMBER_LEVEL_NAMES[globalData.memberLevel] || '普通用户',
      memberExpireTime: globalData.memberExpireTime 
        ? util.formatDate(globalData.memberExpireTime, 'YYYY-MM-DD') + ' 到期'
        : ''
    });
  },

  // 去登录
  goToLogin: function() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  // 去会员中心
  goToMember: function() {
    if (!app.checkLogin()) return;
    wx.navigateTo({ url: '/pages/member/member' });
  },

  // 菜单点击
  onMenuClick: function(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    
    if (!app.checkLogin()) return;
    wx.navigateTo({ url });
  },

  // 退出登录
  onLogout: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.updateUserInfo();
          wx.showToast({ title: '已退出登录', icon: 'none' });
        }
      }
    });
  },

  // 刷新用户信息
  onPullDownRefresh: function() {
    if (app.globalData.isLoggedIn) {
      app.refreshUserInfo((err, userInfo) => {
        if (!err) {
          this.updateUserInfo();
          wx.showToast({
            title: '刷新成功',
            icon: 'none',
            duration: 1500
          });
        } else {
          wx.showToast({
            title: '刷新失败',
            icon: 'none',
            duration: 1500
          });
        }
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  }
});
