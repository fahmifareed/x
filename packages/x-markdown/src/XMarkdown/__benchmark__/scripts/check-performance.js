#!/usr/bin/env node
/**
 * Performance Threshold Check Script
 * 检查 benchmark 结果是否满足性能阈值要求
 */

const fs = require('fs');
const path = require('path');

// 性能阈值配置（根据实际情况调整）
const PERFORMANCE_THRESHOLDS = {
  'x-markdown': {
    // 短文本性能要求
    short: {
      maxDuration: 500, // 最大渲染时长 (ms)
      minAvgFPS: 55, // 最小平均 FPS
      maxStdDevFPS: 15, // 最大 FPS 标准差
      maxMemoryDelta: 5, // 最大内存增量 (MB)
    },
    // 中文本性能要求
    medium: {
      maxDuration: 2000,
      minAvgFPS: 50,
      maxStdDevFPS: 12,
      maxMemoryDelta: 10,
    },
    // 长文本性能要求
    long: {
      maxDuration: 8000,
      minAvgFPS: 45,
      maxStdDevFPS: 10,
      maxMemoryDelta: 20,
    },
  },
};

// 性能回归允许的最大降幅（百分比）
const MAX_REGRESSION_PERCENTAGE = 10;

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

function compareWithBaseline(currentResults, baselinePath) {
  if (!fs.existsSync(baselinePath)) {
    console.log('ℹ️  No baseline found, skipping regression check');
    return { regressions: [], improvements: [] };
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  const regressions = [];
  const improvements = [];

  // 创建当前结果映射
  const currentMap = new Map();
  currentResults.forEach((result) => {
    if (result.name === 'x-markdown') {
      const key = `${result.textType}`;
      currentMap.set(key, result);
    }
  });

  // 创建基线结果映射
  const baselineMap = new Map();
  baseline.forEach((result) => {
    if (result.name === 'x-markdown') {
      const key = `${result.textType}`;
      baselineMap.set(key, result);
    }
  });

  // 比较各项指标
  currentMap.forEach((current, key) => {
    const baseline = baselineMap.get(key);
    if (!baseline) return;

    // 检查性能回归（时长增加）
    const durationIncrease = ((current.duration - baseline.duration) / baseline.duration) * 100;
    if (durationIncrease > MAX_REGRESSION_PERCENTAGE) {
      regressions.push(
        `⚠️  ${key}: Duration increased by ${durationIncrease.toFixed(1)}% ` +
          `(${baseline.duration}ms → ${current.duration}ms)`,
      );
    } else if (durationIncrease < -MAX_REGRESSION_PERCENTAGE) {
      improvements.push(
        `✅ ${key}: Duration improved by ${Math.abs(durationIncrease).toFixed(1)}% ` +
          `(${baseline.duration}ms → ${current.duration}ms)`,
      );
    }

    // 检查内存回归
    const memoryIncrease =
      ((current.memoryDelta - baseline.memoryDelta) / baseline.memoryDelta) * 100;
    if (memoryIncrease > MAX_REGRESSION_PERCENTAGE && baseline.memoryDelta > 0) {
      regressions.push(
        `⚠️  ${key}: Memory delta increased by ${memoryIncrease.toFixed(1)}% ` +
          `(${baseline.memoryDelta}MB → ${current.memoryDelta}MB)`,
      );
    } else if (memoryIncrease < -MAX_REGRESSION_PERCENTAGE) {
      improvements.push(
        `✅ ${key}: Memory delta improved by ${Math.abs(memoryIncrease).toFixed(1)}% ` +
          `(${baseline.memoryDelta}MB → ${current.memoryDelta}MB)`,
      );
    }

    // 检查 FPS 回归
    const fpsDecrease = ((baseline.avgFPS - current.avgFPS) / baseline.avgFPS) * 100;
    if (fpsDecrease > MAX_REGRESSION_PERCENTAGE) {
      regressions.push(
        `⚠️  ${key}: Avg FPS decreased by ${fpsDecrease.toFixed(1)}% ` +
          `(${baseline.avgFPS} → ${current.avgFPS})`,
      );
    } else if (fpsDecrease < -MAX_REGRESSION_PERCENTAGE) {
      improvements.push(
        `✅ ${key}: Avg FPS improved by ${Math.abs(fpsDecrease).toFixed(1)}% ` +
          `(${baseline.avgFPS} → ${current.avgFPS})`,
      );
    }
  });

  return { regressions, improvements };
}

function generateReport(currentResults, baselinePath) {
  const { failures, warnings } = checkThresholds(currentResults);
  const { regressions, improvements } = compareWithBaseline(currentResults, baselinePath);

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

  // 显示改进
  if (improvements.length > 0) {
    report += '\n🎉 Performance Improvements:\n';
    improvements.forEach((improvement) => {
      report += `  ${improvement}\n`;
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

  // 显示回归
  if (regressions.length > 0) {
    report += '\n⚠️  Performance Regressions:\n';
    regressions.forEach((regression) => {
      report += `  ${regression}\n`;
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

  return { report, hasFailures: failures.length > 0, hasRegressions: regressions.length > 0 };
}

function main() {
  const resultsPath = process.argv[2] || './test-results/benchmark-results.json';
  const baselinePath = process.argv[3] || './benchmark-baseline.json';
  const outputPath = process.argv[4] || './benchmark-check-report.txt';

  console.log('🔍 Checking performance thresholds...\n');

  const results = loadBenchmarkResults(resultsPath);
  const { report, hasFailures, hasRegressions } = generateReport(results, baselinePath);

  // 保存报告
  fs.writeFileSync(outputPath, report);
  console.log(report);
  console.log(`\n📝 Report saved to: ${outputPath}`);

  // 输出 GitHub Actions 注释（如果是在 CI 环境中）
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `report<<EOF\n${report}\nEOF`);
  }

  // 如果有失败或回归，返回非零退出码
  if (hasFailures || hasRegressions) {
    console.log('\n❌ Performance check failed!');
    process.exit(1);
  }

  console.log('\n✅ All performance checks passed!');
  process.exit(0);
}

main();
