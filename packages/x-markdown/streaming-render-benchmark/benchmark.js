#!/usr/bin/env node
import fs from 'fs';
import { dirname, join } from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testMdPath = join(__dirname, 'test.md');

// 1. 生成 2000 段 Markdown（仅第一次）
if (!fs.existsSync(testMdPath)) {
  const md = Array.from(
    { length: 2000 },
    (_, i) =>
      `## Section ${i + 1}\n\nThis is paragraph ${i + 1} with **bold** and *italic* text.\n\n- Item A\n- Item B\n\n\`\`\`js\nconsole.log("code block ${i + 1}");\n\`\`\`\n`,
  ).join('\n');
  fs.writeFileSync(testMdPath, md, 'utf8');
}
const markdown = fs.readFileSync(testMdPath, 'utf8');

// 2. 切块（每块 ~200 字符，可改）
const CHUNK_LEN = Math.ceil(100 * Math.random());
const chunks = [];
for (let i = 0; i < markdown.length; i += CHUNK_LEN) {
  chunks.push(markdown.slice(i, i + CHUNK_LEN));
}

// 3. 渲染器配置
const renderers = [
  { name: 'marked', id: 'marked' },
  { name: 'markdown-it', id: 'markdown-it' },
  { name: 'react-markdown', id: 'react-markdown' },
];

// 4. 单渲染器测试（并行）
async function runRenderer(browser, { name, id }) {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');

  await page.goto(`file://${join(__dirname, 'index.html')}`);
  await page.evaluate(
    ({ id }) => {
      document.getElementById(id).innerHTML = '';
    },
    { id },
  );

  // 注入探针（确保内存采样已启动）
  await page.evaluate(() => {
    window.__mem = [];
    setInterval(() => {
      if (performance.memory) window.__mem.push(performance.memory.usedJSHeapSize);
    }, 100);
  });

  // 真正渲染 + 测速
  await page.evaluate(
    async ({ name, chunks }) => {
      performance.mark('start');
      let md = '';
      for (const c of chunks) {
        md += c;
        performance.mark('chunk-s');
        window.renderers[name](md);
        performance.measure('render', 'chunk-s');
        await new Promise(requestIdleCallback);
      }
      performance.mark('end');
      performance.measure('total', 'start', 'end');
    },
    { name, chunks },
  );

  // 收集
  const perf = await page.evaluate(() => ({
    fps: (
      performance.getEntriesByName('render').length /
      (performance.getEntriesByName('total')[0].duration / 1000)
    ).toFixed(2),
    memMax: (Math.max(...(window.__mem || [0])) / 1024 / 1024).toFixed(2),
    total: performance.getEntriesByName('total')[0].duration.toFixed(2),
  }));

  await page.close();
  return { renderer: name, fps: perf.fps, memMaxMB: perf.memMax, totalMS: perf.total };
}

// 5. 主函数
(async () => {
  console.log('🚀  Markdown Render Benchmark (parallel)\n');
  const browser = await chromium.launch({ headless: false });
  const results = await Promise.all(renderers.map((r) => runRenderer(browser, r)));
  console.table(results);
  await browser.close();
})();
