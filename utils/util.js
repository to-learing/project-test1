/**
 * 工具函数模块
 * 
 * 功能说明：
 * 1. 日期时间格式化
 * 2. 数字格式化
 * 3. 通用辅助方法
 */

// 统一的日期解析，兼容 iOS/微信 WebView 对 ISO 字符串的解析
function parseToDate(date) {
  if (!date) return null;

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'number') {
    return new Date(date);
  }

  if (Array.isArray(date)) {
    // 数组格式：[year, month, day, hour, minute, second]
    return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
  }

  if (typeof date === 'string') {
    // 兼容形如 2026-01-08T23:56:50 或 2026-01-08T23:56:50.123Z
    const normalized = date
      .replace('T', ' ')
      .replace(/\.\d{1,3}Z?$/, '')
      .replace(/-/g, '/');
    return new Date(normalized);
  }

  return null;
}

/**
 * 日期格式化
 * @param {Date|String|Number|Array} date 日期对象/时间戳/日期字符串/数组
 * @param {String} format 格式模板 默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {String} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const dateObj = parseToDate(date);
  if (!dateObj || isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 相对时间格式化
 * @param {Date|String|Number} date 日期
 * @returns {String} 相对时间描述
 */
function formatRelativeTime(date) {
  const dateObj = parseToDate(date);
  if (!dateObj || isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else if (days < 30) {
    return `${Math.floor(days / 7)}周前`;
  } else if (days < 365) {
    return `${Math.floor(days / 30)}个月前`;
  } else {
    return formatDate(dateObj, 'YYYY-MM-DD');
  }
}

/**
 * 数字格式化（添加千分位）
 * @param {Number} num 数字
 * @param {Number} decimals 小数位数
 * @returns {String} 格式化后的字符串
 */
function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  const fixed = Number(num).toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

/**
 * 数字简化格式化（大数字转换为w/万等）
 * @param {Number} num 数字
 * @returns {String} 格式化后的字符串
 */
function formatNumberShort(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  num = Number(num);
  
  if (num < 1000) {
    return String(num);
  } else if (num < 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else if (num < 100000000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
  } else {
    return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
  }
}

/**
 * 百分比格式化
 * @param {Number} num 小数形式的百分比值
 * @param {Number} decimals 小数位数
 * @param {Boolean} showSign 是否显示正负号
 * @returns {String} 格式化后的百分比字符串
 */
function formatPercent(num, decimals = 2, showSign = true) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0%';
  }
  
  const fixed = Number(num).toFixed(decimals);
  const sign = showSign && num > 0 ? '+' : '';
  
  return `${sign}${fixed}%`;
}

/**
 * 价格格式化
 * @param {Number} price 价格（单位：元）
 * @param {String} prefix 前缀符号
 * @param {Number} decimals 小数位数
 * @returns {String} 格式化后的价格字符串
 */
function formatPrice(price, prefix = '¥', decimals = 2) {
  if (price === null || price === undefined || isNaN(price)) {
    return `${prefix}0`;
  }
  
  return `${prefix}${formatNumber(price, decimals)}`;
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间(ms)
 * @returns {Function} 防抖处理后的函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {Number} interval 间隔时间(ms)
 * @returns {Function} 节流处理后的函数
 */
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

/**
 * 深拷贝
 * @param {Object} obj 要拷贝的对象
 * @returns {Object} 拷贝后的新对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copy = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepClone(obj[key]);
      }
    }
    return copy;
  }
  
  return obj;
}

/**
 * 生成唯一ID
 * @param {String} prefix 前缀
 * @returns {String} 唯一ID
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

/**
 * 检查是否为空值
 * @param {*} value 要检查的值
 * @returns {Boolean} 是否为空
 */
function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  return false;
}

/**
 * 获取当前周数
 * @param {Date} date 日期对象
 * @returns {Number} 周数
 */
function getWeekNumber(date = new Date()) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * 获取趋势类名
 * @param {Number} value 涨跌值
 * @returns {String} CSS类名
 */
function getTrendClass(value) {
  if (value > 0) {
    return 'trend-up';
  } else if (value < 0) {
    return 'trend-down';
  } else {
    return 'trend-flat';
  }
}

/**
 * 获取趋势图标
 * @param {Number} value 涨跌值
 * @returns {String} 图标名称
 */
function getTrendIcon(value) {
  if (value > 0) {
    return 'arrow-up';
  } else if (value < 0) {
    return 'arrow-down';
  } else {
    return 'minus';
  }
}

// 导出所有工具函数
module.exports = {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatNumberShort,
  formatPercent,
  formatPrice,
  debounce,
  throttle,
  deepClone,
  generateId,
  isEmpty,
  getWeekNumber,
  getTrendClass,
  getTrendIcon
};
