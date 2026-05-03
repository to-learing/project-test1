/**
 * 文章详情页
 * 
 * 功能说明：
 * 1. 展示文章完整内容（标题、作者、富文本内容、编辑时间）
 * 2. 非会员内容截断提示
 * 3. 点赞、收藏、评论功能
 * 4. 嵌套评论展示，支持展开/收起子评论
 * 5. 分享功能
 */

const app = getApp();
const api = require('../../../services/api');
const util = require('../../../utils/util');

Page({
  /**
   * 页面数据
   */
  data: {
    // 文章ID
    articleId: null,
    // 文章详情
    article: null,
    // 加载状态
    loading: true,
    // 是否已点赞
    isLiked: false,
    // 是否已收藏
    isFavorite: false,
    // 评论列表
    comments: [],
    // 评论分页
    commentPageNum: 1,
    commentPageSize: 10,
    commentHasMore: true,
    loadingComments: false,
    // 子评论分页（懒加载）
    childrenPageSize: 10,
    // 一级评论默认展示的子评论数量
    childrenPreviewLimit: 1,
    // 评论输入
    commentContent: '',
    // 评论是否为空（用于按钮禁用态）
    isCommentEmpty: true,
    // 是否显示评论输入框
    showCommentInput: false,
    // 回复目标
    replyTarget: null,
    // 回复的父评论（用于子评论回复）
    replyParent: null,
    // 内容是否被截断
    isTruncated: false,
    // 是否会员
    isMember: false,
    // 当前用户头像
    userAvatar: '',
    // 键盘高度
    keyboardHeight: 0
  },

  /**
   * 生命周期 - 页面加载
   */
  onLoad: function(options) {
    console.log('[ArticleDetail] 页面加载', options);
    
    if (!options.id) {
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      articleId: Number(options.id),
      isMember: app.globalData.isMember,
      userAvatar: app.globalData.userInfo?.avatar || ''
    });
    
    // 加载文章详情
    this.loadArticleDetail();
  },

  /**
   * 页面显示时刷新用户头像
   */
  onShow: function() {
    this.setData({
      userAvatar: app.globalData.userInfo?.avatar || ''
    });
  },

  /**
   * 加载文章详情
   */
  loadArticleDetail: function() {
    this.setData({ loading: true });
    
    api.article.getDetail(this.data.articleId).then(res => {
      if (res.code === 200) {
        const article = res.data;
        
        // 格式化数据
        article.createTimeFormatted = util.formatDate(article.createTime, 'YYYY-MM-DD');
        article.updateTimeFormatted = util.formatDate(article.updateTime || article.createTime, 'YYYY-MM-DD');
        article.viewCountFormatted = util.formatNumberShort(article.viewCount);
        article.likeCountFormatted = util.formatNumberShort(article.likeCount);
        article.commentCountFormatted = util.formatNumberShort(article.commentCount);
        article.favoriteCountFormatted = util.formatNumberShort(article.favoriteCount || 0);
        
        this.setData({
          article: article,
          loading: false,
          isTruncated: article.isTruncated || false
        });
        
        // 检查点赞状态
        if (app.globalData.isLoggedIn) {
          this.checkLikeStatus();
        }
        
        // 加载评论
        this.loadComments(true);
      }
    }).catch(err => {
      console.error('[ArticleDetail] 加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  /**
   * 检查点赞状态
   */
  checkLikeStatus: function() {
    api.like.checkArticleLiked(this.data.articleId).then(res => {
      if (res.code === 200) {
        this.setData({ isLiked: res.data });
      }
    });
  },

  /**
   * 加载评论列表
   */
  loadComments: function(refresh = false) {
    if (refresh) {
      this.setData({
        commentPageNum: 1,
        commentHasMore: true
      });
    }
    
    if (!this.data.commentHasMore || this.data.loadingComments) return;
    
    this.setData({ loadingComments: true });
    
    // 首次加载仅返回少量子评论
    // showLoading: false 避免全局遮罩与页面内联loading冲突
    api.comment.getList({
      bizType: 1,
      bizId: this.data.articleId,
      pageNum: this.data.commentPageNum,
      pageSize: this.data.commentPageSize,
      childrenLimit: this.data.childrenPreviewLimit
    }, { showLoading: false }).then(res => {
      if (res.code === 200 && res.data && res.data.records) {
        const newComments = res.data.records.map(item => {
          // 优先使用后端返回的子评论总数
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
            // 当前已加载的子评论小于总数，则还有更多
            childrenHasMore: children.length < childrenCount,
            loadingChildren: false,
            children
          };
        });
        
        this.setData({
          comments: refresh ? newComments : this._mergeComments(this.data.comments, newComments),
          commentPageNum: this.data.commentPageNum + 1,
          commentHasMore: res.data.hasNext === true,
          loadingComments: false
        });
      } else {
        // 响应格式异常，重置加载状态
        console.warn('[ArticleDetail] 评论列表响应格式异常:', res);
        this.setData({ loadingComments: false });
      }
    }).catch(err => {
      console.error('[ArticleDetail] 加载评论失败:', err);
      this.setData({ loadingComments: false });
      wx.showToast({
        title: '加载评论失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  /**
   * 展开子评论
   */
  expandReplies: function(e) {
    const index = e.currentTarget.dataset.index;
    const comment = this.data.comments[index];
    // comment.loadingChildren：正在加载中就不重复请求
    // !comment.childrenHasMore：已经加载完了就不请求
    if (!comment || comment.loadingChildren || !comment.childrenHasMore) return;

    const loadingKey = `comments[${index}].loadingChildren`;
    const showKey = `comments[${index}].showAllChildren`;
    this.setData({
      [loadingKey]: true,
      [showKey]: true
    });

    // 按页拉取更多子评论
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
        // 合并去重（以ID为准）
        const mergedMap = new Map();
        existing.forEach(item => mergedMap.set(item.id, item));
        newChildren.forEach(item => mergedMap.set(item.id, item));
        const merged = Array.from(mergedMap.values());

        // 兜底使用后端总数
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

  /**
   * 点赞/取消点赞
   */
  onLike: function() {
    if (!app.checkLogin()) return;
    
    const { isLiked, articleId, article } = this.data;
    
    // 使用新的专用文章点赞 API
    const action = isLiked 
      ? api.like.unlikeArticle(articleId) 
      : api.like.likeArticle(articleId);
    
    action.then(res => {
      if (res.code === 200) {
        const newLikeCount = isLiked ? article.likeCount - 1 : article.likeCount + 1;
        this.setData({
          isLiked: !isLiked,
          'article.likeCount': newLikeCount,
          'article.likeCountFormatted': util.formatNumberShort(newLikeCount)
        });
        
        wx.showToast({
          title: isLiked ? '已取消' : '已点赞',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 收藏/取消收藏
   */
  onFavorite: function() {
    if (!app.checkLogin()) return;
    
    // TODO: 实现收藏功能
    wx.showToast({
      title: '收藏功能开发中',
      icon: 'none'
    });
  },

  /**
   * 评论点赞
   */
  onCommentLike: function(e) {
    if (!app.checkLogin()) return;
    
    const comment = e.currentTarget.dataset.comment;
    const isLiked = comment.isLiked;
    
    // 使用新的专用评论点赞 API
    const action = isLiked 
      ? api.like.unlikeComment(comment.id) 
      : api.like.likeComment(comment.id);
    
    action.then(res => {
      if (res.code === 200) {
        // 更新评论列表中的点赞状态
        this.updateCommentLikeStatus(comment.id, !isLiked);
      }
    });
  },

  /**
   * 更新评论点赞状态
   */
  updateCommentLikeStatus: function(commentId, isLiked) {
    const comments = this.data.comments.map(item => {
      if (item.id === commentId) {
        return {
          ...item,
          isLiked: isLiked,
          likeCount: isLiked ? item.likeCount + 1 : item.likeCount - 1,
          likeCountFormatted: util.formatNumberShort(isLiked ? item.likeCount + 1 : item.likeCount - 1)
        };
      }
      // 检查子评论
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

  /**
   * 显示评论输入框
   */
  showCommentInput: function() {
    if (!app.checkLogin()) return;
    
    this.setData({
      showCommentInput: true,
      replyTarget: null,
      replyParent: null,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  /**
   * 回复一级评论
   */
  onReply: function(e) {
    if (!app.checkLogin()) return;
    
    const comment = e.currentTarget.dataset.comment;
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: comment, // 一级评论回复，父评论就是自己
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  /**
   * 回复子评论
   */
  onReplyChild: function(e) {
    if (!app.checkLogin()) return;
    
    const comment = e.currentTarget.dataset.comment;
    const parent = e.currentTarget.dataset.parent;
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: parent, // 子评论的父评论是一级评论
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  /**
   * 评论内容输入
   */
  onCommentInput: function(e) {
     const value = e.detail.value || '';
    this.setData({
      commentContent: value,
      isCommentEmpty: !value.trim()
    });
  },

  /**
   * 提交评论
   */
  submitComment: function() {
    const content = this.data.commentContent.trim();
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }
    
    const data = {
      bizType: 1,
      bizId: this.data.articleId,
      content: content
    };
    
    // 如果是回复
    if (this.data.replyTarget && this.data.replyParent) {
      data.parentId = this.data.replyParent.id; // 使用一级评论作为parentId
      data.replyUserId = this.data.replyTarget.userId;
    }
    
    api.comment.create(data).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
        
        this.hideCommentInput();
        
        // 刷新评论列表
        this.loadComments(true);
        
        // 更新评论数
        const newCount = this.data.article.commentCount + 1;
        this.setData({
          'article.commentCount': newCount,
          'article.commentCountFormatted': util.formatNumberShort(newCount)
        });
      }
    });
  },

  /**
   * 隐藏评论输入框
   */
  hideCommentInput: function() {
    this.setData({
      showCommentInput: false,
      commentContent: '',
      replyTarget: null,
      replyParent: null,
      keyboardHeight: 0,
      isCommentEmpty: true
    });
  },

  /**
   * 键盘弹起
   */
  onKeyboardShow: function(e) {
    const keyboardHeight = e.detail.height || 0;
    this.setData({ keyboardHeight });
  },

  /**
   * 键盘收起
   */
  onKeyboardHide: function() {
    this.setData({ keyboardHeight: 0 });
  },

  /**
   * 切换评论排序
   */
  toggleCommentSort: function() {
    wx.showToast({
      title: '排序功能开发中',
      icon: 'none'
    });
  },

  /**
   * 开通会员
   */
  goToMember: function() {
    wx.navigateTo({
      url: '/pages/member/member'
    });
  },

  /**
   * 加载更多评论
   */
  loadMoreComments: function() {
    this.loadComments(false);
  },

  /**
   * 合并一级评论并去重（以 id 为准，保留新数据）
   * 解决 offset 分页在新增评论后导致相邻两页数据重叠的问题
   */
  _mergeComments: function(existing, incoming) {
    const map = new Map();
    existing.forEach(item => map.set(item.id, item));
    incoming.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    const article = this.data.article;
    return {
      title: article ? article.title : '极光密码',
      path: `/pages/article/detail/detail?id=${this.data.articleId}`,
      imageUrl: article ? article.coverImage : ''
    };
  },

  /**
   * 处理组件展开子评论事件
   */
  handleExpandReplies: function(e) {
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

  /**
   * 处理组件回复一级评论事件
   */
  handleReply: function(e) {
    const { comment } = e.detail;
    if (!app.checkLogin()) return;
    
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: comment,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  /**
   * 处理组件回复子评论事件
   */
  handleReplyChild: function(e) {
    const { comment, parent } = e.detail;
    if (!app.checkLogin()) return;
    
    this.setData({
      showCommentInput: true,
      replyTarget: comment,
      replyParent: parent,
      isCommentEmpty: !(this.data.commentContent || '').trim()
    });
  },

  /**
   * 处理组件评论点赞事件
   */
  handleCommentLike: function(e) {
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

  /**
   * 处理组件评论输入事件
   */
  handleCommentInput: function(e) {
    const { value } = e.detail;
    this.setData({
      commentContent: value,
      isCommentEmpty: !value.trim()
    });
  },

  /**
   * 处理组件键盘显示事件
   */
  handleKeyboardShow: function(e) {
    const { keyboardHeight } = e.detail;
    this.setData({ keyboardHeight });
  },

  /**
   * 处理组件键盘隐藏事件
   */
  handleKeyboardHide: function() {
    this.setData({ keyboardHeight: 0 });
  }
});
