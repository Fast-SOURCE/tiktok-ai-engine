# Project TODO - 数据驱动的 AI 内容自进化引擎 MVP

## 基础架构
- [x] 设计深色科技风主题（index.css 颜色变量、字体、霓虹色调）
- [x] 设计数据库 Schema（videos, scripts, ad_campaigns, products）
- [x] 应用数据库迁移
- [x] 配置 DashboardLayout 侧边栏（三个模块入口）
- [x] 实现一键初始化演示数据接口

## 场景一：爆款视频解构模块（DeconstructPage）
- [x] 页面顶部：URL 输入 + 商品卖点输入
- [x] tRPC 接口：分析视频（流式返回钩子/痛点/CTA）
- [x] 拆解结果区：3 卡片打字机效果展示（钩子/痛点/CTA）
- [x] tRPC 接口：生成 3 个脚本变体（流式）
- [x] 脚本生成区：3 卡片流式展示
- [x] Demo 视频卡片区：3 个预置视频缩略图 + 状态标签

## 场景二：视频数据看板（DashboardPage）
- [x] 顶部 KPI 卡片：总播放量/平均完播率/平均GPM/总销售额
- [x] Recharts 折线图：12 条视频 GPM 趋势
- [x] Recharts 柱状图：完播率 vs 互动率
- [x] 视频列表表格：12 条视频核心指标
- [x] tRPC 接口：AI 诊断流式输出
- [x] 点击差视频 → 弹出 AI 诊断对话框（打字机效果）

## 场景三：高潜视频自动投流（AutoAdsPage）
- [x] 实时 GPM 监控面板（数字滚动+趋势图）
- [x] 模拟 GPM 上升的定时器
- [x] 突破阈值 → 全屏预警弹窗
- [x] 弹窗展示自动创建的 Spark Ads 计划详情
- [x] tRPC 接口：模拟投流触发记录

## 测试与交付
- [x] Vitest 单元测试（核心 tRPC 接口）
- [x] 端到端联调
- [x] 保存 checkpoint

## SSE 流式推送改造（v0.2）
- [ ] 在 Express 添加 `/api/stream/deconstruct` SSE 端点，调用 LLM stream 并逐 token 推送
- [ ] 在 Express 添加 `/api/stream/diagnose` SSE 端点，逐 token 推送诊断报告
- [ ] 前端 Deconstruct 页面改用 fetch-stream 消费 SSE，token-by-token 渲染钩子/痛点/CTA
- [ ] 前端 Dashboard 诊断对话框改用 fetch-stream 消费 SSE
- [ ] 编写 SSE 端点的 Vitest 集成测试（验证 chunk 按序到达、最终聚合 JSON 结构正确）
- [ ] 端到端联调，保存 v0.2 checkpoint
