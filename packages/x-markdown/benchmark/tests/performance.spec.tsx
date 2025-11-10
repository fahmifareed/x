import { test } from '@playwright/experimental-ct-react';
import fs from 'fs';
import path from 'path';
import React from 'react';
import {
  Empty,
  MarkdownItRenderer,
  MarkedRenderer,
  ReactMarkdownRenderer,
  StreamdownRenderer,
  XMarkdownRenderer,
} from '../components/MarkdownRenderer';

interface BenchmarkResult {
  name: string;
  duration: number;
  avgFPS: number;
  minFPS: number;
  maxFPS: number;
  maxMemory: number;
  avgMemory: number;
  totalFrames: number;
}

const fullText = fs.readFileSync(path.resolve(__dirname, 'test.md'), 'utf-8');

const renderers = ['marked', 'markdown-it', 'react-markdown', 'x-markdown', 'streamdown'];

const getRenderer = (name: string, md = '') => {
  switch (name) {
    case 'marked': {
      return <MarkedRenderer md={md} />;
    }
    case 'markdown-it': {
      return <MarkdownItRenderer md={md} />;
    }
    case 'react-markdown': {
      return <ReactMarkdownRenderer md={md} />;
    }
    case 'x-markdown': {
      return <XMarkdownRenderer md={md} />;
    }
    case 'streamdown': {
      return <StreamdownRenderer md={md} />;
    }
    default: {
      return <div>{md}</div>;
    }
  }
};

async function measure({
  page,
  name,
  browserName,
  mount,
}: {
  name: string;
  page: any;
  mount: any;
  browserName: string;
}): Promise<BenchmarkResult> {
  console.log('🚀 start measure performance:', name);

  await page.context().tracing.start({
    screenshots: true,
    title: `XMarkdown_Stream_Perf_${browserName}`,
  });

  const component = await mount(<Empty />);

  const updateInterval = 50;

  await page.evaluate(() => {
    (window as any).fpsSamples = [];
    (window as any).memorySamples = [];
    (window as any).frameCount = 0;
    (window as any).startTime = performance.now();
    (window as any).lastFrameTime = performance.now();

    const trackFPS = () => {
      const now = performance.now();
      const frameTime = now - (window as any).lastFrameTime;
      if (frameTime > 0) {
        const fps = 1000 / frameTime;
        (window as any).fpsSamples.push(fps);
      }
      (window as any).lastFrameTime = now;
      (window as any).frameCount++;
      requestAnimationFrame(trackFPS);
    };
    requestAnimationFrame(trackFPS);
  });

  const startTime = await page.evaluate(() => (window as any).startTime);

  console.log('🚀 start render streaming markdown:', name);
  for (let i = 0; i < fullText.length; i += 100) {
    const partialText = fullText.substring(0, i + 100);
    const renderer = getRenderer(name, partialText);
    await component.update(renderer);
    await page.evaluate(() => {
      if ((performance as any).memory) {
        (window as any).memorySamples.push((performance as any).memory.usedJSHeapSize);
      }
    });
    await page.waitForTimeout(updateInterval);
  }

  const endTime = await page.evaluate(() => performance.now());
  const totalDuration = endTime - startTime;

  const finalMetrics = await page.evaluate(() => {
    const fpsSamples = (window as any).fpsSamples || [];
    const memorySamples = (window as any).memorySamples || [];
    const validFpsSamples = fpsSamples.filter((fps: number) => fps > 1 && fps < 120);

    return {
      avgFPS:
        validFpsSamples.length > 0
          ? validFpsSamples.reduce((a: number, b: number) => a + b, 0) / validFpsSamples.length
          : 0,
      minFPS: validFpsSamples.length > 0 ? Math.min(...validFpsSamples) : 0,
      maxFPS: validFpsSamples.length > 0 ? Math.max(...validFpsSamples) : 0,
      maxMemory: memorySamples.length > 0 ? Math.max(...memorySamples) : 0,
      avgMemory:
        memorySamples.length > 0
          ? memorySamples.reduce((a: number, b: number) => a + b, 0) / memorySamples.length
          : 0,
      totalFrames: (window as any).frameCount || 0,
    };
  });

  await page.context().tracing.stop({ path: `test-results/trace-xmarkdown.zip` });

  return {
    name,
    duration: totalDuration,
    ...finalMetrics,
  };
}

test.describe('Streaming Markdown Benchmark', async () => {
  const results: Array<BenchmarkResult> = [];

  for (const rendererName of renderers) {
    test(`${rendererName}-Performance`, async ({ page, mount, browserName }) => {
      test.setTimeout(120000);
      try {
        const result = await measure({ name: rendererName, page, mount, browserName });
        results.push(result);
      } catch (error) {
        console.error(`Error in ${rendererName}-Performance:`, error);
        results.push({
          name: rendererName,
          duration: 0,
          avgFPS: 0,
          minFPS: 0,
          maxFPS: 0,
          maxMemory: 0,
          avgMemory: 0,
          totalFrames: 0,
        });
      }
    });
  }

  test.afterAll(async () => {
    console.log('\n📊 Benchmark Results Table');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.table(
      results.map((r) => ({
        MarkdownLength: fullText.length,
        Renderer: r.name,
        'Duration(ms)': Math.round(r.duration),
        'Avg FPS': r.avgFPS.toFixed(1),
        'Avg Memory(MB)': (r.avgMemory / 1024 / 1024).toFixed(2),
        'Total Frames': r.totalFrames,
      })),
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
});
