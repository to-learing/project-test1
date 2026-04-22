/**
 * 文件哈希计算工具模块
 * 用于计算文件 MD5 哈希值，实现文件去重上传
 * 
 * 功能说明：
 * 1. 读取本地文件内容
 * 2. 计算 MD5 哈希值
 * 3. 提供文件信息获取
 */

const config = require('../config/index');

/**
 * MD5 哈希算法实现
 * 基于 RFC 1321 标准
 */
const MD5 = (function() {
  function md5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function md51(s) {
    var n = s.length,
        state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  function md5blk(s) {
    var md5blks = [], i;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) +
          (s.charCodeAt(i + 1) << 8) +
          (s.charCodeAt(i + 2) << 16) +
          (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  var hex_chr = '0123456789abcdef'.split('');

  function rhex(n) {
    var s = '', j = 0;
    for (; j < 4; j++)
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] +
          hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }

  function hex(x) {
    for (var i = 0; i < x.length; i++)
      x[i] = rhex(x[i]);
    return x.join('');
  }

  function add32(a, b) {
    return (a + b) & 0xFFFFFFFF;
  }

  return {
    hash: function(s) {
      return hex(md51(s));
    }
  };
})();

/**
 * 将 ArrayBuffer 转换为二进制字符串
 * @param {ArrayBuffer} buffer
 * @returns {String}
 */
function arrayBufferToBinaryString(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

/**
 * 计算文件的 MD5 哈希值
 * @param {String} filePath 本地文件路径（微信小程序临时路径）
 * @returns {Promise<String>} 返回 MD5 哈希值（32位小写）
 */
function calculateFileMD5(filePath) {
  return new Promise((resolve, reject) => {
    const fileSystemManager = wx.getFileSystemManager();
    
    if (!fileSystemManager) {
      reject(new Error('无法获取文件系统管理器'));
      return;
    }
    
    fileSystemManager.readFile({
      filePath: filePath,
      success: function(res) {
        try {
          const binaryString = arrayBufferToBinaryString(res.data);
          const md5Hash = MD5.hash(binaryString);
          
          if (config.ENABLE_LOG) {
            console.log('[HashUtil] 文件MD5计算完成:', {
              filePath: filePath,
              md5: md5Hash,
              size: res.data.byteLength
            });
          }
          
          resolve(md5Hash);
        } catch (err) {
          console.error('[HashUtil] MD5计算失败:', err);
          reject(err);
        }
      },
      fail: function(err) {
        console.error('[HashUtil] 读取文件失败:', err);
        reject(new Error('读取文件失败: ' + (err.errMsg || '未知错误')));
      }
    });
  });
}

/**
 * 批量计算文件 MD5
 * @param {Array<String>} filePaths 文件路径数组
 * @returns {Promise<Array>} 返回 [{ filePath, md5, error }]
 */
async function calculateFilesMD5(filePaths) {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const md5 = await calculateFileMD5(filePath);
      results.push({
        filePath: filePath,
        md5: md5,
        error: null
      });
    } catch (err) {
      results.push({
        filePath: filePath,
        md5: null,
        error: err
      });
    }
  }
  
  return results;
}

/**
 * 获取文件信息
 * @param {String} filePath 文件路径
 * @returns {Promise<Object>} 返回 { size, createTime, digest }
 */
function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    const fileSystemManager = wx.getFileSystemManager();
    
    fileSystemManager.getFileInfo({
      filePath: filePath,
      success: function(res) {
        resolve({
          size: res.size,
          digest: res.digest || null
        });
      },
      fail: function(err) {
        console.error('[HashUtil] 获取文件信息失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 计算快速哈希（基于文件大小 + 内容片段）
 * 适用于大文件快速去重场景，精度略低于完整MD5
 * @param {String} filePath 文件路径
 * @returns {Promise<String>} 返回哈希值
 */
function calculateQuickHash(filePath) {
  return new Promise((resolve, reject) => {
    const fileSystemManager = wx.getFileSystemManager();
    
    // 先获取文件大小
    fileSystemManager.getFileInfo({
      filePath: filePath,
      success: function(infoRes) {
        // 对于小文件（小于100KB），使用完整MD5
        if (infoRes.size < 100 * 1024) {
          calculateFileMD5(filePath).then(resolve).catch(reject);
          return;
        }
        
        // 对于大文件，读取开头、中间、结尾各部分计算哈希
        const positions = [
          { pos: 0, length: 1024 },           // 开头1KB
          { pos: Math.floor(infoRes.size / 2), length: 1024 },  // 中间1KB
          { pos: infoRes.size - 1024, length: 1024 }  // 结尾1KB
        ];
        
        let combinedData = String(infoRes.size);
        
        const readNext = (index) => {
          if (index >= positions.length) {
            const quickHash = MD5.hash(combinedData);
            if (config.ENABLE_LOG) {
              console.log('[HashUtil] 快速哈希计算完成:', quickHash);
            }
            resolve(quickHash);
            return;
          }
          
          const pos = positions[index];
          fileSystemManager.readFile({
            filePath: filePath,
            position: pos.pos,
            length: pos.length,
            success: function(readRes) {
              combinedData += arrayBufferToBinaryString(readRes.data);
              readNext(index + 1);
            },
            fail: function(err) {
              console.error('[HashUtil] 读取文件片段失败:', err);
              // 失败则回退到使用大小哈希
              const fallbackHash = MD5.hash(String(infoRes.size));
              resolve(fallbackHash);
            }
          });
        };
        
        readNext(0);
      },
      fail: function(err) {
        console.error('[HashUtil] 获取文件大小失败:', err);
        reject(err);
      }
    });
  });
}

// 导出所有函数
module.exports = {
  calculateFileMD5,
  calculateFilesMD5,
  calculateQuickHash,
  getFileInfo,
  MD5
};
