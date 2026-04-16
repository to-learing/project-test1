const app = getApp();
const api = require('../../../services/api');

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    bio: '',
    gender: 0,
    saving: false
  },
  
  onLoad() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || {};
    this.setData({
      avatarUrl: userInfo.avatar || '',
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
        // 上传图片到服务器
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
      if (res.code === 200 && res.data) {
        this.setData({ avatarUrl: res.data.url || res.data });
        wx.showToast({ title: '上传成功', icon: 'success' });
      } else {
        // 如果上传失败，先用本地路径显示
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: '上传失败，将使用本地图片', icon: 'none' });
      }
    }).catch(err => {
      console.error('上传头像失败:', err);
      // 上传失败时使用本地路径
      this.setData({ avatarUrl: filePath });
      wx.showToast({ title: '上传失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
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
    const { nickName, avatarUrl, bio, gender, saving } = this.data;
    
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
        // 更新全局用户信息
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