/**
 * 文章列表页
 * 
 * 功能说明：
 * 1. 根据 articleType 展示不同模块的文章（行业案例/行业趋势/爆款打法）
 * 2. 支持关键词搜索功能
 * 3. 下拉刷新和上拉加载（懒加载）
 * 4. 调用后端接口获取真实数据
 */

const app = getApp();
const api = require('../../../services/api');

/**
 * 格式化数字（如：1234 -> 1.2k）
 */
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

/**
 * 格式化相对时间
 * @param {String|Number} timeValue 时间值（支持时间戳或ISO日期字符串）
 */
const formatRelativeTime = (timeValue) => {
  if (!timeValue) return '';
  
  // 处理不同的时间格式
  let timestamp;
  if (typeof timeValue === 'string') {
    // 处理ISO日期字符串格式 (如: "2024-01-05T10:30:00")
    timestamp = new Date(timeValue).getTime();
  } else {
    timestamp = timeValue;
  }
  
  if (isNaN(timestamp)) return '';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// ==================== 页面逻辑 ====================

Page({
  /**
   * 页面数据
   */
  data: {
    // 文章类型（1:行业案例 2:行业趋势 3:爆款打法）
    articleType: 1,
    pageTitle: '行业案例',
    
    // 页面主题色配置
    themeConfig: {
      1: { color: '#00b3b3', bgColor: '#e6f7f5', title: '行业案例', icon: 'records' },
      2: { color: '#07c160', bgColor: '#e8fff0', title: '行业趋势', icon: 'chart-trending-o' },
      3: { color: '#ff6034', bgColor: '#fff0e8', title: '爆款打法', icon: 'fire-o' }
    },
    // 初始化默认主题，避免 icon name 为 null
    currentTheme: { color: '#00b3b3', bgColor: '#e6f7f5', title: '行业案例', icon: 'records' },
    
    // 搜索关键词
    keyword: '',
    
    // 文章列表
    articleList: [],
    
    // 分页参数
    pageNum: 1,
    pageSize: 8,
    hasMore: true,
    total: 0,
    
    // 加载状态
    loading: true,
    loadingMore: false,
    refreshing: false,
    
    // 空状态
    isEmpty: false
  },

  /**
   * 生命周期 - 页面加载
   */
  onLoad: function(options) {
    console.log('[ArticleList] 页面加载', options);

    if (!app.checkLogin()) return;
    
    // 获取文章类型参数
    const articleType = options.articleType ? Number(options.articleType) : 1;
    const themeConfig = this.data.themeConfig;
    const currentTheme = themeConfig[articleType] || themeConfig[1];
    
    this.setData({
      articleType,
      currentTheme,
      pageTitle: currentTheme.title
    });
    
    // 加载文章列表
    this.loadArticles(true);
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    console.log('[ArticleList] 下拉刷新');
    this.setData({ refreshing: true });
    this.loadArticles(true).finally(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  /**
   * 上拉加载更多（懒加载核心）
   */
  onReachBottom: function() {
    console.log('[ArticleList] 触底加载更多', {
      hasMore: this.data.hasMore,
      loadingMore: this.data.loadingMore,
      currentPage: this.data.pageNum
    });
    
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadArticles(false);
    }
  },

  /**
 * 加载文章列表
 * @param {Boolean} refresh 是否刷新（true=重新加载第一页）
 */
loadArticles: function(refresh = false) {
  return new Promise((resolve, reject) => {
    if (refresh) {
      this.setData({
        pageNum: 1,
        hasMore: true,
        loading: true,
        isEmpty: false
      });
    } else {
      this.setData({ loadingMore: true });
    }
    
    const { articleType, pageNum, pageSize, keyword } = this.data;
    
    // 调用后端接口获取文章列表
    api.article.getList({
      articleType: articleType,
      keyword: keyword || '',
      pageNum: pageNum,
      pageSize: pageSize
    }).then(res => {
      console.log('[ArticleList] 接口返回数据:', res);
      
      // 从接口响应中提取数据
      const pageData = res.data || res;
      const list = pageData.records || pageData.list || [];
      const total = pageData.total || 0;
      const hasMore = pageData.hasNext === true;
      
      // 格式化数据
      const formattedList = list.map(item => ({
        ...item,
        viewCountFormatted: formatNumber(item.viewCount || 0),
        likeCountFormatted: formatNumber(item.likeCount || 0),
        createTimeFormatted: formatRelativeTime(item.createTime)
      }));
      
      const newList = refresh ? formattedList : [...this.data.articleList, ...formattedList];
      
      this.setData({
        articleList: newList,
        pageNum: this.data.pageNum + 1,
        hasMore: hasMore,
        total: total,
        loading: false,
        loadingMore: false,
        isEmpty: newList.length === 0
      });
      
      console.log('[ArticleList] 加载完成', {
        page: this.data.pageNum - 1,
        loaded: formattedList.length,
        total: newList.length,
        hasMore: hasMore
      });
      
      resolve();
    }).catch(err => {
      console.error('[ArticleList] 加载失败:', err);
      this.setData({
        loading: false,
        loadingMore: false
      });
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      
      reject(err);
    });
  });
},

  /**
   * 搜索输入
   */
  onSearchInput: function(e) {
    this.setData({ keyword: e.detail });
  },

  /**
   * 执行搜索
   */
  onSearch: function() {
    console.log('[ArticleList] 执行搜索:', this.data.keyword);
    this.loadArticles(true);
  },

  /**
   * 清空搜索
   */
  onClearSearch: function() {
    this.setData({ keyword: '' });
    this.loadArticles(true);
  },

  /**
   * 跳转到文章详情
   */
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/article/detail/detail?id=${id}`
    });
  },

  /**
   * 图片加载失败处理
   */
  onImageError: function(e) {
    const index = e.currentTarget.dataset.index;
    const key = `articleList[${index}].coverImage`;
    this.setData({
      [key]: ''
    });
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    const { pageTitle, articleType } = this.data;
    return {
      title: `极光密码 - ${pageTitle}`,
      path: `/pages/article/list/list?articleType=${articleType}`
    };
  }
});
