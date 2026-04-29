const app = getApp();

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comments: {
      type: Array,
      value: []
    },
    commentCount: {
      type: Number,
      value: 0
    },
    userAvatar: {
      type: String,
      value: ''
    },
    loadingComments: {
      type: Boolean,
      value: false
    },
    commentHasMore: {
      type: Boolean,
      value: true
    },
    showCommentInput: {
      type: Boolean,
      value: false
    },
    commentContent: {
      type: String,
      value: ''
    },
    isCommentEmpty: {
      type: Boolean,
      value: true
    },
    replyTarget: {
      type: Object,
      value: null
    },
    keyboardHeight: {
      type: Number,
      value: 0
    },
    currentUserId: {
      type: Number,
      value: null
    },
    authorUserId: {
      type: Number,
      value: null
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showActionSheet: false,
    actionSheetComment: null,
    actionSheetIsChild: false,
    actionSheetParentComment: null,
    actionOptions: []
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
    },

    /**
     * 长按评论显示操作菜单
     */
    handleLongPress: function(e) {
      const comment = e.currentTarget.dataset.comment;
      const isChild = e.currentTarget.dataset.isChild || false;
      const parent = e.currentTarget.dataset.parent;
      
      if (!comment) return;
      
      this._showActionSheet(comment, isChild, parent);
    },

    /**
     * 显示操作菜单
     */
    _showActionSheet: function(comment, isChild, parent) {
      const currentUserId = this.properties.currentUserId;
      const authorUserId = this.properties.authorUserId;
      const commentUserId = comment.userId;
      
      const isOwnComment = currentUserId && currentUserId === commentUserId;
      const isAuthor = authorUserId && currentUserId && currentUserId === authorUserId;
      const isTopLevelComment = !isChild && (!comment.parentId || comment.parentId === 0);
      
      const options = [];
      
      options.push({
        key: 'copy',
        label: '复制内容',
        icon: 'copy'
      });
      
      if (isOwnComment) {
        options.push({
          key: 'delete',
          label: '删除评论',
          icon: 'delete',
          danger: true
        });
      }
      
      if (!isOwnComment) {
        options.push({
          key: 'report',
          label: '举报评论',
          icon: 'error-circle'
        });
      }
      
      if (isAuthor) {
        if (!isOwnComment) {
          if (!options.find(opt => opt.key === 'delete')) {
            options.push({
              key: 'delete',
              label: '删除评论',
              icon: 'delete',
              danger: true
            });
          }
        }
        
        if (isTopLevelComment) {
          const isAlreadyTop = comment.isTop === true;
          options.push({
            key: isAlreadyTop ? 'unTop' : 'top',
            label: isAlreadyTop ? '取消置顶' : '置顶',
            icon: 'top'
          });
        }
      }
      
      this.setData({
        showActionSheet: true,
        actionSheetComment: comment,
        actionSheetIsChild: isChild,
        actionSheetParentComment: parent,
        actionOptions: options
      });
    },

    /**
     * 隐藏操作菜单
     */
    handleHideActionSheet: function() {
      this.setData({
        showActionSheet: false,
        actionSheetComment: null,
        actionSheetIsChild: false,
        actionSheetParentComment: null,
        actionOptions: []
      });
    },

    /**
     * 点击操作菜单选项
     */
    handleActionTap: function(e) {
      const key = e.currentTarget.dataset.key;
      const comment = this.data.actionSheetComment;
      const isChild = this.data.actionSheetIsChild;
      const parent = this.data.actionSheetParentComment;
      
      this.handleHideActionSheet();
      
      switch (key) {
        case 'copy':
          this._handleCopy(comment);
          break;
        case 'delete':
          this._handleDelete(comment, isChild, parent);
          break;
        case 'report':
          this._handleReport(comment);
          break;
        case 'top':
          this._handleTop(comment, true);
          break;
        case 'unTop':
          this._handleTop(comment, false);
          break;
      }
    },

    /**
     * 复制评论内容
     */
    _handleCopy: function(comment) {
      if (!comment || !comment.content) {
        wx.showToast({ title: '暂无内容可复制', icon: 'none' });
        return;
      }
      
      wx.setClipboardData({
        data: comment.content,
        success: function() {
          wx.showToast({ title: '已复制', icon: 'success' });
        },
        fail: function() {
          wx.showToast({ title: '复制失败', icon: 'none' });
        }
      });
    },

    /**
     * 删除评论
     */
    _handleDelete: function(comment, isChild, parent) {
      const that = this;
      
      wx.showModal({
        title: '提示',
        content: '确定删除该评论吗？',
        confirmText: '删除',
        confirmColor: '#ff4d4f',
        success: function(res) {
          if (res.confirm) {
            that.triggerEvent('deleteComment', { 
              comment: comment, 
              isChild: isChild,
              parent: parent
            });
          }
        }
      });
    },

    /**
     * 举报评论
     */
    _handleReport: function(comment) {
      this.triggerEvent('reportComment', { comment: comment });
    },

    /**
     * 置顶/取消置顶评论
     */
    _handleTop: function(comment, isTop) {
      this.triggerEvent('toggleTop', { 
        comment: comment, 
        isTop: isTop 
      });
    }
  }
});
