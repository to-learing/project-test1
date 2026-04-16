const api = require('../../../services/api');

Page({
  data: {
    topics: [],
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10,
    isEmpty: false
  },

  onLoad() {
    this.loadTopics(true);
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadTopics(true);
  },

  onPullDownRefresh() {
    this.loadTopics(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTopics(false);
    }
  },

  /**
   * 加载我的话题列表
   */
  loadTopics(refresh = false) {
    if (this.data.loading) return Promise.resolve();

    const pageNum = refresh ? 1 : this.data.pageNum;

    this.setData({ loading: true });

    return api.topic.getMine({
      pageNum: pageNum,
      pageSize: this.data.pageSize
    }).then(res => {
      if (res.code === 200 && res.data) {
        const records = res.data.records || [];
        const formattedTopics = records.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content || '',
          coverImage: item.coverImage || '',
          likeCount: item.likeCount || 0,
          commentCount: item.commentCount || 0,
          viewCount: item.viewCount || 0,
          date: this.formatDate(item.createTime)
        }));

        if (refresh) {
          this.setData({
            topics: formattedTopics,
            pageNum: 2,
            hasMore: res.data.hasNext === true,
            isEmpty: formattedTopics.length === 0
          });
        } else {
          this.setData({
            topics: [...this.data.topics, ...formattedTopics],
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
      console.error('加载我的话题失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    return dateStr.substring(0, 10);
  },

  /**
   * 跳转到话题详情
   */
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/topic/detail/detail?id=${id}`
    });
  },

  /**
   * 删除话题
   */
  deleteTopic(e) {
    const { id, title } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '删除确认',
      content: `确定要删除话题"${title}"吗？删除后不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteTopic(id);
        }
      }
    });
  },

  /**
   * 执行删除话题操作
   */
  doDeleteTopic(id) {
    wx.showLoading({ title: '删除中...' });
    
    api.topic.delete(id).then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        // 从列表中移除
        const topics = this.data.topics.filter(item => item.id !== id);
        this.setData({ 
          topics: topics,
          isEmpty: topics.length === 0
        });
      } else {
        wx.showToast({
          title: res.message || '删除失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('删除话题失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  /**
   * 跳转到发布话题页面
   */
  goToCreate() {
    wx.navigateTo({
      url: '/pages/topic/create/create'
    });
  }
});