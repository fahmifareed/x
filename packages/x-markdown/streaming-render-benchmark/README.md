# 🚀 流式Markdown渲染性能基准测试

这是一个专业的流式Markdown渲染性能对比工具，支持多种渲染器和测试场景。

## ✨ 特性

- **多渲染器支持**: markdown-it, react-markdown
- **多测试场景**: 简单、复杂、混合内容
- **精确性能指标**: FPS、内存使用、渲染时间、掉帧数
- **防抖渲染**: 减少不必要的重渲染
- **错误重试**: 自动重试失败的测试
- **丰富报告**: JSON、CSV、HTML、Markdown格式
- **可视化图表**: 交互式性能对比图表

## 🛠️ 安装

```bash
# 安装依赖
npm install

# 安装Playwright浏览器
npx playwright install chromium
```

## 🚀 使用

### 基本使用

```bash
# 运行完整基准测试
npm run benchmark

# 或直接运行
node bench.ts
```

### 自定义配置

在 `bench.ts` 中修改 `CONFIG` 对象：

```typescript
const CONFIG = {
  duration: 10_000, // 测试持续时间(ms)
  chunkSize: 50, // 每次追加字符数
  interval: 100, // 追加间隔(ms)
  warmup: 1_000, // 预热时间(ms)
  retryCount: 3, // 重试次数
  headless: true, // 是否无头模式
};
```

### 添加新的渲染器

在 `RENDERERS` 数组中添加新的渲染器配置：

```typescript
const RENDERERS = [
  {
    name: 'your-renderer',
    inject: `
      // 你的渲染器初始化代码
      window.append = (text) => {
        // 渲染逻辑
      };
    `,
  },
];
```

### 添加新的测试样本

在 `TEST_SAMPLES` 对象中添加新的测试内容：

```typescript
const TEST_SAMPLES = {
  custom: `
    # 自定义测试内容
    你的markdown内容...
  `,
  // ...其他样本
};
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

## 📁 输出文件

测试完成后会在 `reports/` 目录生成以下文件：

- `report-{timestamp}.json` - 完整JSON数据
- `report-{timestamp}.csv` - CSV格式数据
- `report-{timestamp}.html` - 可视化HTML报告
- `report-{timestamp}.md` - Markdown格式报告

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

## 🐛 故障排除

### 浏览器启动失败

```bash
# 安装缺失的依赖
npx playwright install-deps chromium
```

### 内存不足

- 减少 `CONFIG.duration`
- 减小 `TEST_SAMPLES` 内容大小
- 增加系统可用内存

### 测试超时

- 增加 `CONFIG.interval`
- 减少 `CONFIG.chunkSize`

## 📈 性能优化建议

基于测试结果，我们提供以下优化建议：

1. **防抖渲染**: 使用16ms防抖减少重渲染
2. **分块处理**: 大内容分块渲染避免阻塞
3. **内存管理**: 及时清理不再需要的渲染结果
4. **Web Worker**: 复杂渲染考虑使用Web Worker

## 🤝 贡献

欢迎提交Issue和PR来改进这个基准测试工具！

## 📄 许可证

MIT
