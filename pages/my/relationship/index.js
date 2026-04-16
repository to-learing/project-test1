const app = getApp();
const api = require('../../../services/api');

Page({
  data: {
    type: 'following',
    list: [],
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 20
  },

  onLoad(options) {
    const type = options.type || 'following';
    this.setData({ type });
    wx.setNavigationBarTitle({
      title: type === 'following' ? '我的关注' : '我的粉丝'
    });
    
    this.loadData(true);
  },

  onPullDownRefresh() {
    this.loadData(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData(false);
    }
  },

  /**
   * 加载数据
   */
  loadData(refresh = false) {
    if (this.data.loading) return;
    
    const pageNum = refresh ? 1 : this.data.pageNum;
    
    this.setData({ loading: true });
    
    const apiCall = this.data.type === 'following' 
      ? api.user.getFollowing({ pageNum, pageSize: this.data.pageSize })
      : api.user.getFollowers({ pageNum, pageSize: this.data.pageSize });
    
    apiCall.then(res => {
      if (res.code === 200 && res.data) {
        const records = res.data.records || [];
        const formattedList = records.map(item => ({
          id: item.id,
          nickName: item.nickname || '微信用户',
          avatar: item.avatar || '',
          bio: item.bio || '',
          isMember: item.isMember || false,
          followed: item.isFollowed || false
        }));
        
        if (refresh) {
          this.setData({
            list: formattedList,
            pageNum: 2,
            hasMore: res.data.hasNext === true
          });
        } else {
          this.setData({
            list: [...this.data.list, ...formattedList],
            pageNum: pageNum + 1,
            hasMore: res.data.hasNext === true
          });
        }
      }
    }).catch(err => {
      console.error('加载列表失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 切换关注状态
   */
  handleToggleFollow(e) {
    const userId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const item = this.data.list[index];
    
    if (!item) return;
    
    const isFollowed = item.followed;
    const apiCall = isFollowed 
      ? api.user.unfollow(userId)
      : api.user.follow(userId);
    
    // 乐观更新UI
    this.setData({
      [`list[${index}].followed`]: !isFollowed
    });
    
    apiCall.then(res => {
      if (res.code !== 200) {
        // 回滚
        this.setData({
          [`list[${index}].followed`]: isFollowed
        });
        wx.showToast({ title: res.message || '操作失败', icon: 'none' });
      } else {
        // 刷新我的页面的数据
        if (app.globalData.userInfo) {
          const delta = !isFollowed ? 1 : -1;
          app.globalData.userInfo.followingCount = 
            Math.max(0, (app.globalData.userInfo.followingCount || 0) + delta);
        }
      }
    }).catch(err => {
      console.error('关注操作失败:', err);
      // 回滚
      this.setData({
        [`list[${index}].followed`]: isFollowed
      });
      wx.showToast({ title: '操作失败', icon: 'none' });
    });
  },

  /**
   * 跳转到用户主页
   */
  handleToUser(e) {
    const userId = e.currentTarget.dataset.id;
    // 可以跳转到用户详情页
    // wx.navigateTo({ url: `/pages/user/profile/index?id=${userId}` });
    wx.showToast({ title: '用户主页开发中', icon: 'none' });
  }
});