#!/usr/bin/env node
/**
 * Performance Threshold Check Script
 * 检查 benchmark 结果是否满足性能阈值要求
 */

const fs = require('fs');

// 固定性能阈值
const PERFORMANCE_THRESHOLDS = {
  'x-markdown': {
    short: {
      maxDuration: 5000, // 短文本 < 5 s
      minAvgFPS: 60, // 固定 60 FPS
      maxStdDevFPS: 9999, // 不再限制
      maxMemoryDelta: 20, // 内存 < 20 MB
    },
    medium: {
      maxDuration: 15000, // 中文本 < 15 s
      minAvgFPS: 60,
      maxStdDevFPS: 9999,
      maxMemoryDelta: 20,
    },
    long: {
      maxDuration: 80000, // 长文本 < 80 s
      minAvgFPS: 60,
      maxStdDevFPS: 9999,
      maxMemoryDelta: 20,
    },
  },
};

function loadBenchmarkResults(resultsPath) {
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Benchmark results not found: ${resultsPath}`);
    process.exit(1);
  }

  const data = fs.readFileSync(resultsPath, 'utf-8');
  return JSON.parse(data);
}

function checkThresholds(results) {
  const failures = [];
  const warnings = [];

  results.forEach((result) => {
    if (result.name !== 'x-markdown') return;

    const { textType, duration, avgFPS, stdDevFPS, memoryDelta } = result;
    const thresholds = PERFORMANCE_THRESHOLDS['x-markdown'][textType];

    if (!thresholds) {
      warnings.push(`⚠️  No thresholds defined for ${textType} text`);
      return;
    }

    // 检查各项指标
    if (duration > thresholds.maxDuration) {
      failures.push(
        `❌ ${textType} text: Duration ${duration}ms exceeds threshold ${thresholds.maxDuration}ms`,
      );
    } else if (duration > thresholds.maxDuration * 0.9) {
      warnings.push(
        `⚠️  ${textType} text: Duration ${duration}ms is close to threshold ${thresholds.maxDuration}ms`,
      );
    }

    if (avgFPS < thresholds.minAvgFPS) {
      failures.push(
        `❌ ${textType} text: Avg FPS ${avgFPS} is below threshold ${thresholds.minAvgFPS}`,
      );
    } else if (avgFPS < thresholds.minAvgFPS * 1.1) {
      warnings.push(
        `⚠️  ${textType} text: Avg FPS ${avgFPS} is close to threshold ${thresholds.minAvgFPS}`,
      );
    }

    if (stdDevFPS > thresholds.maxStdDevFPS) {
      failures.push(
        `❌ ${textType} text: FPS StdDev ${stdDevFPS} exceeds threshold ${thresholds.maxStdDevFPS}`,
      );
    }

    if (memoryDelta > thresholds.maxMemoryDelta) {
      failures.push(
        `❌ ${textType} text: Memory delta ${memoryDelta}MB exceeds threshold ${thresholds.maxMemoryDelta}MB`,
      );
    } else if (memoryDelta > thresholds.maxMemoryDelta * 0.9) {
      warnings.push(
        `⚠️  ${textType} text: Memory delta ${memoryDelta}MB is close to threshold ${thresholds.maxMemoryDelta}MB`,
      );
    }
  });

  return { failures, warnings };
}

function generateReport(currentResults) {
  const { failures, warnings } = checkThresholds(currentResults);

  let report = '\n📊 Performance Benchmark Report\n';
  report += '='.repeat(80) + '\n\n';

  // x-markdown 结果摘要
  const xMarkdownResults = currentResults.filter((r) => r.name === 'x-markdown');
  if (xMarkdownResults.length > 0) {
    report += '🎯 x-markdown Performance Results:\n';
    report += '-'.repeat(80) + '\n';

    xMarkdownResults.forEach((result) => {
      report += `\n${result.textType.toUpperCase()} Text:\n`;
      report += `  Duration: ${result.duration}ms\n`;
      report += `  Avg FPS: ${result.avgFPS} (StdDev: ${result.stdDevFPS})\n`;
      report += `  Memory Delta: ${result.memoryDelta}MB\n`;
    });
    report += '\n';
  }

  // 显示警告
  if (warnings.length > 0) {
    report += '\n⚠️  Warnings:\n';
    warnings.forEach((warning) => {
      report += `  ${warning}\n`;
    });
    report += '\n';
  }

  // 显示失败
  if (failures.length > 0) {
    report += '\n❌ Performance Threshold Failures:\n';
    failures.forEach((failure) => {
      report += `  ${failure}\n`;
    });
    report += '\n';
  }

  report += '='.repeat(80) + '\n';

  return { report, hasFailures: failures.length > 0 };
}

function main() {
  const resultsPath = process.argv[2] || './test-results/benchmark-results.json';
  const outputPath = process.argv[3] || './benchmark-check-report.txt';

  console.log('🔍 Checking performance thresholds...\n');

  const results = loadBenchmarkResults(resultsPath);
  const { report, hasFailures } = generateReport(results);

  // 保存报告
  fs.writeFileSync(outputPath, report);
  console.log(report);
  console.log(`\n📝 Report saved to: ${outputPath}`);

  // 输出 GitHub Actions 注释（如果是在 CI 环境中）
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `report<<EOF\n${report}\nEOF`);
  }

  // 如果有失败，返回非零退出码
  if (hasFailures) {
    console.log('\n❌ Performance check failed!');
    process.exit(1);
  }

  console.log('\n✅ All performance checks passed!');
  process.exit(0);
}

main();
