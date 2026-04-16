const app = getApp();
import * as echarts from '../../components/ec-canvas/echarts';

/**
 * 数据大盘页面
 * 展示行业数据可视化
 */

function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);

  var option = {
    backgroundColor: "transparent",
    series: [{
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      type: 'pie',
      center: ['50%', '50%'],
      radius: ['60%', '80%'],
      data: [{
        value: 55,
        name: '北京'
      }, {
        value: 20,
        name: '武汉'
      }]
    }]
  };

  chart.setOption(option);
  return chart;
}


Page({
  data: {
    // Tab切换
    currentTab: 'week',
    tabs: [
      { key: 'day', label: '日报' },
      { key: 'week', label: '周报' },
      { key: 'month', label: '月报' }
    ],
    
    // 分类筛选
    showCategoryPicker: false,
    categories: [
      { text: '全部品类', value: 'all' },
      { text: '鞋类', value: 'shoes', children: [
        { text: '运动鞋', value: 'sports_shoes' },
        { text: '休闲鞋', value: 'casual_shoes' },
        { text: '跑步鞋', value: 'running_shoes' }
      ]},
      { text: '服饰', value: 'clothing', children: [
        { text: '潮流服饰', value: 'fashion' },
        { text: '运动服饰', value: 'sports_wear' }
      ]},
      { text: '配饰', value: 'accessories', children: [
        { text: '手表', value: 'watch' },
        { text: '包袋', value: 'bags' }
      ]},
      { text: '数码', value: 'digital' },
      { text: '美妆', value: 'beauty' }
    ],
    selectedCategory: '全部品类',
    selectedCategoryValue: 'all',
    
    // 大盘概览数据
    overview: {
      trend: '大涨',
      trendType: 'up',
      changePercent: 8.2,
      ringPercent: 75
    },
    
    // 日期信息
    dateInfo: '2023年11月第4周',
    
    // 上周数据回顾
    weeklyStats: {
      sales: { value: 5462, change: 2.5, isUp: true },
      visits: { value: 12846, change: 5.2, isUp: true },
      conversion: { value: 42.5, change: 1.3, isUp: false, unit: '%' },
      avgPrice: { value: 328, change: 3.8, isUp: true, prefix: '¥' }
    },
    
    // 本周操作建议
    suggestions: {
      recommend: {
        title: 'AJ1 Panda（价格触底）',
        tags: ['机会点', '价格低点']
      },
      risk: {
        title: '某款退货率上升',
        tags: ['注意风险', '需要关注']
      }
    },
    
    // 热门品类Top5
    hotCategories: [
      { rank: 1, name: '运动鞋', change: 21.5, isUp: true, image: '/images/default-avatar.png' },
      { rank: 2, name: '潮流服饰', change: 15.2, isUp: true, image: '/images/default-avatar.png' },
      { rank: 3, name: '手表配饰', change: 9.7, isUp: true, image: '/images/default-avatar.png' },
      { rank: 4, name: '数码产品', change: 6.3, isUp: true, image: '/images/default-avatar.png' },
      { rank: 5, name: '美妆个护', change: 3.1, isUp: false, image: '/images/default-avatar.png' }
    ],
    
    // 销量趋势数据（折线图）
    trendData: [
      { date: '周一', value: 1200 },
      { date: '周二', value: 1350 },
      { date: '周三', value: 1100 },
      { date: '周四', value: 1500 },
      { date: '周五', value: 1800 },
      { date: '周六', value: 2100 },
      { date: '周日', value: 1900 }
    ],
    
    loading: false,
    ringChart: null,
    lineChart: null,

    // 饼状图实例
    ec: {
      onInit: initChart
    }

  },

  onReady(){

  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadData();
  },

  /**
   * 加载数据
   */
  loadData() {
    this.setData({ loading: true });
    
    // 模拟API请求
    setTimeout(() => {
      // 根据不同tab加载不同数据
      this.updateDataByTab(this.data.currentTab);
      this.setData({ loading: false });
    }, 500);
  },

  /**
   * 根据Tab更新数据
   */
  updateDataByTab(tab) {
    // 模拟不同周期的数据
    const dataMap = {
      day: {
        dateInfo: '2023年11月28日',
        overview: { trend: '小涨', trendType: 'up', changePercent: 2.1, ringPercent: 45 },
        weeklyStats: {
          sales: { value: 782, change: 1.2, isUp: true },
          visits: { value: 1834, change: 3.5, isUp: true },
          conversion: { value: 40.2, change: 0.8, isUp: false, unit: '%' },
          avgPrice: { value: 315, change: 1.2, isUp: true, prefix: '¥' }
        }
      },
      week: {
        dateInfo: '2023年11月第4周',
        overview: { trend: '大涨', trendType: 'up', changePercent: 8.2, ringPercent: 75 },
        weeklyStats: {
          sales: { value: 5462, change: 2.5, isUp: true },
          visits: { value: 12846, change: 5.2, isUp: true },
          conversion: { value: 42.5, change: 1.3, isUp: false, unit: '%' },
          avgPrice: { value: 328, change: 3.8, isUp: true, prefix: '¥' }
        }
      },
      month: {
        dateInfo: '2023年11月',
        overview: { trend: '稳定', trendType: 'stable', changePercent: 0.5, ringPercent: 60 },
        weeklyStats: {
          sales: { value: 23456, change: 5.8, isUp: true },
          visits: { value: 56789, change: 8.2, isUp: true },
          conversion: { value: 41.3, change: 0.5, isUp: true, unit: '%' },
          avgPrice: { value: 322, change: 2.1, isUp: true, prefix: '¥' }
        }
      }
    };
    
    const data = dataMap[tab] || dataMap.week;
    this.setData({
      dateInfo: data.dateInfo,
      overview: data.overview,
      weeklyStats: data.weeklyStats
    });
  
  },

  /**
   * 切换Tab
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.updateDataByTab(tab);
  },

  /**
   * 显示分类选择器
   */
  showCategoryFilter() {
    this.setData({ showCategoryPicker: true });
  },

  /**
   * 隐藏分类选择器
   */
  hideCategoryFilter() {
    this.setData({ showCategoryPicker: false });
  },

  /**
   * 选择分类
   */
  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category.text,
      selectedCategoryValue: category.value,
      showCategoryPicker: false
    });
    
    // 根据分类重新加载数据
    this.loadData();
  },

  /**
   * 查看详情
   */
  onViewDetail() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 查看更多建议
   */
  onViewMoreSuggestions() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 点击热门品类
   */
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    wx.showToast({
      title: `查看${category.name}详情`,
      icon: 'none'
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '数据大盘 - 极光密码',
      path: '/packageEcharts/pages/dashboard/dashboard'
    };
  }
});
