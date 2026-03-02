#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

console.log('=== 调试信息 ===');
console.log('process.stdin.isTTY:', process.stdin.isTTY);
console.log('process.stdout.isTTY:', process.stdout.isTTY);
console.log('process.env.SHELL:', process.env.SHELL);
console.log('process.argv:', process.argv);
console.log('=== 开始测试 ===');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function questionAsync(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function test() {
  try {
    console.log('测试1: 简单输入');
    const answer1 = await questionAsync('请输入测试1: ');
    console.log('你输入了:', answer1);

    console.log('测试2: 选择测试');
    const answer2 = await questionAsync('请选择 (1/2/3): ');
    console.log('你选择了:', answer2);

    rl.close();
  } catch (error) {
    console.error('错误:', error);
    rl.close();
  }
}

test();
