/**
 * 极光密码小程序入口文件
 * 
 * 功能说明：
 * 1. 全局配置和初始化
 * 2. 用户登录态管理
 * 3. 全局数据存储
 */

// 引入配置文件
const config = require('./config/index');

App({
  /**
   * 全局数据
   */
  globalData: {
    // 用户信息
    userInfo: null,
    // 登录凭证
    accessToken: null,
    // 刷新凭证
    refreshToken: null,
    // 是否登录
    isLoggedIn: false,
    // 是否会员
    isMember: false,
    // 会员等级
    memberLevel: 0,
    // 会员过期时间
    memberExpireTime: null,
    // 系统信息
    systemInfo: null,
    // 网络状态
    networkType: 'unknown',
    // API基础路径
    baseUrl: config.API_BASE_URL,
    // 云托管相关
    cloud: null
  },

  /**
   * 封装的微信云托管调用方法
   * @param {*} obj 业务请求信息
   * @param {*} number 请求等待次数，默认不用传，用于初始化等待
   */
  async call(obj, number = 0) {
    const that = this;
    if (that.globalData.cloud == null) {
      // 初始化云托管环境
      const cloud = new wx.cloud.Cloud({
        resourceEnv: config.WX_CLOUD_ENV_ID, // 微信云托管的环境ID
      });
      that.globalData.cloud = cloud;
      await that.globalData.cloud.init(); // init过程是异步的，需要等待init完成才可以发起调用
    }
    try {
      // 构建header，合并默认header和传入的header
      const defaultHeader = {
        'X-WX-SERVICE': config.WX_CLOUD_SERVICE_NAME // 服务名称
      };
      const mergedHeader = Object.assign({}, defaultHeader, obj.header || {});
      
      const result = await that.globalData.cloud.callContainer({
        path: obj.path, // 填入业务自定义路径和参数，根目录，就是 /
        method: obj.method || 'GET', // 按照自己的业务开发，选择对应的方法
        data: obj.data || {},
        header: mergedHeader
        // 其余参数同 wx.request
      });
      console.log(`微信云托管调用结果${result.errMsg} | callid:${result.callID}`);
      return result.data; // 业务数据在data中
    } catch (e) {
      const error = e.toString();
      // 如果错误信息为未初始化，则等待300ms再次尝试，因为init过程是异步的
      if (error.indexOf("Cloud API isn't enabled") != -1 && number < 3) {
        return new Promise((resolve) => {
          setTimeout(function () {
            resolve(that.call(obj, number + 1));
          }, 300);
        });
      } else {
        throw new Error(`微信云托管调用失败${error}`);
      }
    }
  },

  /**
   * 小程序启动时执行
   */
  onLaunch: function() {
    console.log('[App] 小程序启动');
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 监听网络状态
    this.watchNetworkStatus();
    
    // 检查登录态
    this.checkLoginStatus();
    
    // 检查更新
    this.checkUpdate();
    
    // 初始化云环境（如果配置了云托管）
    if (config.USE_WX_CLOUD) {
      wx.cloud.init();
    }
  },

  /**
   * 获取系统信息（使用新API替代已废弃的 getSystemInfoSync）
   */
  getSystemInfo: function() {
    try {
      // 使用新的 API 组合替代已废弃的 getSystemInfoSync
      const deviceInfo = wx.getDeviceInfo();
      const windowInfo = wx.getWindowInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
      // 组合成兼容格式的系统信息对象
      const systemInfo = {
        // 设备信息
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        system: deviceInfo.system,
        platform: deviceInfo.platform,
        // 窗口信息
        windowWidth: windowInfo.windowWidth,
        windowHeight: windowInfo.windowHeight,
        screenWidth: windowInfo.screenWidth,
        screenHeight: windowInfo.screenHeight,
        statusBarHeight: windowInfo.statusBarHeight,
        safeArea: windowInfo.safeArea,
        pixelRatio: windowInfo.pixelRatio,
        // 基础信息
        SDKVersion: appBaseInfo.SDKVersion,
        version: appBaseInfo.version,
        language: appBaseInfo.language,
        theme: appBaseInfo.theme
      };
      
      this.globalData.systemInfo = systemInfo;
      console.log('[App] 系统信息:', systemInfo);
    } catch (e) {
      console.error('[App] 获取系统信息失败:', e);
      // 降级方案：使用旧API
      try {
        const systemInfo = wx.getSystemInfoSync();
        this.globalData.systemInfo = systemInfo;
      } catch (err) {
        console.error('[App] 降级获取系统信息也失败:', err);
      }
    }
  },

  /**
   * 监听网络状态变化
   */
  watchNetworkStatus: function() {
    const that = this;
    
    // 获取当前网络状态
    wx.getNetworkType({
      success: function(res) {
        that.globalData.networkType = res.networkType;
        console.log('[App] 当前网络状态:', res.networkType);
      }
    });
    
    // 监听网络状态变化
    wx.onNetworkStatusChange(function(res) {
      that.globalData.networkType = res.networkType;
      console.log('[App] 网络状态变化:', res.networkType, res.isConnected);
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络连接已断开',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 检查登录状态
   * 从本地存储读取token并验证有效性
   */
  checkLoginStatus: function() {
    const that = this;
    
    try {
      // 从本地存储读取登录信息
      const accessToken = wx.getStorageSync('accessToken');
      const refreshToken = wx.getStorageSync('refreshToken');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (accessToken && userInfo) {
        // 更新全局数据
        that.globalData.accessToken = accessToken;
        that.globalData.refreshToken = refreshToken;
        that.globalData.userInfo = userInfo;
        that.globalData.isLoggedIn = true;
        that.globalData.isMember = userInfo.isMember === 1;
        that.globalData.memberLevel = userInfo.memberLevel || 0;
        that.globalData.memberExpireTime = userInfo.memberExpireTime;
        
        console.log('[App] 已登录用户:', userInfo.nickname);
        
        // 静默刷新用户信息
        that.refreshUserInfo();
      } else {
        console.log('[App] 用户未登录');
        that.globalData.isLoggedIn = false;
      }
    } catch (e) {
      console.error('[App] 检查登录状态失败:', e);
      that.globalData.isLoggedIn = false;
    }
  },

  /**
   * 刷新用户信息
   * 登录后静默刷新用户最新信息
   * @param {Function} callback 刷新完成后的回调函数
   */
  refreshUserInfo: function(callback) {
    const that = this;
    const api = require('./services/api');
    
    api.getUserInfo().then(res => {
      if (res.code === 200) {
        const userInfo = res.data;
        that.globalData.userInfo = userInfo;
        that.globalData.isMember = userInfo.isMember === 1;
        that.globalData.memberLevel = userInfo.memberLevel || 0;
        that.globalData.memberExpireTime = userInfo.memberExpireTime;
        
        // 更新本地存储
        wx.setStorageSync('userInfo', userInfo);
        console.log('[App] 用户信息已刷新');
        
        // 执行回调
        if (typeof callback === 'function') {
          callback(null, userInfo);
        }
      }
    }).catch(err => {
      console.error('[App] 刷新用户信息失败:', err);
      
      // 执行回调传递错误
      if (typeof callback === 'function') {
        callback(err, null);
      }
    });
  },

  /**
   * 检查小程序更新
   */
  checkUpdate: function() {
    if (!wx.canIUse('getUpdateManager')) {
      return;
    }
    
    const updateManager = wx.getUpdateManager();
    
    updateManager.onCheckForUpdate(function(res) {
      console.log('[App] 检查更新结果:', res.hasUpdate);
    });
    
    updateManager.onUpdateReady(function() {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });
    
    updateManager.onUpdateFailed(function() {
      console.log('[App] 更新失败');
    });
  },

  /**
   * 用户登录
   * @param {Object} loginData 登录返回数据
   */
  login: function(loginData) {
    this.globalData.accessToken = loginData.accessToken;
    this.globalData.refreshToken = loginData.refreshToken;
    this.globalData.userInfo = loginData.userInfo;
    this.globalData.isLoggedIn = true;
    this.globalData.isMember = loginData.userInfo.isMember === 1;
    this.globalData.memberLevel = loginData.userInfo.memberLevel || 0;
    this.globalData.memberExpireTime = loginData.userInfo.memberExpireTime;
    
    // 保存到本地存储
    wx.setStorageSync('accessToken', loginData.accessToken);
    wx.setStorageSync('refreshToken', loginData.refreshToken);
    wx.setStorageSync('userInfo', loginData.userInfo);
    
    console.log('[App] 用户登录成功:', loginData.userInfo.nickname);
  },

  /**
   * 用户登出
   */
  logout: function() {
    // 清除全局数据
    this.globalData.accessToken = null;
    this.globalData.refreshToken = null;
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.isMember = false;
    this.globalData.memberLevel = 0;
    this.globalData.memberExpireTime = null;
    
    // 清除本地存储
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userInfo');
    
    console.log('[App] 用户已登出');
  },

  /**
   * 检查是否登录，未登录则跳转登录页
   * @returns {Boolean} 是否已登录
   */
  checkLogin: function(options = {}) {
    if (this.globalData.isLoggedIn) return true;

    let redirectUrl = options.redirectUrl;

    if (!redirectUrl) {
      try {
        const pages = getCurrentPages();
        const currentPage = pages && pages.length ? pages[pages.length - 1] : null;
        if (currentPage && currentPage.route) {
          const routePath = currentPage.route.startsWith('/') ? currentPage.route : `/${currentPage.route}`;
          const pageOptions = currentPage.options || {};
          const query = Object.keys(pageOptions)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(pageOptions[key])}`)
            .join('&');
          redirectUrl = query ? `${routePath}?${query}` : routePath;
        }
      } catch (e) {
        // ignore
      }
    }

    const redirectParam = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
    wx.navigateTo({
      url: `/pages/login/login${redirectParam}`
    });
    return false;
  },

  /**
   * 检查是否会员，非会员则提示
   * @returns {Boolean} 是否是会员
   */
  checkMember: function() {
    if (!this.globalData.isMember) {
      wx.showModal({
        title: '会员专属',
        content: '该内容仅会员可查看完整版，是否开通会员？',
        confirmText: '立即开通',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/member/member'
            });
          }
        }
      });
      return false;
    }
    return true;
  }
});