const api = require('../../../services/api');
const util = require('../../../utils/util');
const app = getApp();

Page({
  data: {
    topic: null,
    comments: [],
    isLiked: false,
    isFavorite: false,
    isFollowed: false,
    topicId: null,
    loading: false,
    loadingComments: false,
    commentHasMore: true,
    commentPageNum: 1,
    commentPageSize: 10,
    childrenPageSize: 10,
    childrenPreviewLimit: 1,
    commentContent: '',
    isCommentEmpty: true,
    showCommentInput: false,
    replyTarget: null,
    replyParent: null,
    userAvatar: '',
    keyboardHeight: 0,
    currentUserId: null,
    authorUserId: null
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      const currentUserId = app.globalData.userInfo?.id || null;
      this.setData({ 
        topicId: id,
        userAvatar: app.globalData.userInfo?.avatar || '',
        currentUserId: currentUserId
      });
      this.loadTopicDetail(id);
      this.loadComments(true);
    }
  },

  onShow() {
    const currentUserId = app.globalData.userInfo?.id || null;
    this.setData({
      userAvatar: app.globalData.userInfo?.avatar || '',
      currentUserId: currentUserId
    });
  },

  loadTopicDetail(id) {
    this.setData({ loading: true });
    
    api.topic.getDetail(id).then(res => {
      if (res.code === 200 && res.data) {
        const detail = res.data;
        const topic = {
          id: detail.id,
          title: detail.title,
          summary: detail.content,
          author: {
            id: detail.userId,
            name: detail.userNickname || '微信用户',
            avatar: detail.userAvatar || '/images/default-avatar.png'
          },
          images: detail.images || [],
          cover: detail.coverImage,
          tags: detail.tags || [],
          likes: detail.likeCount || 0,
          likesFormatted: util.formatNumberShort(detail.likeCount || 0),
          comments: detail.commentCount || 0,
          commentsFormatted: util.formatNumberShort(detail.commentCount || 0),
          favoriteCount: detail.favoriteCount || 0,
          favoriteCountFormatted: util.formatNumberShort(detail.favoriteCount || 0),
          viewCount: detail.viewCount || 0,
          createTime: util.formatDate(detail.createTime, 'YYYY-MM-DD'),
          isOwner: detail.isOwner || false
        };
        
        this.setData({
          topic: topic,
          authorUserId: detail.userId,
          isLiked: detail.isLiked || false,
          isFavorite: detail.isFavorite || false
        });
        
        if (detail.userId && !detail.isOwner) {
          this.checkFollowStatus(detail.userId);
        }
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('加载话题详情失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  checkFollowStatus(userId) {
    if (!app.globalData.isLoggedIn) return;
    
    api.user.checkFollowing(userId).then(res => {
      if (res.code === 200) {
        this.setData({ isFollowed: res.data || false });
      }
    }).catch(err => {
      console.error('检查关注状态失败:', err);
    });
  },

  toggleFollow() {
    const { topic, isFollowed } = this.data;
    
    if (!topic || !topic.author || !topic.author.id) return;
    
    if (!app.checkLogin()) return;
    
    if (topic.isOwner) {
      wx.showToast({ title: '不能关注自己', icon: 'none' });
      return;
    }
    
    const userId = topic.author.id;
    
    if (isFollowed) {
      wx.showModal({
        title: '提示',
        content: `确定要取消关注 ${topic.author.name} 吗？`,
        confirmText: '取消关注',
        confirmColor: '#ff4d4f',
        cancelText: '再想想',
        success: (res) => {
          if (res.confirm) {
            this.doFollowAction(userId, false);
          }
        }
      });
    } else {
      this.doFollowAction(userId, true);
    }
  },

  doFollowAction(userId, isFollow) {
    const previousStatus = this.data.isFollowed;
    
    console.log('[关注操作] 开始执行, userId:', userId, ', isFollow:', isFollow, ', previousStatus:', previousStatus);
    
    this.setData({ isFollowed: isFollow });
    
    const apiCall = isFollow 
      ? api.user.follow(userId)
      : api.user.unfollow(userId);
    
    apiCall.then(res => {
      console.log('[关注操作] API返回:', res);
      if (res.code !== 200) {
        this.setData({ isFollowed: previousStatus });
        wx.showToast({ title: res.message || '操作失败', icon: 'none' });
      } else {
        wx.showToast({ 
          title: isFollow ? '关注成功' : '已取消关注', 
          icon: 'success' 
        });
      }
    }).catch(err => {
      console.error('[关注操作] API错误:', err);
      this.setData({ isFollowed: previousStatus });
      wx.showToast({ title: '操作失败', icon: 'none' });
    });
  },

  loadComments(refresh = false) {
    if (refresh) {
      this.setData({
        commentPageNum: 1,
        commentHasMore: true
      });
    }
    
    if (!this.data.commentHasMore || this.data.loadingComments) return;
    
    this.setData({ loadingComments: true });
    
    api.comment.getList({
      bizType: 2,
      bizId: this.data.topicId,
      pageNum: this.data.commentPageNum,
      pageSize: this.data.commentPageSize,
      childrenLimit: this.data.childrenPreviewLimit
    }, { showLoading: false }).then(res => {
      if (res.code === 200 && res.data && res.data.records) {
        const newComments = res.data.records.map(item => {
          const childrenCount = typeof item.childrenCount === 'number'
            ? item.childrenCount
            : (typeof item.replyCount === 'number' ? item.replyCount : (item.children || []).length);
          const children = (item.children || []).map(child => ({
            ...child,
            createTimeFormatted: util.formatRelativeTime(child.createTime),
            likeCountFormatted: util.formatNumberShort(child.likeCount)
          }));

          return {
            ...item,
            createTimeFormatted: util.formatRelativeTime(item.createTime),
            likeCountFormatted: util.formatNumberShort(item.likeCount),
            showAllChildren: false,
            childrenCount: childrenCount,
            childrenPageNum: 1,
            childrenHasMore: children.length < childrenCount,
            loadingChildren: false,
            children
          };
        });
        
        this.setData({
          comments: refresh ? newComments : [...this.data.comments, ...newComments],
          commentPageNum: this.data.commentPageNum + 1,
          commentHasMore: res.data.hasNext === true,
          loadingComments: false
        });
      } else {
        console.warn('[TopicDetail] 评论列表响应格式异常:', res);
        this.setData({ loadingComments: false });
      }
    }).catch(err => {
      console.error('[TopicDetail] 加载评论失败:', err);
      this.setData({ loadingComments: false });
      wx.showToast({
        title: '加载评论失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  loadMoreComments() {
    this.loadComments(false);
  },

  expandReplies(e) {
    const index = e.currentTarget.dataset.index;
    const comment = this.data.comments[index];
    if (!comment || comment.loadingChildren || !comment.childrenHasMore) return;

    const loadingKey = `comments[${index}].loadingChildren`;
    const showKey = `comments[${index}].showAllChildren`;
    this.setData({
      [loadingKey]: true,
      [showKey]: true
    });

    api.comment.getChildren({
      parentId: comment.id,
      pageNum: comment.childrenPageNum,
      pageSize: this.data.childrenPageSize
    }).then(res => {
      if (res.code === 200) {
        const newChildren = res.data.records.map(child => ({
          ...child,
          createTimeFormatted: util.formatRelativeTime(child.createTime),
          likeCountFormatted: util.formatNumberShort(child.likeCount)
        }));

        const existing = comment.children || [];
        const mergedMap = new Map();
        existing.forEach(item => mergedMap.set(item.id, item));
        newChildren.forEach(item => mergedMap.set(item.id, item));
        const merged = Array.from(mergedMap.values());

        const total = typeof res.data.total === 'number'
          ? res.data.total
          : (comment.childrenCount || merged.length);

        const baseKey = `comments[${index}]`;
        this.setData({
          [`${baseKey}.children`]: merged,
          [`${baseKey}.childrenCount`]: total,
          [`${baseKey}.childrenPageNum`]: comment.childrenPageNum + 1,
          [`${baseKey}.childrenHasMore`]: merged.length < total,
          [`${baseKey}.loadingChildren`]: false
        });
      }
    }).catch(() => {
      this.setData({
        [loadingKey]: false
      });
    });
  },

  toggleLike() {
    if (!app.checkLogin()) return;
    
    const { isLiked, topic, topicId } = this.data;
    const newStatus = !isLiked;
    const newCount = newStatus ? topic.likes + 1 : Math.max(0, topic.likes - 1);
    
    this.setData({
      isLiked: newStatus,
      'topic.likes': newCount,
      'topic.likesFormatted': util.formatNumberShort(newCount)
    });
    
    const apiCall = newStatus 
      ? api.like.likeTopic(topicId) 
      : api.like.unlikeTopic(topicId);
    
    apiCall.then(res => {
      if (res.code !== 200) {
        this.setData({
          isLiked: isLiked,
          'topic.likes': topic.likes,
          'topic.likesFormatted': util.formatNumberShort(topic.likes)
        });
        wx.showToast({
          title: res.message || '操作失败',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: newStatus ? '已点赞' : '已取消',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('点赞失败:', err);
      this.setData({
        isLiked: isLiked,
        'topic.likes': topic.likes,
        'topic.likesFormatted': util.formatNumberShort(topic.likes)
      });
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  onFavorite() {
    if (!app.checkLogin()) return;
    
    wx.showToast({
      title: '收藏功能开发中',
      icon: 'none'
    });
  },

  onCommentLike(e) {
    if (!app.checkLogin()) return;
    
    const comment = e.currentTarget.dataset.comment;
    const isLiked = comment.isLiked;
    
    const action = isLiked 
      ? api.like.unlikeComment(comment.id) 
      : api.like.likeComment(comment.id);
    
    action.then(res => {
      if (res.code === 200) {
        this.updateCommentLikeStatus(comment.id, !isLiked);
      }
    });
  },

  updateCommentLikeStatus(commentId, isLiked) {
    const comments = this.data.comments.map(item => {
      if (item.id === commentId) {
        return {
          ...item,
          isLiked: isLiked,
          likeCount: isLiked ? item.likeCount + 1 : item.likeCount - 1,
          likeCountFormatted: util.formatNumberShort(isLiked ? item.likeCount + 1 : item.likeCount - 1)
        };
      }
      if (item.children && item.children.length > 0) {
        item.children = item.children.map(child => {
          if (child.id === commentId) {
            return {
              ...child,
              isLiked: isLiked,
              likeCount: isLiked ? child.likeCount + 1 : child.likeCount - 1,
              likeCountFormatted: util.formatNumberShort(isLiked ? child.likeCount + 1 : child.likeCount - 1)
            };
          }
          return child;
        });
      }
      return item;
    });
    
    this.setData({ comments });
  },

  showCommentInput() {
    if (!app.checkLogin()) return;
    
    this.setData({
      showCommentInput: true,
      replyTarget: null,
      replyParent: null,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  onReply(e) {
    if (!app.checkLogin()) return;
    
    const comment = e.currentTarget.dataset.comment;
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: comment,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  onReplyChild(e) {
    if (!app.checkLogin()) return;
    
    const comment = e.currentTarget.dataset.comment;
    const parent = e.currentTarget.dataset.parent;
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: parent,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  onCommentInput(e) {
    const value = e.detail.value || '';
    this.setData({
      commentContent: value,
      isCommentEmpty: !value.trim()
    });
  },

  submitComment() {
    const content = this.data.commentContent.trim();
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    const data = {
      bizType: 2,
      bizId: this.data.topicId,
      content: content
    };

    if (this.data.replyTarget && this.data.replyParent) {
      data.parentId = this.data.replyParent.id;
      data.replyUserId = this.data.replyTarget.userId;
    }

    api.comment.create(data).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
        
        this.hideCommentInput();
        
        this.loadComments(true);
        
        const newCount = this.data.topic.comments + 1;
        this.setData({
          'topic.comments': newCount,
          'topic.commentsFormatted': util.formatNumberShort(newCount)
        });
      } else {
        wx.showToast({
          title: res.message || '评论失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('评论失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  hideCommentInput() {
    this.setData({
      showCommentInput: false,
      commentContent: '',
      replyTarget: null,
      replyParent: null,
      keyboardHeight: 0,
      isCommentEmpty: true
    });
  },

  onKeyboardShow(e) {
    const keyboardHeight = e.detail.height || 0;
    this.setData({ keyboardHeight });
  },

  onKeyboardHide() {
    this.setData({ keyboardHeight: 0 });
  },

  toggleCommentSort() {
    wx.showToast({
      title: '排序功能开发中',
      icon: 'none'
    });
  },

  handleExpandReplies(e) {
    const { index } = e.detail;
    const comment = this.data.comments[index];
    if (!comment || comment.loadingChildren || !comment.childrenHasMore) return;

    const loadingKey = `comments[${index}].loadingChildren`;
    const showKey = `comments[${index}].showAllChildren`;
    this.setData({
      [loadingKey]: true,
      [showKey]: true
    });

    api.comment.getChildren({
      parentId: comment.id,
      pageNum: comment.childrenPageNum,
      pageSize: this.data.childrenPageSize
    }).then(res => {
      if (res.code === 200) {
        const newChildren = res.data.records.map(child => ({
          ...child,
          createTimeFormatted: util.formatRelativeTime(child.createTime),
          likeCountFormatted: util.formatNumberShort(child.likeCount)
        }));

        const existing = comment.children || [];
        const mergedMap = new Map();
        existing.forEach(item => mergedMap.set(item.id, item));
        newChildren.forEach(item => mergedMap.set(item.id, item));
        const merged = Array.from(mergedMap.values());

        const total = typeof res.data.total === 'number'
          ? res.data.total
          : (comment.childrenCount || merged.length);

        const baseKey = `comments[${index}]`;
        this.setData({
          [`${baseKey}.children`]: merged,
          [`${baseKey}.childrenCount`]: total,
          [`${baseKey}.childrenPageNum`]: comment.childrenPageNum + 1,
          [`${baseKey}.childrenHasMore`]: merged.length < total,
          [`${baseKey}.loadingChildren`]: false
        });
      }
    }).catch(() => {
      this.setData({
        [loadingKey]: false
      });
    });
  },

  handleReply(e) {
    const { comment } = e.detail;
    if (!app.checkLogin()) return;
    
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: comment,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  handleReplyChild(e) {
    const { comment, parent } = e.detail;
    if (!app.checkLogin()) return;
    
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: parent,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  handleCommentLike(e) {
    const { comment } = e.detail;
    if (!app.checkLogin()) return;
    
    const isLiked = comment.isLiked;
    const action = isLiked 
      ? api.like.unlikeComment(comment.id) 
      : api.like.likeComment(comment.id);
    
    action.then(res => {
      if (res.code === 200) {
        this.updateCommentLikeStatus(comment.id, !isLiked);
      }
    });
  },

  handleCommentInput(e) {
    const { value } = e.detail;
    this.setData({
      commentContent: value,
      isCommentEmpty: !value.trim()
    });
  },

  handleKeyboardShow(e) {
    const { keyboardHeight } = e.detail;
    this.setData({ keyboardHeight });
  },

  handleKeyboardHide() {
    this.setData({ keyboardHeight: 0 });
  },

  handleDeleteComment(e) {
    const { comment, isChild, parent } = e.detail;
    
    if (!app.checkLogin()) return;
    if (!comment || !comment.id) return;
    
    wx.showLoading({ title: '删除中...' });
    
    api.comment.delete(comment.id).then(res => {
      wx.hideLoading();
      
      if (res.code === 200) {
        this._removeCommentFromList(comment.id, isChild, parent);
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        const newCount = Math.max(0, this.data.topic.comments - 1);
        this.setData({
          'topic.comments': newCount,
          'topic.commentsFormatted': util.formatNumberShort(newCount)
        });
      } else {
        wx.showToast({
          title: res.message || '删除失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('删除评论失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  _removeCommentFromList(commentId, isChild, parent) {
    let comments = [...this.data.comments];
    
    if (isChild && parent) {
      comments = comments.map(item => {
        if (item.id === parent.id && item.children) {
          return {
            ...item,
            children: item.children.filter(child => child.id !== commentId),
            childrenCount: Math.max(0, (item.childrenCount || 0) - 1)
          };
        }
        return item;
      });
    } else {
      comments = comments.filter(item => item.id !== commentId);
    }
    
    this.setData({ comments });
  },

  handleReportComment(e) {
    const { comment } = e.detail;
    
    if (!app.checkLogin()) return;
    if (!comment || !comment.id) return;
    
    const that = this;
    
    wx.showActionSheet({
      itemList: ['广告骚扰', '色情低俗', '暴力敏感', '违法违规', '其他'],
      success: function(res) {
        const reasonType = res.tapIndex + 1;
        const reasonLabels = ['广告骚扰', '色情低俗', '暴力敏感', '违法违规', '其他'];
        const reason = reasonLabels[res.tapIndex];
        
        wx.showLoading({ title: '提交中...' });
        
        api.comment.report({
          commentId: comment.id,
          reasonType: reasonType,
          reason: reason
        }).then(res => {
          wx.hideLoading();
          
          if (res.code === 200) {
            wx.showToast({
              title: '举报成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: res.message || '举报失败',
              icon: 'none'
            });
          }
        }).catch(err => {
          wx.hideLoading();
          console.error('举报评论失败:', err);
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        });
      }
    });
  },

  handleToggleTop(e) {
    const { comment, isTop } = e.detail;
    
    if (!app.checkLogin()) return;
    if (!comment || !comment.id) return;
    
    wx.showLoading({ title: isTop ? '置顶中...' : '取消置顶中...' });
    
    const apiCall = isTop 
      ? api.comment.top(comment.id)
      : api.comment.unTop(comment.id);
    
    apiCall.then(res => {
      wx.hideLoading();
      
      if (res.code === 200) {
        this._updateCommentTopStatus(comment.id, isTop);
        
        wx.showToast({
          title: isTop ? '置顶成功' : '已取消置顶',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.message || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('置顶评论失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  _updateCommentTopStatus(commentId, isTop) {
    const comments = this.data.comments.map(item => {
      if (item.id === commentId) {
        return {
          ...item,
          isTop: isTop
        };
      }
      return item;
    });
    
    comments.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      return 0;
    });
    
    this.setData({ comments });
  }
});
