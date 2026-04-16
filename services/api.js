/**
 * API接口封装模块
 * 
 * 功能说明：
 * 1. 统一管理所有API接口
 * 2. 按业务模块分类组织
 * 3. 提供语义化的调用方法
 */

const http = require('./request');

// ============================================
// 认证相关接口
// ============================================
const auth = {
  /**
   * 微信登录
   * @param {Object} data 登录数据
   * @param {String} data.code 微信登录code
   * @param {String} data.nickname 用户昵称
   * @param {String} data.avatar 用户头像
   * @returns {Promise}
   */
  wxLogin: function(data) {
    return http.post('/auth/wechat-login', data, { auth: false });
  },
  
  /**
   * 刷新Token
   * @param {String} refreshToken 刷新Token
   * @returns {Promise}
   */
  refreshToken: function(refreshToken) {
    return http.post('/auth/refresh-token', { refreshToken }, { auth: false });
  },
  
  /**
   * 退出登录
   * @returns {Promise}
   */
  logout: function() {
    return http.post('/auth/logout', {});
  }
};

// ============================================
// 用户相关接口
// ============================================
const user = {
  /**
   * 获取当前用户信息
   * @returns {Promise}
   */
  getInfo: function() {
    return http.get('/user/info', {}, { auth: true });
  },
  
  /**
   * 更新用户信息（旧接口，兼容）
   * @param {Object} data 用户信息
   * @param {String} data.nickname 昵称
   * @param {String} data.avatar 头像
   * @returns {Promise}
   */
  updateInfo: function(data) {
    return http.put('/user/info', data);
  },
  
  /**
   * 更新用户资料
   * @param {Object} data 用户资料
   * @param {String} data.nickname 昵称
   * @param {String} data.avatar 头像
   * @param {String} data.bio 个人简介
   * @param {Number} data.gender 性别
   * @returns {Promise}
   */
  updateProfile: function(data) {
    return http.put('/user/profile', data, { auth: true });
  },
  
  /**
   * 获取指定用户的公开信息
   * @param {Number} userId 用户ID
   * @returns {Promise}
   */
  getPublicInfo: function(userId) {
    return http.get(`/user/${userId}/profile`, {}, { auth: true });
  },
  
  /**
   * 关注用户
   * @param {Number} userId 被关注的用户ID
   * @returns {Promise}
   */
  follow: function(userId) {
    return http.post(`/user/${userId}/follow`, {}, { auth: true });
  },
  
  /**
   * 取消关注用户
   * @param {Number} userId 被取消关注的用户ID
   * @returns {Promise}
   */
  unfollow: function(userId) {
    return http.delete(`/user/${userId}/follow`, {}, { auth: true });
  },
  
  /**
   * 检查是否已关注用户
   * @param {Number} userId 用户ID
   * @returns {Promise}
   */
  checkFollowing: function(userId) {
    return http.get(`/user/${userId}/follow/check`, {}, { auth: true });
  },
  
  /**
   * 批量检查是否已关注
   * @param {Array} userIds 用户ID数组
   * @returns {Promise}
   */
  batchCheckFollowing: function(userIds) {
    return http.post('/user/follow/batch-check', userIds, { auth: true });
  },
  
  /**
   * 获取我的关注列表
   * @param {Object} params 分页参数
   * @returns {Promise}
   */
  getFollowing: function(params) {
    return http.get('/user/following', params, { auth: true });
  },
  
  /**
   * 获取我的粉丝列表
   * @param {Object} params 分页参数
   * @returns {Promise}
   */
  getFollowers: function(params) {
    return http.get('/user/followers', params, { auth: true });
  },
  
  /**
   * 获取指定用户的关注列表
   * @param {Number} userId 用户ID
   * @param {Object} params 分页参数
   * @returns {Promise}
   */
  getUserFollowing: function(userId, params) {
    return http.get(`/user/${userId}/following`, params, { auth: true });
  },
  
  /**
   * 获取指定用户的粉丝列表
   * @param {Number} userId 用户ID
   * @param {Object} params 分页参数
   * @returns {Promise}
   */
  getUserFollowers: function(userId, params) {
    return http.get(`/user/${userId}/followers`, params, { auth: true });
  }
};

// ============================================
// 首页/数据大盘相关接口
// ============================================
const dashboard = {
  /**
   * 获取首页数据大盘
   * @param {Object} params 查询参数
   * @param {Number} params.dataType 数据类型 1日报 2周报 3月报
   * @param {Number} params.year 年份
   * @param {Number} params.week 周数(周报时使用)
   * @param {Number} params.month 月份(月报时使用)
   * @returns {Promise}
   */
  getData: function(params) {
    return http.get('/dashboard', params, { auth: true });
  },
  
  /**
   * 获取热门品类列表
   * @param {Object} params 查询参数
   * @param {Number} params.dataType 数据类型
   * @param {Number} params.year 年份
   * @param {Number} params.week 周数
   * @param {Number} params.limit 返回数量
   * @returns {Promise}
   */
  getHotCategories: function(params) {
    return http.get('/dashboard/hot-categories', params, { auth: true });
  },
  
  /**
   * 获取操作建议
   * @param {Object} params 查询参数
   * @param {Number} params.dataType 数据类型
   * @param {Number} params.year 年份
   * @param {Number} params.week 周数
   * @returns {Promise}
   */
  getSuggestions: function(params) {
    return http.get('/dashboard/suggestions', params, { auth: true });
  }
};

// ============================================
// 分类相关接口
// ============================================
const category = {
  /**
   * 获取分类树
   * @returns {Promise}
   */
  getTree: function() {
    return http.get('/categories/tree', {}, { auth: true });
  },
  
  /**
   * 获取一级分类列表
   * @returns {Promise}
   */
  getTopLevel: function() {
    return http.get('/categories', { level: 1 }, { auth: true });
  }
};

// ============================================
// 文章相关接口
// ============================================
const article = {
  /**
   * 获取文章列表
   * @param {Object} params 查询参数
   * @param {Number} params.articleType 文章类型 1行业案例 2行业趋势 3爆款打法
   * @param {Number} params.categoryId 分类ID
   * @param {String} params.keyword 搜索关键词
   * @param {Number} params.pageNum 页码
   * @param {Number} params.pageSize 每页数量
   * @returns {Promise}
   */
  getList: function(params) {
    return http.get('/articles/list', params, { auth: true });
  },
  
  /**
   * 获取文章详情
   * @param {Number} id 文章ID
   * @returns {Promise}
   */
  getDetail: function(id) {
    return http.get(`/articles/detail/${id}`, {}, { auth: true });
  },
  
  /**
   * 获取推荐文章列表
   * @param {Number} limit 数量限制
   * @returns {Promise}
   */
  getRecommended: function(limit = 5) {
    // 后端提供的是 /articles/home?articleType= & limit=
    return http.get('/articles/home', { limit }, { auth: true });
  }
};

// ============================================
// 话题相关接口
// ============================================
const topic = {
  /**
   * 获取话题列表
   * @param {Object} params 查询参数
   * @param {String} params.keyword 搜索关键词
   * @param {String} params.sortBy 排序方式 latest/hot
   * @param {Number} params.pageNum 页码
   * @param {Number} params.pageSize 每页数量
   * @returns {Promise}
   */
  getList: function(params, options) {
    return http.get('/topics/list', params, { auth: true, ...options });
  },
  
  /**
   * 获取话题详情
   * @param {Number} id 话题ID
   * @returns {Promise}
   */
  getDetail: function(id) {
    return http.get(`/topics/detail/${id}`, {}, { auth: true });
  },
  
  /**
   * 发布话题
   * @param {Object} data 话题数据
   * @param {String} data.title 标题
   * @param {String} data.content 内容
   * @param {Array} data.images 图片列表
   * @param {Array} data.tags 标签列表
   * @returns {Promise}
   */
  create: function(data) {
    return http.post('/topics', data);
  },
  
  /**
   * 获取我的话题列表
   * @param {Object} params 分页参数
   * @returns {Promise}
   */
  getMine: function(params, options) {
    return http.get('/topics/mine', params, { ...options });
  },
  
  /**
   * 获取热门话题标签
   * @param {Object} params 查询参数
   * @param {String} params.keyword 搜索关键词（可选）
   * @param {Number} params.limit 返回数量限制（可选，默认20）
   * @returns {Promise}
   */
  getTags: function(params) {
    return http.get('/topics/tags', params, { auth: true });
  },
  
  /**
   * 删除话题
   * @param {Number} id 话题ID
   * @returns {Promise}
   */
  delete: function(id) {
    return http.delete(`/topics/${id}`, {}, { auth: true });
  }
};

// ============================================
// 评论相关接口
// ============================================
const comment = {
  /**
   * 获取评论列表
   * @param {Object} params 查询参数
   * @param {Number} params.bizType 业务类型 1文章 2话题
   * @param {Number} params.bizId 业务ID
   * @param {Number} params.pageNum 页码
   * @param {Number} params.pageSize 每页数量
   * @param {Number} params.childrenLimit 每个评论显示的子评论数量(可选，默认3)
   * @param {Object} options 额外请求配置(可选)，如 { showLoading: false }
   * @returns {Promise}
   */
  getList: function(params, options) {
    return http.get('/comments/list', params, { auth: true, ...options });
  },
  
  /**
   * 获取子评论列表
   * @param {Object} params 查询参数
   * @param {Number} params.parentId 父评论ID（一级评论ID）
   * @param {Number} params.pageNum 页码
   * @param {Number} params.pageSize 每页数量
   * @returns {Promise}
   */
  getChildren: function(params) {
    return http.get('/comments/children', params, { auth: true });
  },
  
  /**
   * 发表评论
   * @param {Object} data 评论数据
   * @param {Number} data.bizType 业务类型
   * @param {Number} data.bizId 业务ID
   * @param {String} data.content 评论内容
   * @param {Number} data.parentId 父评论ID(可选)
   * @param {Number} data.replyUserId 被回复用户ID(可选)
   * @returns {Promise}
   */
  create: function(data) {
    return http.post('/comments', data);
  },
  
  /**
   * 删除评论
   * @param {Number} id 评论ID
   * @returns {Promise}
   */
  delete: function(id) {
    return http.delete(`/comments/${id}`);
  }
};

// ============================================
// 点赞相关接口（按业务类型分离）
// ============================================
const like = {
  // ============================================
  // 文章点赞接口
  // ============================================
  /**
   * 点赞文章
   * @param {Number} articleId 文章ID
   * @returns {Promise}
   */
  likeArticle: function(articleId) {
    return http.post(`/articles/${articleId}/like`);
  },
  
  /**
   * 取消点赞文章
   * @param {Number} articleId 文章ID
   * @returns {Promise}
   */
  unlikeArticle: function(articleId) {
    return http.delete(`/articles/${articleId}/like`);
  },
  
  /**
   * 检查是否已点赞文章
   * @param {Number} articleId 文章ID
   * @returns {Promise}
   */
  checkArticleLiked: function(articleId) {
    return http.get(`/articles/${articleId}/like/check`);
  },
  
  /**
   * 批量检查是否已点赞文章
   * @param {Array} articleIds 文章ID数组
   * @returns {Promise}
   */
  batchCheckArticleLiked: function(articleIds) {
    return http.post('/articles/like/batch-check', articleIds);
  },
  
  // ============================================
  // 话题点赞接口
  // ============================================
  /**
   * 点赞话题
   * @param {Number} topicId 话题ID
   * @returns {Promise}
   */
  likeTopic: function(topicId) {
    return http.post(`/topics/${topicId}/like`);
  },
  
  /**
   * 取消点赞话题
   * @param {Number} topicId 话题ID
   * @returns {Promise}
   */
  unlikeTopic: function(topicId) {
    return http.delete(`/topics/${topicId}/like`);
  },
  
  /**
   * 检查是否已点赞话题
   * @param {Number} topicId 话题ID
   * @returns {Promise}
   */
  checkTopicLiked: function(topicId) {
    return http.get(`/topics/${topicId}/like/check`);
  },
  
  /**
   * 批量检查是否已点赞话题
   * @param {Array} topicIds 话题ID数组
   * @returns {Promise}
   */
  batchCheckTopicLiked: function(topicIds) {
    return http.post('/topics/like/batch-check', topicIds);
  },
  
  // ============================================
  // 评论点赞接口
  // ============================================
  /**
   * 点赞评论
   * @param {Number} commentId 评论ID
   * @returns {Promise}
   */
  likeComment: function(commentId) {
    return http.post(`/comments/${commentId}/like`);
  },
  
  /**
   * 取消点赞评论
   * @param {Number} commentId 评论ID
   * @returns {Promise}
   */
  unlikeComment: function(commentId) {
    return http.delete(`/comments/${commentId}/like`);
  },
  
  /**
   * 检查是否已点赞评论
   * @param {Number} commentId 评论ID
   * @returns {Promise}
   */
  checkCommentLiked: function(commentId) {
    return http.get(`/comments/${commentId}/like/check`);
  },
  
  /**
   * 批量检查是否已点赞评论
   * @param {Array} commentIds 评论ID数组
   * @returns {Promise}
   */
  batchCheckCommentLiked: function(commentIds) {
    return http.post('/comments/like/batch-check', commentIds);
  }
};

// ============================================
// 会员相关接口
// ============================================
const member = {
  /**
   * 获取会员套餐列表
   * @returns {Promise}
   */
  getPackages: function() {
    return http.get('/member/packages');
  },
  
  /**
   * 创建会员订单
   * @param {Object} data 订单数据
   * @param {Number} data.packageId 套餐ID
   * @returns {Promise}
   */
  createOrder: function(data) {
    return http.post('/member/orders', data);
  },
  
  /**
   * 获取我的订单列表
   * @param {Object} params 分页参数
   * @returns {Promise}
   */
  getMyOrders: function(params) {
    return http.get('/member/orders/mine', params);
  }
};

// ============================================
// 上传相关接口
// ============================================
const upload = {
  /**
   * 上传图片
   * @param {String} filePath 文件临时路径
   * @returns {Promise}
   */
  image: function(filePath) {
    return http.uploadFile(filePath);
  }
};

// 导出所有API模块
module.exports = {
  auth,
  user,
  dashboard,
  category,
  article,
  topic,
  comment,
  like,
  member,
  upload,
  
  // 快捷方法
  wxLogin: auth.wxLogin,
  getUserInfo: user.getInfo,
  getArticleList: article.getList,
  getArticleDetail: article.getDetail,
  getTopicList: topic.getList,
  getTopicDetail: topic.getDetail,
  getDashboard: dashboard.getData
};
