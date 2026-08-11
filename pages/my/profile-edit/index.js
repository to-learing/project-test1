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
   * 流程：
   * 1. 使用微信官方接口计算 MD5
   * 2. 有 MD5：调用后端检查是否已存在
   *    - 存在：直接复用已有 URL
   *    - 不存在：上传云存储，然后记录哈希
   * 3. 无 MD5：直接上传云存储，上传成功后尝试记录哈希
   */
  async uploadAvatar(filePath) {
    wx.showLoading({ title: '处理中...', mask: true });
    
    // 1. 使用微信官方接口计算 MD5 和获取文件信息
    const fileInfoResult = await hashUtil.getFileInfoWithHash(filePath);
    const hasValidHash = fileInfoResult.success && fileInfoResult.digest;
    
    if (config.ENABLE_LOG) {
      console.log('[Profile Edit] 文件信息获取结果:', {
        filePath: filePath,
        hasHash: hasValidHash,
        hash: fileInfoResult.digest,
        size: fileInfoResult.size,
        error: fileInfoResult.error
      });
    }
    
    // 2. 如果有有效 MD5，先检查后端是否已存在
    if (hasValidHash) {
      wx.showLoading({ title: '检查中...', mask: true });
      
      try {
        const checkResult = await api.upload.checkFile(fileInfoResult.digest);
        
        if (config.ENABLE_LOG) {
          console.log('[Profile Edit] 文件检查结果:', checkResult);
        }
        
        // 文件已存在，直接复用
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
              hash: fileInfoResult.digest,
              uploadCount: checkResult.data.uploadCount
            });
          }
          return;
        }
        
      } catch (checkErr) {
        // 检查接口失败，不中断流程，继续上传
        console.warn('[Profile Edit] 检查文件存在性失败，继续上传:', checkErr);
      }
    }
    
    // 3. 文件不存在或没有 MD5，上传云存储
    wx.showLoading({ title: '上传中...', mask: true });
    
    try {
      const uploadResult = await api.upload.image(filePath);
      
      if (uploadResult.code === 200 && uploadResult.data) {
        const avatarUrl = uploadResult.data.url || uploadResult.data;
        const fileID = uploadResult.fileID || null;
        
        // 4. 上传成功后，记录哈希到后端（如果有 MD5）
        if (hasValidHash) {
          try {
            const fileName = hashUtil.extractFileName(filePath);
            const extension = hashUtil.extractFileExtension(filePath);
            
            await api.upload.recordFileHash({
              hash: fileInfoResult.digest,
              fileUrl: avatarUrl,
              fileSize: fileInfoResult.size,
              originalName: fileName,
              extension: extension
            });
            
            if (config.ENABLE_LOG) {
              console.log('[Profile Edit] 文件哈希记录成功:', {
                hash: fileInfoResult.digest,
                url: avatarUrl
              });
            }
          } catch (recordErr) {
            // 记录失败不影响主流程，只打日志
            console.warn('[Profile Edit] 记录文件哈希失败:', recordErr);
          }
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
            hasHash: hasValidHash,
            hash: fileInfoResult.digest
          });
        }
      } else {
        wx.hideLoading();
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: '上传失败，将使用本地图片', icon: 'none' });
      }
      
    } catch (uploadErr) {
      wx.hideLoading();
      console.error('[Profile Edit] 上传头像失败:', uploadErr);
      
      this.setData({ avatarUrl: filePath });
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
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