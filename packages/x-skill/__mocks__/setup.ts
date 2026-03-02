// Jest 测试设置文件
import * as fs from 'fs';
import * as path from 'path';

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 创建必要的测试目录
const testDirs = [path.join(__dirname, '../temp'), path.join(__dirname, '../cache')];

testDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 模拟 console 方法，避免测试时输出过多信息
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// 在测试中可以选择性地启用/禁用控制台输出
global.console = {
  ...console,
  log: jest.fn((...args) => {
    // 只在需要时输出，可以通过环境变量控制
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleLog(...args);
    }
  }),
  error: jest.fn((...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleError(...args);
    }
  }),
  warn: jest.fn((...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleWarn(...args);
    }
  }),
};

// 清理测试目录的辅助函数
export const cleanupTestDirs = () => {
  testDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
};

// 在测试完成后清理
afterAll(() => {
  cleanupTestDirs();
});
