/**
 * 文件哈希计算工具模块
 * 使用微信小程序官方接口 getFileInfo 计算 MD5
 * 
 * 功能说明：
 * 1. 获取文件信息并计算 MD5 哈希值
 * 2. 支持获取文件大小等信息
 */

const config = require('../config/index');

/**
 * 获取文件信息（包含 MD5 哈希值）
 * 使用微信官方 FileSystemManager.getFileInfo 接口
 * 
 * @param {String} filePath 本地文件路径
 * @returns {Promise<Object>} 返回 { size, digest, success }
 *   - size: 文件大小（字节）
 *   - digest: MD5 哈希值（官方计算）
 *   - success: 是否成功
 */
function getFileInfoWithHash(filePath) {
  return new Promise((resolve) => {
    const fileSystemManager = wx.getFileSystemManager();
    
    if (!fileSystemManager) {
      resolve({
        success: false,
        error: '无法获取文件系统管理器',
        size: 0,
        digest: null
      });
      return;
    }
    
    fileSystemManager.getFileInfo({
      filePath: filePath,
      digestAlgorithm: 'md5',
      success: function(res) {
        if (config.ENABLE_LOG) {
          console.log('[HashUtil] 官方接口获取文件信息成功:', {
            filePath: filePath,
            size: res.size,
            digest: res.digest
          });
        }
        
        resolve({
          success: true,
          size: res.size,
          digest: res.digest,
          error: null
        });
      },
      fail: function(err) {
        console.error('[HashUtil] 官方接口获取文件信息失败:', err);
        
        resolve({
          success: false,
          error: err.errMsg || '获取文件信息失败',
          size: 0,
          digest: null
        });
      }
    });
  });
}

/**
 * 计算文件 MD5 哈希值（简化版，直接使用官方接口）
 * 
 * @param {String} filePath 本地文件路径
 * @returns {Promise<Object>} 返回 { md5: string|null, size: number, error: string|null }
 */
async function calculateFileMD5(filePath) {
  const result = await getFileInfoWithHash(filePath);
  
  return {
    md5: result.digest,
    size: result.size,
    error: result.error
  };
}

/**
 * 批量计算文件 MD5
 * @param {Array<String>} filePaths 文件路径数组
 * @returns {Promise<Array>} 返回 [{ filePath, md5, size, error }]
 */
async function calculateFilesMD5(filePaths) {
  const results = [];
  
  for (const filePath of filePaths) {
    const result = await calculateFileMD5(filePath);
    results.push({
      filePath: filePath,
      md5: result.md5,
      size: result.size,
      error: result.error
    });
  }
  
  return results;
}

/**
 * 从文件路径提取文件名
 */
function extractFileName(filePath) {
  if (!filePath) return '';
  const lastSlash = filePath.lastIndexOf('/');
  if (lastSlash >= 0) {
    return filePath.substring(lastSlash + 1);
  }
  return filePath;
}

/**
 * 提取文件扩展名
 */
function extractFileExtension(filePath) {
  if (!filePath) return '';
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot >= 0 && lastDot < filePath.length - 1) {
    return filePath.substring(lastDot + 1).toLowerCase();
  }
  return '';
}

// 导出所有函数
module.exports = {
  getFileInfoWithHash,
  calculateFileMD5,
  calculateFilesMD5,
  extractFileName,
  extractFileExtension
};
