const app = getApp();
const api = require('../../../services/api');
const config = require('../../../config/index');
const hashUtil = require('../../../utils/hashUtil');

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    bio: '',
    gender: 0,
    saving: false,
    originalAvatar: '',
    currentFileID: null
  },
  
  onLoad() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || {};
    const avatar = userInfo.avatar || '';
    this.setData({
      avatarUrl: avatar,
      originalAvatar: avatar,
      nickName: userInfo.nickname || '',
      bio: userInfo.bio || '',
      gender: userInfo.gender || 0
    });
  },

  /**
   * 选择头像
   */
  handleChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  /**
   * 上传头像（支持去重）
   */
  async uploadAvatar(filePath) {
    wx.showLoading({ title: '处理中...', mask: true });
    
    try {
      // 1. 计算文件 MD5 哈希值
      if (config.ENABLE_LOG) {
        console.log('[Profile Edit] 开始计算文件哈希:', filePath);
      }
      
      const fileHash = await hashUtil.calculateFileMD5(filePath);
      
      if (config.ENABLE_LOG) {
        console.log('[Profile Edit] 文件哈希计算完成:', fileHash);
      }
      
      // 2. 调用后端检查文件是否已存在
      wx.showLoading({ title: '检查中...', mask: true });
      
      const checkResult = await api.upload.checkFile(fileHash);
      
      if (config.ENABLE_LOG) {
        console.log('[Profile Edit] 文件检查结果:', checkResult);
      }
      
      // 3. 文件已存在，直接复用
      if (checkResult.code === 200 && checkResult.data && checkResult.data.exists) {
        const existingUrl = checkResult.data.fileUrl;
        
        this.setData({
          avatarUrl: existingUrl,
          currentFileID: null
        });
        
        wx.hideLoading();
        wx.showToast({ title: '已存在，无需上传', icon: 'success' });
        
        if (config.ENABLE_LOG) {
          console.log('[Profile Edit] 文件已存在，复用已有URL:', {
            url: existingUrl,
            uploadCount: checkResult.data.uploadCount
          });
        }
        return;
      }
      
      // 4. 文件不存在，上传云存储
      wx.showLoading({ title: '上传中...', mask: true });
      
      const uploadResult = await api.upload.image(filePath);
      
      if (uploadResult.code === 200 && uploadResult.data) {
        const avatarUrl = uploadResult.data.url || uploadResult.data;
        const fileID = uploadResult.fileID || null;
        
        // 5. 记录文件哈希到后端
        try {
          // 获取文件信息
          const fileInfo = await hashUtil.getFileInfo(filePath);
          
          // 提取文件名和扩展名
          const fileName = this.extractFileName(filePath);
          const extension = this.extractFileExtension(filePath);
          
          // 记录哈希
          await api.upload.recordFileHash({
            hash: fileHash,
            fileUrl: avatarUrl,
            fileSize: fileInfo.size,
            originalName: fileName,
            extension: extension
          });
          
          if (config.ENABLE_LOG) {
            console.log('[Profile Edit] 文件哈希记录成功');
          }
        } catch (recordErr) {
          // 记录失败不影响主流程，只打日志
          console.warn('[Profile Edit] 记录文件哈希失败:', recordErr);
        }
        
        this.setData({
          avatarUrl: avatarUrl,
          currentFileID: fileID
        });
        
        wx.hideLoading();
        wx.showToast({ title: '上传成功', icon: 'success' });
        
        if (config.ENABLE_LOG) {
          console.log('[Profile Edit] 头像上传成功:', {
            url: avatarUrl,
            fileID: fileID,
            hash: fileHash
          });
        }
      } else {
        wx.hideLoading();
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: '上传失败，将使用本地图片', icon: 'none' });
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('[Profile Edit] 上传头像失败:', err);
      
      // 出错时回退到传统上传方式
      this.fallbackUpload(filePath);
    }
  },
  
  /**
   * 回退上传方式（传统方式，不去重）
   */
  fallbackUpload(filePath) {
    wx.showLoading({ title: '上传中...' });
    
    api.upload.image(filePath).then(res => {
      wx.hideLoading();
      
      if (res.code === 200 && res.data) {
        const avatarUrl = res.data.url || res.data;
        const fileID = res.fileID || null;
        
        this.setData({
          avatarUrl: avatarUrl,
          currentFileID: fileID
        });
        
        wx.showToast({ title: '上传成功', icon: 'success' });
        
        if (config.ENABLE_LOG) {
          console.log('[Profile Edit] 回退上传成功:', {
            url: avatarUrl,
            fileID: fileID
          });
        }
      } else {
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('[Profile Edit] 回退上传失败:', err);
      this.setData({ avatarUrl: filePath });
      wx.showToast({ title: '上传失败', icon: 'none' });
    });
  },
  
  /**
   * 从文件路径提取文件名
   */
  extractFileName(filePath) {
    if (!filePath) return '';
    const lastSlash = filePath.lastIndexOf('/');
    if (lastSlash >= 0) {
      return filePath.substring(lastSlash + 1);
    }
    return filePath;
  },
  
  /**
   * 提取文件扩展名
   */
  extractFileExtension(filePath) {
    if (!filePath) return '';
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot >= 0 && lastDot < filePath.length - 1) {
      return filePath.substring(lastDot + 1).toLowerCase();
    }
    return '';
  },

  handleNickNameChange(e) {
    this.setData({ nickName: e.detail.value });
  },

  handleBioChange(e) {
    this.setData({ bio: e.detail.value });
  },

  /**
   * 保存用户资料
   */
  handleSave() {
    const { nickName, avatarUrl, bio, gender, saving, originalAvatar, currentFileID } = this.data;
    
    if (saving) return;
    
    if (!nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    
    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...' });
    
    api.user.updateProfile({
      nickname: nickName.trim(),
      avatar: avatarUrl,
      bio: bio.trim(),
      gender: gender
    }).then(res => {
      if (res.code === 200 && res.data) {
        const userInfo = res.data;
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        wx.showToast({ title: '保存成功', icon: 'success' });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('保存用户资料失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }).finally(() => {
      this.setData({ saving: false });
      wx.hideLoading();
    });
  }
});