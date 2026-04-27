Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 评论列表
    comments: {
      type: Array,
      value: []
    },
    // 评论数量
    commentCount: {
      type: Number,
      value: 0
    },
    // 当前用户头像
    userAvatar: {
      type: String,
      value: ''
    },
    // 是否正在加载评论
    loadingComments: {
      type: Boolean,
      value: false
    },
    // 是否有更多评论
    commentHasMore: {
      type: Boolean,
      value: true
    },
    // 是否显示评论输入框
    showCommentInput: {
      type: Boolean,
      value: false
    },
    // 评论内容
    commentContent: {
      type: String,
      value: ''
    },
    // 评论是否为空
    isCommentEmpty: {
      type: Boolean,
      value: true
    },
    // 回复目标
    replyTarget: {
      type: Object,
      value: null
    },
    // 键盘高度
    keyboardHeight: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 切换评论排序
     */
    handleToggleCommentSort: function() {
      this.triggerEvent('toggleCommentSort');
    },

    /**
     * 显示评论输入框
     */
    handleShowCommentInput: function() {
      this.triggerEvent('showCommentInput');
    },

    /**
     * 加载更多评论
     */
    handleLoadMoreComments: function() {
      this.triggerEvent('loadMoreComments');
    },

    /**
     * 展开子评论
     */
    handleExpandReplies: function(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('expandReplies', { index });
    },

    /**
     * 回复一级评论
     */
    handleReply: function(e) {
      const comment = e.currentTarget.dataset.comment;
      this.triggerEvent('reply', { comment });
    },

    /**
     * 回复子评论
     */
    handleReplyChild: function(e) {
      const comment = e.currentTarget.dataset.comment;
      const parent = e.currentTarget.dataset.parent;
      this.triggerEvent('replyChild', { comment, parent });
    },

    /**
     * 评论点赞
     */
    handleCommentLike: function(e) {
      const comment = e.currentTarget.dataset.comment;
      this.triggerEvent('commentLike', { comment });
    },

    /**
     * 评论内容输入
     */
    handleCommentInput: function(e) {
      const value = e.detail.value || '';
      this.triggerEvent('commentInput', { value });
    },

    /**
     * 提交评论
     */
    handleSubmitComment: function() {
      this.triggerEvent('submitComment');
    },

    /**
     * 隐藏评论输入框
     */
    handleHideCommentInput: function() {
      this.triggerEvent('hideCommentInput');
    },

    /**
     * 键盘弹起
     */
    handleKeyboardShow: function(e) {
      const keyboardHeight = e.detail.height || 0;
      this.triggerEvent('keyboardShow', { keyboardHeight });
    },

    /**
     * 键盘收起
     */
    handleKeyboardHide: function() {
      this.triggerEvent('keyboardHide');
    }
  }
});
