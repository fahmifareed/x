#!/usr/bin/env node
import fs from 'fs';
import { dirname, join } from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testMdPath = join(__dirname, 'test.md');

if (!fs.existsSync(testMdPath)) {
  const md = Array.from(
    { length: 2000 },
    (_, i) =>
      `## Section ${i + 1}\n\nThis is paragraph ${i + 1} with **bold** and *italic* text.\n\n- Item A\n- Item B\n\n\`\`\`js\nconsole.log("code block ${i + 1}");\n\`\`\`\n`,
  ).join('\n');
  fs.writeFileSync(testMdPath, md, 'utf8');
}
const markdown = fs.readFileSync(testMdPath, 'utf8');

const CHUNK_LEN = Math.ceil(100 * Math.random());
const chunks = [];
for (let i = 0; i < markdown.length; i += CHUNK_LEN) {
  chunks.push(markdown.slice(i, i + CHUNK_LEN));
}

const renderers = ['react-markdown'];

async function runRenderer(browser, name) {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');

  await page.goto(`file://${join(__dirname, 'index.html')}`);

  await page.evaluate(
    ({ name }) => {
      document.getElementById(name).innerHTML = '';
    },
    { name },
  );

  await page.evaluate(() => {
    window.__mem = [];
    setInterval(() => {
      if (performance.memory) window.__mem.push(performance.memory.usedJSHeapSize);
    }, 100);
  });

  await page.evaluate(
    async ({ name, chunks }) => {
      console.log('chunks', chunks);
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

  const perf = await page.evaluate(() => ({
    fps: (
      performance.getEntriesByName('render').length /
      (performance.getEntriesByName('total')[0].duration / 1000)
    ).toFixed(2),
    memMax: (Math.max(...(window.__mem || [0])) / 1024 / 1024).toFixed(2),
    total: (performance.getEntriesByName('total')[0].duration / 1000).toFixed(2),
  }));

  await page.close();
  return { renderer: name, fps: perf.fps, memMaxMB: perf.memMax, totalS: perf.total };
}

(async () => {
  console.log('🚀  Markdown Render Benchmark\n');
  const browser = await chromium.launch({ headless: false });
  const results = [];
  for (const renderer of renderers) {
    console.log(`⏰ Renderer: ${renderer} \n`);
    const result = await runRenderer(browser, renderer);
    console.log(`📈 Result: ${JSON.stringify(result)} \n`);
    results.push(result);
  }
  console.table(results);
  await browser.close();
})();
