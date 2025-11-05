# 🚀 Streaming Markdown 渲染性能基准测试

这是一个专业的流式 Markdown 渲染性能对比工具，支持多种渲染器和测试场景。

## 🛠️ 安装 / 运行

```bash
# 安装依赖
npm install

# 安装Playwright浏览器
npx playwright install chromium

# 运行
npm run benchmark
```

## 📊 性能指标

| 指标            | 说明         | 单位 |
| --------------- | ------------ | ---- |
| avgFps          | 平均帧率     | FPS  |
| minFps          | 最低帧率     | FPS  |
| maxFps          | 最高帧率     | FPS  |
| avgRenderTime   | 平均渲染时间 | ms   |
| maxRenderTime   | 最大渲染时间 | ms   |
| totalRenderTime | 总渲染时间   | ms   |
| avgMem          | 平均内存使用 | MB   |
| maxMem          | 最大内存使用 | MB   |
| frameDrops      | 掉帧数量     | 次   |

## 🔍 可视化报告

HTML报告包含：

- 📊 性能摘要卡片
- 📈 交互式图表（FPS、内存、渲染时间对比）
- 📋 详细数据表格
- 🔍 原始JSON数据

## 🎯 最佳实践

1. **测试环境**: 在干净的环境中运行测试，关闭其他应用
2. **多次测试**: 建议运行3-5次取平均值
3. **样本选择**: 根据实际使用场景选择合适的测试样本
4. **结果分析**: 重点关注平均FPS和内存使用指标
