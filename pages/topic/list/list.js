const api = require('../../../services/api');
const config = require('../../../config/index');

Page({
  data: {
    searchValue: '',
    currentTab: 'recommend',
    topicList: [],
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10
  },

  onLoad(options) {
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    this.loadTopicList(true);
  },

  /**
   * 检查登录状态，未登录则跳转登录页
   * @returns {boolean} 是否已登录
   */
  checkLogin() {
    const token = wx.getStorageSync(config.TOKEN_KEY);
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return false;
    }
    return true;
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 
      });
    }
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    // 检查是否需要刷新（如发布新话题后）
    const needRefresh = wx.getStorageSync('topic_need_refresh');
    if (needRefresh) {
      wx.removeStorageSync('topic_need_refresh');
      this.loadTopicList(true);
    }
  },

  onPullDownRefresh() {
    this.loadTopicList(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTopicList(false);
    }
  },

  /**
   * 加载话题列表
   * @param {boolean} refresh 是否刷新（重新加载第一页）
   */
  loadTopicList(refresh = false) {
    if (this.data.loading) return Promise.resolve();
    
    const pageNum = refresh ? 1 : this.data.pageNum;
    
    this.setData({ loading: true });
    
    // 构建排序参数
    let sortBy = 'recommend';
    if (this.data.currentTab === 'latest') {
      sortBy = 'latest';
    } else if (this.data.currentTab === 'hot') {
      sortBy = 'hot';
    } else if (this.data.currentTab === 'following') {
      sortBy = 'latest'; // 关注tab按最新排序
    }
    
    const params = {
      pageNum: pageNum,
      pageSize: this.data.pageSize,
      sortBy: sortBy
    };
    
    // 如果是关注tab，添加followingOnly参数
    if (this.data.currentTab === 'following') {
      params.followingOnly = true;
    }
    
    // 如果有搜索关键词
    if (this.data.searchValue) {
      params.keyword = this.data.searchValue;
    }
    
    return api.topic.getList(params, { showLoading: false }).then(res => {
      if (res.code === 200 && res.data) {
        const records = res.data.records || [];
        // 转换数据格式以适配前端模板
        const formattedList = records.map(item => this.formatTopicItem(item));
        
        if (refresh) {
          this.setData({
            topicList: formattedList,
            pageNum: 2,
            hasMore: res.data.hasNext === true
          });
        } else {
          this.setData({
            topicList: [...this.data.topicList, ...formattedList],
            pageNum: pageNum + 1,
            hasMore: res.data.hasNext === true
          });
        }
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('加载话题列表失败:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  /**
   * 格式化话题数据
   */
  formatTopicItem(item) {
    return {
      id: item.id,
      title: item.title,
      summary: item.summary || (item.content ? item.content.substring(0, 100) : ''),
      author: {
        id: item.userId,
        name: item.userNickname || '微信用户',
        avatar: item.userAvatar || '/images/default-avatar.png'
      },
      images: item.images || [],
      tags: item.tags || [],
      likes: item.likeCount || 0,
      isLiked: item.isLiked || false,
      comments: item.commentCount || 0,
      createTime: item.createTime,
      timeAgo: this.formatTimeAgo(item.createTime)
    };
  },

  /**
   * 格式化时间为相对时间
   */
  formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr.replace(/-/g, '/'));
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    if (hours < 24) return hours + '小时前';
    if (days < 7) return days + '天前';
    if (days < 30) return Math.floor(days / 7) + '周前';
    return dateStr.substring(0, 10);
  },

  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  onSearch() {
    this.loadTopicList(true);
  },

  onTabChange(e) {
    const tab = e.detail.value;
    if (tab === this.data.currentTab) return;
    
    this.setData({ 
      currentTab: tab,
      topicList: [],
      pageNum: 1,
      hasMore: true
    });
    
    this.loadTopicList(true);
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: '/pages/topic/detail/detail?id=' + id
    });
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/topic/create/create'
    });
  },

  onTagClick(e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({ searchValue: tag });
    this.loadTopicList(true);
  },

  onLike(e) {
    const { id } = e.currentTarget.dataset;
    const { topicList } = this.data;
    const index = topicList.findIndex(t => t.id === id);
    
    if (index === -1) return;
    
    const item = topicList[index];
    const isCurrentlyLiked = item.isLiked;
    
    // 乐观更新UI
    const newIsLiked = !isCurrentlyLiked;
    const newLikes = newIsLiked ? item.likes + 1 : Math.max(0, item.likes - 1);
    
    this.setData({
      [`topicList[${index}].isLiked`]: newIsLiked,
      [`topicList[${index}].likes`]: newLikes
    });
    
    // 调用API
    const apiCall = newIsLiked 
      ? api.like.likeTopic(id) 
      : api.like.unlikeTopic(id);
    
    apiCall.then(res => {
      if (res.code !== 200) {
        // 回滚UI
        this.setData({
          [`topicList[${index}].isLiked`]: isCurrentlyLiked,
          [`topicList[${index}].likes`]: item.likes
        });
        wx.showToast({
          title: res.message || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('点赞失败:', err);
      // 回滚UI
      this.setData({
        [`topicList[${index}].isLiked`]: isCurrentlyLiked,
        [`topicList[${index}].likes`]: item.likes
      });
      // 优先显示业务错误信息，否则显示通用网络错误
      wx.showToast({
        title: err.message || '网络错误',
        icon: 'none'
      });
    });
  },

  onUserClick(e) {
    const { userid } = e.currentTarget.dataset;
    wx.showToast({ 
      title: '用户主页开发中', 
      icon: 'none' 
    });
  },

  onMoreOptions() {
    wx.showActionSheet({
      itemList: ['举报', '不感兴趣'],
      success(res) {
        wx.showToast({
          title: res.tapIndex === 0 ? '举报成功' : '已标记',
          icon: 'none'
        });
      }
    });
  },

  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({
      current: current,
      urls: urls
    });
  }
});
