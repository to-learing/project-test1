const api = require('../../../services/api');

// 示例图片链接（暂时代替图片上传）
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800'
];

Page({
  data: {
    title: '',
    content: '',
    fileList: [],
    showTopicPanel: false,
    topicSearchKey: '',
    textareaFocus: false,
    hasMatchingTopic: true,
    // 从后端获取的话题标签列表
    topicList: [],
    // 本地临时创建的话题标签（发布时才添加到数据库）
    localTopicList: [],
    filteredTopicList: [],
    selectedTopics: [],
    isLoading: false,
    isSubmitting: false
  },

  onLoad() {
    this.loadTopicTags();
  },

  onShow() {
    // 页面显示时刷新标签列表
    this.loadTopicTags();
  },

  /**
   * 从后端加载话题标签列表
   */
  async loadTopicTags() {
    try {
      this.setData({ isLoading: true });
      const res = await api.topic.getTags({ limit: 50 });
      if (res.code === 200 && res.data) {
        const topicList = res.data.map((item, index) => ({
          id: index + 1,
          name: item.name,
          count: item.count || 0,
          isNew: false
        }));
        this.setData({
          topicList,
          filteredTopicList: [...topicList, ...this.data.localTopicList]
        });
      }
    } catch (error) {
      console.error('加载话题标签失败:', error);
      // 失败时使用空列表
      this.setData({
        topicList: [],
        filteredTopicList: [...this.data.localTopicList]
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 获取合并后的完整标签列表（后端标签 + 本地临时标签）
   */
  getAllTopicList() {
    return [...this.data.topicList, ...this.data.localTopicList];
  },

  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
  },

  onContentInput(e) {
    const content = e.detail.value;
    this.setData({ content });
    
    // 如果话题面板已打开，实时搜索
    if (this.data.showTopicPanel) {
      this.searchTopicFromContent(content);
    }
  },

  // 文件上传成功
  handleSuccess(e) {
    const { files } = e.detail;
    this.setData({
      fileList: files,
    });
  },

  handleRemove(e) {
    const { index } = e.detail;
    const { fileList } = this.data;
    fileList.splice(index, 1);
    this.setData({
      fileList,
    });
  },

  handleClick(e) {
    console.log(e.detail.file);
  },

  handleDrop(e) {
    const { files } = e.detail;
    this.setData({
      fileList: files,
    });
  },

  // 从内容中提取 # 后的文字进行搜索
  searchTopicFromContent(content) {
    // 找到最后一个 # 的位置
    const lastHashIndex = content.lastIndexOf('#');
    
    if (lastHashIndex === -1) {
      // 没有 #，关闭面板
      this.setData({
        showTopicPanel: false,
        topicSearchKey: '',
        filteredTopicList: this.getAllTopicList()
      });
      return;
    }

    // 获取 # 后面的文字（到下一个空格或结尾）
    const afterHash = content.substring(lastHashIndex + 1);
    const spaceIndex = afterHash.indexOf(' ');
    const searchKey = spaceIndex === -1 ? afterHash : afterHash.substring(0, spaceIndex);

    // 如果 # 后面有空格，说明话题输入结束，关闭面板
    if (spaceIndex !== -1 && spaceIndex === 0) {
      this.setData({
        showTopicPanel: false,
        topicSearchKey: '',
        filteredTopicList: this.getAllTopicList()
      });
      return;
    }

    // 过滤话题（从合并列表中过滤）
    const allTopics = this.getAllTopicList();
    const filtered = allTopics.filter(topic =>
      topic.name.toLowerCase().includes(searchKey.toLowerCase())
    );

    // 检查是否有完全匹配的话题
    const hasMatching = filtered.some(topic => 
      topic.name.toLowerCase() === searchKey.toLowerCase()
    );

    this.setData({
      topicSearchKey: searchKey,
      filteredTopicList: filtered,
      hasMatchingTopic: hasMatching || searchKey === ''
    });
  },

  onTextareaFocus() {
    this.setData({ textareaFocus: true });
  },

  onTextareaBlur() {
    // 延迟关闭，避免点击话题时面板消失
    setTimeout(() => {
      if (!this._selectingTopic) {
        this.setData({ 
          textareaFocus: false
        });
      }
    }, 150);
  },

  // 切换话题面板显示
  toggleTopicPanel() {
    const show = !this.data.showTopicPanel;
    
    if (show) {
      // 打开面板，在内容末尾添加 #
      let content = this.data.content;
      if (!content.endsWith('#')) {
        content = content + (content && !content.endsWith(' ') && !content.endsWith('\n') ? ' ' : '') + '#';
      }
      
      // 先设置数据
      this.setData({
        showTopicPanel: true,
        content,
        topicSearchKey: '',
        filteredTopicList: this.getAllTopicList(),
        hasMatchingTopic: true,
        textareaFocus: false
      });
      
      // 延迟聚焦，确保键盘弹出
      setTimeout(() => {
        this.setData({ textareaFocus: true });
      }, 100);
    } else {
      // 关闭面板
      this.closeTopicPanel();
    }
  },

  // 关闭话题面板
  closeTopicPanel() {
    this.setData({
      showTopicPanel: false,
      topicSearchKey: '',
      filteredTopicList: this.getAllTopicList(),
      hasMatchingTopic: true
    });
  },

  // 选择话题
  selectTopic(e) {
    this._selectingTopic = true;
    const topic = e.currentTarget.dataset.topic;
    const { selectedTopics, content } = this.data;

    // 检查是否已达到最大数量
    if (selectedTopics.length >= 5) {
      wx.showToast({ title: '最多添加5个话题', icon: 'none' });
      this._selectingTopic = false;
      return;
    }

    // 添加到已选话题（允许重复添加）
    const newSelectedTopics = [...selectedTopics, { ...topic, uniqueId: Date.now() }];

    // 替换内容中的 #xxx 为空（话题会显示在标签区域）
    const newContent = this.removeLastHashTag(content);

    this.setData({
      selectedTopics: newSelectedTopics,
      content: newContent,
      showTopicPanel: false,
      topicSearchKey: '',
      filteredTopicList: this.getAllTopicList(),
      hasMatchingTopic: true
    });

    setTimeout(() => {
      this._selectingTopic = false;
    }, 200);
  },

  // 创建新话题（本地临时创建，发布时才提交到数据库）
  createNewTopic() {
    this._selectingTopic = true;
    const { topicSearchKey, selectedTopics, localTopicList, content } = this.data;

    if (!topicSearchKey.trim()) {
      this._selectingTopic = false;
      return;
    }

    // 检查是否已达到最大数量
    if (selectedTopics.length >= 5) {
      wx.showToast({ title: '最多添加5个话题', icon: 'none' });
      this._selectingTopic = false;
      return;
    }

    // 检查是否已存在相同名称的标签（包括后端和本地）
    const allTopics = this.getAllTopicList();
    const existingTopic = allTopics.find(t => 
      t.name.toLowerCase() === topicSearchKey.trim().toLowerCase()
    );

    if (existingTopic) {
      // 如果已存在，直接选择该标签
      const newSelectedTopics = [...selectedTopics, { ...existingTopic, uniqueId: Date.now() }];
      const newContent = this.removeLastHashTag(content);
      this.setData({
        selectedTopics: newSelectedTopics,
        content: newContent,
        showTopicPanel: false,
        topicSearchKey: '',
        filteredTopicList: this.getAllTopicList(),
        hasMatchingTopic: true
      });
      wx.showToast({ title: '已选择该话题', icon: 'success', duration: 1000 });
      this._selectingTopic = false;
      return;
    }

    // 创建新话题（本地临时标签，isNew标记为true）
    const newTopic = {
      id: 'local_' + Date.now(),
      uniqueId: Date.now(),
      name: topicSearchKey.trim(),
      count: 0,
      isNew: true  // 标记为新创建的话题，发布时才提交到数据库
    };

    const newSelectedTopics = [...selectedTopics, newTopic];
    // 将新话题添加到本地临时列表中
    const newLocalTopicList = [...localTopicList, { 
      id: newTopic.id, 
      name: newTopic.name, 
      count: 0, 
      isNew: true 
    }];
    const newContent = this.removeLastHashTag(content);

    this.setData({
      selectedTopics: newSelectedTopics,
      localTopicList: newLocalTopicList,
      filteredTopicList: [...this.data.topicList, ...newLocalTopicList],
      content: newContent,
      showTopicPanel: false,
      topicSearchKey: '',
      hasMatchingTopic: true
    });

    wx.showToast({ title: '话题已添加', icon: 'success', duration: 1000 });

    setTimeout(() => {
      this._selectingTopic = false;
    }, 200);
  },

  // 移除内容中最后的 #xxx
  removeLastHashTag(content) {
    const lastHashIndex = content.lastIndexOf('#');
    if (lastHashIndex === -1) return content;
    
    // 移除 # 及其后面的内容（到空格或结尾）
    const beforeHash = content.substring(0, lastHashIndex);
    const afterHash = content.substring(lastHashIndex + 1);
    const spaceIndex = afterHash.indexOf(' ');
    
    if (spaceIndex === -1) {
      // # 后面没有空格，移除到结尾
      return beforeHash.trimEnd();
    } else {
      // # 后面有空格，保留空格后的内容
      return beforeHash + afterHash.substring(spaceIndex + 1);
    }
  },

  // 移除已选话题
  removeSelectedTopic(e) {
    const uniqueId = e.currentTarget.dataset.uniqueid;
    const { selectedTopics } = this.data;

    const newSelectedTopics = selectedTopics.filter(t => t.uniqueId !== uniqueId);

    this.setData({
      selectedTopics: newSelectedTopics
    });
  },

  submitTopic() {
    const { title, content, selectedTopics, fileList, isSubmitting } = this.data;

    // 防止重复提交
    if (isSubmitting) {
      return;
    }

    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }

    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...', mask: true });

    // 处理图片：如果有上传的图片使用上传的，否则使用示例图片
    let images = [];
    if (fileList && fileList.length > 0) {
      // 这里暂时使用示例图片代替真实上传
      // 实际应该使用 fileList 中的 url
      images = SAMPLE_IMAGES.slice(0, fileList.length);
    }

    // 处理话题标签：只提取标签名称
    const tags = selectedTopics.map(t => t.name);

    const submitData = {
      title: title.trim(),
      content: content.trim(),
      images: images,
      tags: tags
    };

    console.log("提交数据:", submitData);

    // 调用API发布话题
    api.topic.create(submitData)
      .then(res => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });

        if (res.code === 200) {
          wx.showToast({ 
            title: '发布成功', 
            icon: 'success',
            duration: 1500
          });

          // 清空表单数据
          this.setData({
            title: '',
            content: '',
            fileList: [],
            selectedTopics: [],
            localTopicList: []
          });

          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ 
            title: res.message || '发布失败', 
            icon: 'none' 
          });
        }
      })
      .catch(error => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        console.error('发布话题失败:', error);
        wx.showToast({ 
          title: '发布失败，请重试', 
          icon: 'none' 
        });
      });
  }
});
