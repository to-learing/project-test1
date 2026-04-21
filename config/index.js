/**
 * 极光密码小程序配置文件
 * 
 * 说明：
 * 1. 统一管理环境配置
 * 2. API接口地址配置
 * 3. 其他全局配置项
 * 
 * 注意：
 * - 正式发布前需要修改为生产环境配置
 * - 敏感信息不要直接写在代码中
 */

// 环境配置枚举
const ENV = {
  DEV: 'development',     // 开发环境
  TEST: 'test',           // 测试环境
  PROD: 'production'      // 生产环境
};

// 当前环境 - 发布前修改此值
const CURRENT_ENV = ENV.DEV;

// 各环境API基础路径配置
const API_BASE_URLS = {
  [ENV.DEV]: 'http://localhost:8080',           // 开发环境
  [ENV.TEST]: 'http://u34f65e9.natappfree.cc', // 测试环境
  [ENV.PROD]: 'https://api.dewu-info.com'       // 生产环境
};

// 各环境上传文件路径配置
const UPLOAD_URLS = {
  [ENV.DEV]: 'http://localhost:8080/api/upload',
  [ENV.TEST]: 'https://test-api.dewu-info.com/api/upload',
  [ENV.PROD]: 'https://api.dewu-info.com/api/upload'
};

// 是否使用微信云托管（true: 使用云托管，false: 使用传统HTTP请求）
const USE_WX_CLOUD = false;

// 微信云托管环境ID（在微信云托管控制台获取）
const WX_CLOUD_ENV_ID = 'prod-6g8j1pbodc5cc3d7';

// 微信云托管服务名称（在微信云托管-服务管理-服务列表中获取）
const WX_CLOUD_SERVICE_NAME = 'demo';

// 微信云开发云存储配置
const USE_WX_CLOUD_STORAGE = true;
const WX_CLOUD_STORAGE_ENV_ID = 'prod-6g8j1pbodc5cc3d7';
const WX_CLOUD_STORAGE_PATH_PREFIX = 'avatars/';

// 导出配置
module.exports = {
  // 当前环境
  ENV: CURRENT_ENV,
  
  // 是否开发环境
  IS_DEV: CURRENT_ENV === ENV.DEV,
  
  // API基础路径
  API_BASE_URL: API_BASE_URLS[CURRENT_ENV],
  
  // 上传文件路径
  UPLOAD_URL: UPLOAD_URLS[CURRENT_ENV],
  
  // API版本前缀
  API_PREFIX: '/api',
  
  // 请求超时时间(ms)
  REQUEST_TIMEOUT: 30000,
  
  // 分页配置
  PAGE_SIZE: 10,
  
  // Token相关
  TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  
  // 图片相关
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024,  // 最大10MB
    MAX_COUNT: 9,                 // 最多9张
    QUALITY: 80                   // 压缩质量
  },
  
  // 文章类型配置
  ARTICLE_TYPES: {
    CASE: 1,    // 行业案例
    TREND: 2,   // 行业趋势
    HOT: 3      // 爆款打法
  },
  
  // 文章类型名称映射
  ARTICLE_TYPE_NAMES: {
    1: '行业案例',
    2: '行业趋势',
    3: '爆款打法'
  },
  
  // 会员等级配置
  MEMBER_LEVELS: {
    NONE: 0,      // 非会员
    MONTHLY: 1,   // 月度会员
    QUARTERLY: 2, // 季度会员
    YEARLY: 3     // 年度会员
  },
  
  // 会员等级名称映射
  MEMBER_LEVEL_NAMES: {
    0: '普通用户',
    1: '月度会员',
    2: '季度会员',
    3: '年度会员'
  },
  
  // 数据类型配置
  DATA_TYPES: {
    DAILY: 1,   // 日报
    WEEKLY: 2,  // 周报
    MONTHLY: 3  // 月报
  },
  
  // 数据类型名称映射
  DATA_TYPE_NAMES: {
    1: '日报',
    2: '周报',
    3: '月报'
  },
  
  // 趋势类型配置
  TREND_TYPES: {
    SURGE: 1,   // 大涨
    UP: 2,      // 上涨
    FLAT: 3,    // 持平
    DOWN: 4,    // 下跌
    PLUNGE: 5   // 大跌
  },
  
  // 日志开关
  ENABLE_LOG: CURRENT_ENV !== ENV.PROD,
  
  // 微信云托管配置
  USE_WX_CLOUD: USE_WX_CLOUD,
  WX_CLOUD_ENV_ID: WX_CLOUD_ENV_ID,
  WX_CLOUD_SERVICE_NAME: WX_CLOUD_SERVICE_NAME,
  
  // 微信云开发云存储配置
  USE_WX_CLOUD_STORAGE: USE_WX_CLOUD_STORAGE,
  WX_CLOUD_STORAGE_ENV_ID: WX_CLOUD_STORAGE_ENV_ID,
  WX_CLOUD_STORAGE_PATH_PREFIX: WX_CLOUD_STORAGE_PATH_PREFIX
};