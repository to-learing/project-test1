const app = getApp();
const api = require('../../services/api');
const util = require('../../utils/util');
/**
 * 首页入口：模块导航
 * 展示四个模块的入口卡片，点击进入对应页面
 */

Page({
  data: {
    modules: [
      {
        key: 'dashboard',
        title: '数据大盘',
        desc: '行业数据可视化分析',
        path: '/packageEcharts/pages/dashboard/dashboard',
        icon: 'chart-trending-o',
        highlight: true,
        color: '#000'
      },
      {
        key: 'case',
        title: '行业案例',
        desc: '精选案例文章列表',
        path: '/pages/article/list/list?articleType=1',
        icon: 'records',
        color: '#00b3b3'
      },
      {
        key: 'trend',
        title: '行业趋势',
        desc: '趋势洞察文章列表',
        path: '/pages/article/list/list?articleType=2',
        icon: 'chart-trending-o',
        color: '#07c160'
      },
      {
        key: 'hot',
        title: '爆款打法',
        desc: '玩法策略文章列表',
        path: '/pages/article/list/list?articleType=3',
        icon: 'fire-o',
        color: '#ff6034'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onModuleTap(e) {
    const path = e.currentTarget.dataset.path;
    if (path) {
      if (!app.checkLogin({ redirectUrl: path })) return;
      wx.navigateTo({ url: path });
    }
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    return {
      title: '极光密码 - 潮流电商行业数据平台',
      path: '/pages/home/home'
    };
  }
});
