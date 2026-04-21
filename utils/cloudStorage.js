/**
 * 微信云开发云存储工具模块
 * 
 * 功能说明：
 * 1. 文件上传到云存储
 * 2. 获取临时访问链接
 * 3. 删除云存储文件
 */

const config = require('../config/index');

/**
 * 上传文件到云存储
 * @param {String} filePath 本地文件路径
 * @param {String} cloudPath 云存储路径（可选，不传则自动生成）
 * @returns {Promise} 返回 { fileID, statusCode }
 */
function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    if (!cloudPath) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = filePath.substring(filePath.lastIndexOf('.'));
      cloudPath = config.WX_CLOUD_STORAGE_PATH_PREFIX + timestamp + '_' + randomStr + extension;
    }
    
    console.log('[Cloud Storage] 上传文件:', filePath, '->', cloudPath);
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: res => {
        console.log('[Cloud Storage] 上传成功:', res.fileID);
        resolve({
          fileID: res.fileID,
          statusCode: res.statusCode
        });
      },
      fail: err => {
        console.error('[Cloud Storage] 上传失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 根据云存储fileID获取临时访问链接
 * @param {String} fileID 云存储文件ID
 * @returns {Promise} 返回临时URL字符串
 */
function getTempFileURL(fileID) {
  return new Promise((resolve, reject) => {
    if (!fileID) {
      reject(new Error('fileID不能为空'));
      return;
    }
    
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        if (res.fileList && res.fileList.length > 0) {
          const tempFileURL = res.fileList[0].tempFileURL;
          console.log('[Cloud Storage] 获取临时链接成功:', tempFileURL);
          resolve(tempFileURL);
        } else {
          reject(new Error('获取临时链接失败'));
        }
      },
      fail: err => {
        console.error('[Cloud Storage] 获取临时链接失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 批量获取临时访问链接
 * @param {Array} fileIDList 文件ID数组
 * @returns {Promise} 返回文件列表 [{ fileID, tempFileURL }]
 */
function getTempFileURLList(fileIDList) {
  return new Promise((resolve, reject) => {
    if (!fileIDList || fileIDList.length === 0) {
      resolve([]);
      return;
    }
    
    wx.cloud.getTempFileURL({
      fileList: fileIDList,
      success: res => {
        console.log('[Cloud Storage] 批量获取临时链接成功:', res.fileList);
        resolve(res.fileList);
      },
      fail: err => {
        console.error('[Cloud Storage] 批量获取临时链接失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 删除云存储文件
 * @param {Array} fileList 要删除的文件ID数组
 * @returns {Promise} 返回删除结果列表
 */
function deleteFile(fileList) {
  return new Promise((resolve, reject) => {
    if (!fileList || fileList.length === 0) {
      resolve([]);
      return;
    }
    
    wx.cloud.deleteFile({
      fileList: fileList,
      success: res => {
        console.log('[Cloud Storage] 删除文件成功:', res.fileList);
        resolve(res.fileList);
      },
      fail: err => {
        console.error('[Cloud Storage] 删除文件失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 上传文件并获取临时链接
 * @param {String} filePath 本地文件路径
 * @param {String} cloudPath 云存储路径（可选）
 * @returns {Promise} 返回 { fileID, tempFileURL, statusCode }
 */
async function uploadAndGetUrl(filePath, cloudPath) {
  const uploadResult = await uploadFile(filePath, cloudPath);
  const tempFileURL = await getTempFileURL(uploadResult.fileID);
  
  return {
    fileID: uploadResult.fileID,
    tempFileURL: tempFileURL,
    statusCode: uploadResult.statusCode
  };
}

/**
 * 检查云环境是否已初始化
 * @returns {Boolean}
 */
function isCloudInited() {
  try {
    wx.cloud;
    return true;
  } catch (e) {
    return false;
  }
}

// 导出所有函数
module.exports = {
  uploadFile,
  getTempFileURL,
  getTempFileURLList,
  deleteFile,
  uploadAndGetUrl,
  isCloudInited
};
