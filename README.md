
## 项目结构

```
test1/                                    # 小程序前端根目录
├── app.js                                # 小程序入口文件
├── app.json                              # 小程序全局配置
├── app.wxss                              # 全局样式
├── package.json                          # 依赖配置
├── .gitignore                            # Git忽略文件
│
├── config/
│   └── index.js                          # 环境配置
│
├── images/                               # 静态图片资源
│   ├── logo.png
│   ├── default-avatar.png
│   └── tabbar/                           # 底部导航图标
│       ├── home.png
│       ├── home-active.png
│       ├── topic.png
│       ├── topic-active.png
│       ├── profile.png
│       └── profile-active.png
│
├── pages/                                # 主包页面
│   │
│   ├── home/                             # 首页
│   │   ├── home.js
│   │   ├── home.json
│   │   ├── home.wxml
│   │   └── home.wxss
│   │
│   ├── article/                          # 文章模块
│   │   ├── list/                         # 文章列表
│   │   │   ├── list.js
│   │   │   ├── list.json
│   │   │   ├── list.wxml
│   │   │   └── list.wxss
│   │   └── detail/                       # 文章详情
│   │       ├── detail.js
│   │       ├── detail.json
│   │       ├── detail.wxml
│   │       └── detail.wxss
│   │
│   ├── topic/                            # 话题模块
│   │   ├── list/                         # 话题列表
│   │   │   ├── list.js
│   │   │   ├── list.json
│   │   │   ├── list.wxml
│   │   │   └── list.wxss
│   │   ├── detail/                       # 话题详情（含评论区）
│   │   │   ├── detail.js
│   │   │   ├── detail.json
│   │   │   ├── detail.wxml
│   │   │   └── detail.wxss
│   │   └── create/                       # 发布话题
│   │       ├── create.js
│   │       ├── create.json
│   │       ├── create.wxml
│   │       └── create.wxss
│   │
│   ├── profile/                          # 用户主页
│   │   ├── profile.js
│   │   ├── profile.json
│   │   ├── profile.wxml
│   │   └── profile.wxss
│   │
│   ├── member/                           # 会员中心
│   │   ├── member.js
│   │   ├── member.json
│   │   ├── member.wxml
│   │   └── member.wxss
│   │
│   ├── login/                            # 登录页
│   │   ├── login.js
│   │   ├── login.json
│   │   ├── login.wxml
│   │   └── login.wxss
│   │
│   └── my/                               # 我的（个人中心模块）
│       ├── index.js                      # 我的主页
│       ├── index.json
│       ├── index.wxml
│       ├── index.wxss
│       ├── member/                       # 会员中心
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       ├── setting/                      # 设置
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       ├── profile-edit/                 # 编辑资料
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       ├── topic/                        # 我的话题
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       └── relationship/                 # 关注/粉丝
│           ├── index.js
│           ├── index.json
│           ├── index.wxml
│           └── index.wxss
│
├── packageEcharts/                       # ECharts分包（按需加载）
│   ├── components/
│   │   └── ec-canvas/                    # ECharts画布组件
│   │       ├── ec-canvas.js
│   │       ├── ec-canvas.json
│   │       ├── ec-canvas.wxml
│   │       ├── ec-canvas.wxss
│   │       ├── echarts.js
│   │       └── wx-canvas.js
│   └── pages/
│       └── dashboard/                    # 数据大盘页面
│           ├── dashboard.js
│           ├── dashboard.json
│           ├── dashboard.wxml
│           └── dashboard.wxss
│
├── services/                             # 服务层
│   ├── api.js                            # API接口封装（按模块分类）
│   ├── request.js                        # HTTP请求封装
│   └── statusCodes.js                    # 状态码定义
│
└── utils/
    └── util.js                           # 工具函数
```

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| 微信小程序 | - | 原生框架 |
| TDesign | 1.12.1 | 腾讯UI组件库 |
| Vant Weapp | 1.11.7 | 有赞UI组件库 |
| ECharts | - | 图表库（分包加载） |

## 页面路由

### 底部导航（TabBar）

| 路径 | 名称 |
|------|------|
| `pages/home/home` | 首页 |
| `pages/topic/list/list` | 话题中心 |
| `pages/my/index` | 我的 |

### API模块

| 模块 | 说明 |
|------|------|
| `auth` | 认证模块（微信登录、刷新Token） |
| `user` | 用户模块（信息、关注、粉丝） |
| `dashboard` | 数据大盘 |
| `category` | 分类模块 |
| `article` | 文章模块 |
| `topic` | 话题模块 |
| `comment` | 评论模块 |
| `like` | 点赞模块 |
| `member` | 会员模块 |
| `upload` | 上传模块 |
