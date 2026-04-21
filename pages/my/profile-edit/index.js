const app = getApp();
const api = require('../../../services/api');
const config = require('../../../config/index');

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
   * 上传头像
   */
  uploadAvatar(filePath) {
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
          console.log('[Profile Edit] 头像上传成功:', {
            url: avatarUrl,
            fileID: fileID
          });
        }
      } else {
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: '上传失败，将使用本地图片', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('上传头像失败:', err);
      this.setData({ avatarUrl: filePath });
      wx.showToast({ title: '上传失败', icon: 'none' });
    });
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