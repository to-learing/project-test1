/**
 * HTTP请求封装模块
 * 
 * 功能说明：
 * 1. 统一封装wx.request，提供Promise风格API
 * 2. 自动携带Token认证
 * 3. 请求/响应拦截处理
 * 4. Token过期自动刷新
 * 5. 统一错误处理
 * 6. 支持微信云托管调用
 */

const config = require('../config/index');
const statusCodes = require('./statusCodes');

// 请求队列（用于Token刷新时暂存请求）
let requestQueue = [];
// 是否正在刷新Token
let isRefreshing = false;

/**
 * 获取存储的Token
 * @returns {String} Token字符串
 */
function getToken() {
  try {
    return wx.getStorageSync(config.TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * 获取刷新Token
 * @returns {String} RefreshToken字符串
 */
function getRefreshToken() {
  try {
    return wx.getStorageSync(config.REFRESH_TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * 保存Token
 * @param {String} accessToken AccessToken
 * @param {String} refreshToken RefreshToken
 */
function saveToken(accessToken, refreshToken) {
  wx.setStorageSync(config.TOKEN_KEY, accessToken);
  if (refreshToken) {
    wx.setStorageSync(config.REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * 清除Token
 */
function clearToken() {
  wx.removeStorageSync(config.TOKEN_KEY);
  wx.removeStorageSync(config.REFRESH_TOKEN_KEY);
}

/**
 * 使用微信云托管方式发起请求
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function cloudRequest(options) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    if (!app) {
      reject(new Error('无法获取App实例'));
      return;
    }
    
    // 构建云托管请求路径
    let cloudPath = options.url;
    
    // 如果是完整URL，先去掉baseUrl
    if (cloudPath.startsWith('http')) {
      if (cloudPath.startsWith(config.API_BASE_URL)) {
        cloudPath = cloudPath.substring(config.API_BASE_URL.length);
      }
    }
    
    // 确保路径包含API前缀
    if (!cloudPath.startsWith(config.API_PREFIX)) {
      // 如果路径不以/api开头，需要添加前缀
      if (cloudPath.startsWith('/')) {
        cloudPath = config.API_PREFIX + cloudPath;
      } else {
        cloudPath = config.API_PREFIX + '/' + cloudPath;
      }
    }
    
    // 打印调试信息
    if (config.ENABLE_LOG) {
      console.log('[Cloud Request Path]', 'Original:', options.url, 'Processed:', cloudPath);
    }
    
    // 构建请求数据
    const requestData = {
      path: cloudPath,
      method: options.method || 'GET',
      data: options.data || {}
    };
    
    // 添加Token到header（如果需要认证）
    if (options.auth !== false) {
      const accessToken = getToken();
      if (accessToken) {
        requestData.header = {
          'Authorization': `Bearer ${accessToken}`
        };
      }
    }
    
    // 显示加载提示
    if (options.showLoading !== false) {
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      });
    }
    
    // 打印日志
    if (config.ENABLE_LOG) {
      console.log('[Cloud Request]', requestData.method, requestData.path, requestData.data, '是否携带Token: ' + (options.auth !== false));
    }
    
    // 调用云托管服务
    app.call(requestData)
      .then(res => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading();
        }
        
        // 打印日志
        if (config.ENABLE_LOG) {
          console.log('[Cloud Response]', res);
        }
        
        // 处理响应
        if (res && typeof res === 'object') {
          // 业务状态码处理
          if (res.code === statusCodes.BUSINESS_STATUS.SUCCESS) {
            resolve(res);
          } else if (res.code === statusCodes.BUSINESS_STATUS.TOKEN_EXPIRED || res.code === statusCodes.BUSINESS_STATUS.TOKEN_INVALID) {
            // Token过期或无效，尝试刷新（仅认证请求）
            if (options.auth !== false) {
              handleUnauthorized(options).then(resolve).catch(reject);
            } else {
              resolve(res);
            }
          } else {
            // 业务错误
            if (options.showError !== false) {
              wx.showToast({
                title: res.message || '请求失败',
                icon: 'none',
                duration: 2000
              });
            }
            reject(res);
          }
        } else {
          // 非标准响应格式
          resolve({ code: statusCodes.BUSINESS_STATUS.SUCCESS, data: res, message: 'success' });
        }
      })
      .catch(err => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading();
        }
        
        // 打印日志
        if (config.ENABLE_LOG) {
          console.error('[Cloud Request Error]', err);
        }
        
        // 错误处理
        let errorMsg = '网络请求失败';
        if (err.message) {
          errorMsg = err.message;
        }
        
        if (options.showError !== false) {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
        
        reject({ code: -1, message: errorMsg });
      });
  });
}

/**
 * 刷新Token（支持云托管和传统HTTP两种方式）
 * @returns {Promise}
 */
function refreshToken() {
  return new Promise((resolve, reject) => {
    const refreshTokenValue = getRefreshToken();
    
    if (!refreshTokenValue) {
      resolve(null);
      return;
    }
    
    if (config.USE_WX_CLOUD) {
      // 使用云托管方式刷新Token
      const app = getApp();
      if (!app) {
        reject(new Error('无法获取App实例'));
        return;
      }
      
      const requestData = {
        path: '/auth/refresh-token',
        method: 'POST',
        data: {
          refreshToken: refreshTokenValue
        },
        auth: false
      };
      
      app.call(requestData)
        .then(res => {
          if (res.code === statusCodes.BUSINESS_STATUS.SUCCESS) {
            const { accessToken, refreshToken: newRefreshToken } = res.data;
            saveToken(accessToken, newRefreshToken);
            
            // 更新App全局数据
            const app = getApp();
            if (app) {
              app.globalData.accessToken = accessToken;
              app.globalData.refreshToken = newRefreshToken;
            }
            
            resolve(accessToken);
          } else {
            reject(new Error('Refresh token failed'));
          }
        })
        .catch(err => {
          reject(err);
        });
    } else {
      // 使用传统HTTP方式刷新Token
      wx.request({
        url: `${config.API_BASE_URL}${config.API_PREFIX}/auth/refresh-token`,
        method: 'POST',
        data: {
          refreshToken: refreshTokenValue
        },
        success: function(res) {
          if (res.statusCode === statusCodes.HTTP_STATUS.SUCCESS && res.data.code === statusCodes.BUSINESS_STATUS.SUCCESS) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            saveToken(accessToken, newRefreshToken);
            
            // 更新App全局数据
            const app = getApp();
            if (app) {
              app.globalData.accessToken = accessToken;
              app.globalData.refreshToken = newRefreshToken;
            }
            
            resolve(accessToken);
          } else {
            reject(new Error('Refresh token failed'));
          }
        },
        fail: function(err) {
          reject(err);
        }
      });
    }
  });
}

/**
 * 处理Token刷新后的请求队列
 * @param {String} newToken 新Token
 */
function processRequestQueue(newToken) {
  requestQueue.forEach(callback => {
    callback(newToken);
  });
  requestQueue = [];
}

/**
 * 处理未授权错误（Token过期）
 * @param {Object} requestConfig 请求配置
 * @returns {Promise}
 */
function handleUnauthorized(requestConfig) {
  return new Promise((resolve, reject) => {
    if (!requestConfig.auth) {
      reject({ code: statusCodes.HTTP_STATUS.UNAUTHORIZED, message: '未登录' });
      return;
    }

    // 如果正在刷新Token，将请求加入队列等待
    if (isRefreshing) {
      requestQueue.push((newToken) => {
        requestConfig.header = requestConfig.header || {};
        requestConfig.header['Authorization'] = `Bearer ${newToken}`;
        request(requestConfig).then(resolve).catch(reject);
      });
      return;
    }
    
    isRefreshing = true;
    
    refreshToken()
      .then((newToken) => {
        isRefreshing = false;

        if (!newToken) {
          clearToken();
          reject({ code: statusCodes.HTTP_STATUS.UNAUTHORIZED, message: '未登录' });
          return;
        }

        // 处理等待队列
        processRequestQueue(newToken);
        // 重新发起原请求
        requestConfig.header = requestConfig.header || {};
        requestConfig.header['Authorization'] = `Bearer ${newToken}`;
        request(requestConfig).then(resolve).catch(reject);
      })
      .catch((err) => {
        isRefreshing = false;
        requestQueue = [];
        
        // 刷新失败，清除登录态
        clearToken();
        const app = getApp();
        if (app) {
          app.logout();
        }
        
        // 跳转登录页
        wx.navigateTo({
          url: '/pages/login/login'
        });
        
        reject(err);
      });
  });
}

/**
 * 统一请求方法
 * @param {Object} options 请求配置
 * @param {String} options.url 请求路径（不含baseUrl）
 * @param {String} options.method 请求方法
 * @param {Object} options.data 请求数据
 * @param {Object} options.header 请求头
 * @param {Boolean} options.showLoading 是否显示加载提示
 * @param {String} options.loadingText 加载提示文字
 * @param {Boolean} options.showError 是否显示错误提示
 * @param {Boolean} options.auth 是否需要认证
 * @returns {Promise}
 */
function request(options) {
  // 根据配置选择请求方式
  if (config.USE_WX_CLOUD) {
    return cloudRequest(options);
  }
  
  return new Promise((resolve, reject) => {
    // 默认配置
    const defaultOptions = {
      method: 'GET',
      showLoading: true,
      loadingText: '加载中...',
      showError: true,
      auth: true
    };
    
    // 合并配置
    const config_ = Object.assign({}, defaultOptions, options);
    
    // 构建完整URL
    const fullUrl = config_.url.startsWith('http') 
      ? config_.url 
      : `${config.API_BASE_URL}${config.API_PREFIX}${config_.url}`;
    
    // 构建请求头
    const header = {
      'Content-Type': 'application/json',
      ...config_.header
    };
    
    // 添加Token
    if (config_.auth) {
      const accessToken = getToken();
      if (accessToken) {
        header['Authorization'] = `Bearer ${accessToken}`;
      }
    }
    
    // 显示加载提示
    if (config_.showLoading) {
      wx.showLoading({
        title: config_.loadingText,
        mask: true
      });
    }
    
    // 打印日志
    if (config.ENABLE_LOG) {
      console.log('[Request]', config_.method, fullUrl, config_.data, '是否携带Token: ' + config_.auth);
    }
    
    // 发起请求
    wx.request({
      url: fullUrl,
      method: config_.method,
      data: config_.data,
      header: header,
      timeout: config.REQUEST_TIMEOUT,
      success: function(res) {
        // 隐藏加载提示
        if (config_.showLoading) {
          wx.hideLoading();
        }
        
        // 打印日志
        if (config.ENABLE_LOG) {
          console.log('[Response]', res.statusCode, res.data);
        }
        console.log("到达这里");
        // HTTP状态码处理
        if (res.statusCode === statusCodes.HTTP_STATUS.SUCCESS) {
          // 业务状态码处理
          const data = res.data;
          console.log("到达这里1");
          if (data.code === statusCodes.BUSINESS_STATUS.SUCCESS) {
            console.log("到达这里2");
            resolve(data);
          } else if (data.code === statusCodes.BUSINESS_STATUS.TOKEN_EXPIRED || data.code === statusCodes.BUSINESS_STATUS.TOKEN_INVALID) {
            // Token过期或无效，尝试刷新（仅认证请求）
            console.log('[Request] Token过期，尝试刷新...', config_.auth);
            if (config_.auth) {
              handleUnauthorized(options).then(resolve).catch(reject);
            } else {
              resolve(data);
            }
          } else {
            // 业务错误
            if (config_.showError) {
              wx.showToast({
                title: data.message || '请求失败',
                icon: 'none',
                duration: 2000
              });
            }
            reject(data);
          }
        } else if (res.statusCode === statusCodes.HTTP_STATUS.UNAUTHORIZED) {
          // 未授权
          if (config_.auth) {
            handleUnauthorized(options).then(resolve).catch(reject);
          } else {
            resolve({ code: statusCodes.HTTP_STATUS.UNAUTHORIZED, message: '未登录' });
          }
        } else {
          // 其他HTTP错误
          const errorMsg = getHttpErrorMessage(res.statusCode);
          if (config_.showError) {
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            });
          }
          reject({ code: res.statusCode, message: errorMsg });
        }
      },
      fail: function(err) {
        // 隐藏加载提示
        if (config_.showLoading) {
          wx.hideLoading();
        }
        
        // 打印日志
        if (config.ENABLE_LOG) {
          console.error('[Request Error]', err);
        }
        
        // 网络错误处理
        let errorMsg = '网络请求失败';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请重试';
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '网络连接失败';
          }
        }
        
        if (config_.showError) {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
        
        reject({ code: -1, message: errorMsg });
      }
    });
  });
}

/**
 * 获取HTTP错误信息
 * @param {Number} statusCode HTTP状态码
 * @returns {String} 错误信息
 */
function getHttpErrorMessage(statusCode) {
  return statusCodes.getHttpErrorMessage(statusCode);
}

/**
 * GET请求
 * @param {String} url 请求路径
 * @param {Object} params 查询参数
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function get(url, params = {}, options = {}) {
  return request({
    url: url,
    method: 'GET',
    data: params,
    ...options
  });
}

/**
 * POST请求
 * @param {String} url 请求路径
 * @param {Object} data 请求体数据
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function post(url, data = {}, options = {}) {
  return request({
    url: url,
    method: 'POST',
    data: data,
    ...options
  });
}

/**
 * PUT请求
 * @param {String} url 请求路径
 * @param {Object} data 请求体数据
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function put(url, data = {}, options = {}) {
  return request({
    url: url,
    method: 'PUT',
    data: data,
    ...options
  });
}

/**
 * DELETE请求
 * @param {String} url 请求路径
 * @param {Object} params 查询参数
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function del(url, params = {}, options = {}) {
  return request({
    url: url,
    method: 'DELETE',
    data: params,
    ...options
  });
}

/**
 * 上传文件
 * @param {String} filePath 文件临时路径
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function uploadFile(filePath, options = {}) {
  // 如果启用了云存储，优先使用云存储上传
  if (config.USE_WX_CLOUD_STORAGE) {
    return uploadFileToCloudStorage(filePath, options);
  }
  
  // 否则使用传统HTTP方式上传
  return uploadFileByHttp(filePath, options);
}

/**
 * 使用云存储上传文件
 * @param {String} filePath 文件临时路径
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function uploadFileToCloudStorage(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    if (!app) {
      reject(new Error('无法获取App实例'));
      return;
    }
    
    wx.showLoading({
      title: options.loadingText || '上传中...',
      mask: true
    });
    
    // 调用App中的云存储上传方法
    app.uploadToCloudStorage(filePath, options.cloudPath)
      .then(uploadResult => {
        // 上传成功后获取临时访问URL
        return app.getCloudStorageTempUrl(uploadResult.fileID)
          .then(tempUrl => {
            wx.hideLoading();
            console.log('[Upload] 云存储上传成功:', uploadResult.fileID, tempUrl);
            resolve({
              code: statusCodes.BUSINESS_STATUS.SUCCESS,
              data: tempUrl,
              fileID: uploadResult.fileID,
              message: '上传成功'
            });
          });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('[Upload] 云存储上传失败:', err);
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        reject({
          code: -1,
          message: err.errMsg || '云存储上传失败',
          error: err
        });
      });
  });
}

/**
 * 使用传统HTTP方式上传文件
 * @param {String} filePath 文件临时路径
 * @param {Object} options 其他配置
 * @returns {Promise}
 */
function uploadFileByHttp(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const accessToken = getToken();
    
    wx.showLoading({
      title: options.loadingText || '上传中...',
      mask: true
    });
    
    wx.uploadFile({
      url: config.UPLOAD_URL,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': accessToken ? `Bearer ${accessToken}` : ''
      },
      formData: options.formData || {},
      success: function(res) {
        wx.hideLoading();
        
        if (res.statusCode === statusCodes.HTTP_STATUS.SUCCESS) {
          try {
            const data = JSON.parse(res.data);
            if (data.code === statusCodes.BUSINESS_STATUS.SUCCESS) {
              resolve(data);
            } else {
              wx.showToast({
                title: data.message ||  '上传失败',
                icon: 'none'
              });
              reject(data);
            }
          } catch (e) {
            reject({ code: -1, message: '解析响应数据失败' });
          }
        } else {
          reject({ code: res.statusCode, message: '上传失败' });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

// 导出模块
module.exports = {
  request,
  get,
  post,
  put,
  delete: del,
  uploadFile,
  getToken,
  saveToken,
  clearToken
};