/**
 * 登录页面逻辑
 * 处理微信授权登录
 */

const app = getApp()
const api = require('../../services/api')

Page({
  data: {
    // 是否正在登录
    loading: false,
    redirect: ''
  },

  /**
   * 页面加载
   * @param {Object} options - 页面参数
   */
  onLoad(options) {
    const redirect = options && options.redirect ? decodeURIComponent(options.redirect) : ''
    this.setData({ redirect })

    // 如果已经登录，直接回跳
    if (app.globalData.accessToken) {
      this.navigateAfterLogin()
    }
  },

  /**
   * 微信一键登录
   * 使用 wx.login 获取 code，然后调用后端接口换取 accessToken
   */
  async onWechatLogin() {
    this.setData({ loading: true })

    try {
      // 1. 调用微信登录获取 code
      const loginRes = await wx.login()
      
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      // 2. 调用后端登录接口
      const res = await api.auth.wxLogin({
        code: loginRes.code,
        nickname: '',
        avatarUrl: ''
      })

      // 3. 保存登录信息
      const { accessToken, refreshToken, userInfo } = res.data

      // 调用 app.login 方法更新全局状态
      app.login({
        accessToken,
        refreshToken,
        userInfo
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 延迟返回上一页
      setTimeout(() => {
        this.navigateAfterLogin()
      }, 1000)

    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
      
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 登录后跳转：优先使用 redirect
   */
  navigateAfterLogin() {
    const redirect = this.data.redirect
    if (!redirect) {
      this.navigateBack()
      return
    }

    if (this.isTabBarUrl(redirect)) {
      wx.switchTab({ url: redirect })
      return
    }

    wx.redirectTo({ url: redirect })
  },

  /**
   * 是否为 tabBar 页面
   */
  isTabBarUrl(url) {
    try {
      const appConfig = require('../../app.json')
      const tabs = (appConfig.tabBar && appConfig.tabBar.list) ? appConfig.tabBar.list : []
      const tabPages = tabs.map((item) => item.pagePath)

      const pathOnly = url.split('?')[0]
      const normalized = pathOnly.startsWith('/') ? pathOnly.slice(1) : pathOnly
      return tabPages.includes(normalized)
    } catch (e) {
      return false
    }
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    const pages = getCurrentPages()
    
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },

  /**
   * 查看用户协议
   */
  onViewUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议的详细内容...',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的详细内容...',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 跳过登录
   */
  onSkip() {
    this.navigateBack()
  }
})
