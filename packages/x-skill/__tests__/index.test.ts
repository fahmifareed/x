import { SkillInstaller } from '../src/index';

// 设置测试环境
process.env.NODE_ENV = 'test';

// 模拟技能数据
const mockSkills = [
  {
    name: 'use-x-chat',
    description: '专注讲解如何使用 useXChat Hook，包括自定义 Provider 的集成、消息管理、错误处理等',
    version: 'latest',
  },
  {
    name: 'x-chat-provider',
    description:
      '专注于自定义 Chat Provider 的实现，帮助将任意流式接口适配为 Ant Design X 标准格式',
    version: 'latest',
  },
  {
    name: 'x-request',
    description: '专注讲解 XRequest 的实际配置和使用，基于官方文档提供准确的配置说明',
    version: 'latest',
  },
];

// 模拟 GitHub API 响应
const mockGitHubResponses = {
  skillsContents: [
    {
      name: 'use-x-chat',
      path: 'packages/x-skill/skills/use-x-chat',
      type: 'dir',
    },
    {
      name: 'x-chat-provider',
      path: 'packages/x-skill/skills/x-chat-provider',
      type: 'dir',
    },
    {
      name: 'x-request',
      path: 'packages/x-skill/skills/x-request',
      type: 'dir',
    },
  ],
  tags: [
    {
      name: 'v2.2.2-beta.8',
      commit: {
        sha: 'mock-sha-123',
        commit: {
          author: {
            date: '2024-03-01T00:00:00Z',
          },
        },
      },
    },
  ],
};

// 模拟 https 模块
jest.mock('https', () => ({
  get: jest.fn((url: string, _options?: any, callback?: any) => {
    console.log(`[MOCK] HTTPS GET: ${url}`);

    let responseData: any;
    const statusCode = 200;

    // 根据 URL 返回不同的模拟数据
    if (url.includes('/contents/packages/x-skill/skills')) {
      responseData = mockGitHubResponses.skillsContents;
    } else if (url.includes('/tags')) {
      responseData = mockGitHubResponses.tags;
    } else {
      responseData = [];
    }

    // 创建模拟的响应对象
    const mockResponse = {
      statusCode,
      statusMessage: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-remaining': '4999',
      },
      on: jest.fn((event: string, handler: any) => {
        if (event === 'data') {
          handler(Buffer.from(JSON.stringify(responseData)));
        } else if (event === 'end') {
          handler();
        }
      }),
    };

    // 如果是回调方式调用
    if (callback) {
      callback(mockResponse);
    }

    // 返回模拟的请求对象
    return {
      on: jest.fn(),
    };
  }),
}));

// 模拟 fs 模块的部分方法
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn((path: string) => {
      // 模拟技能目录存在
      if (path.includes('skills') && !path.includes('temp') && !path.includes('cache')) {
        return true;
      }
      return actualFs.existsSync(path);
    }),
    readdirSync: jest.fn((path: string, _options?: any) => {
      // 模拟技能目录内容
      if (path.includes('skills')) {
        return mockSkills.map((skill) => ({
          name: skill.name,
          isDirectory: () => true,
        }));
      }
      return actualFs.readdirSync(path);
    }),
    readFileSync: jest.fn((path: string, encoding?: string) => {
      // 模拟 SKILL.md 文件内容
      if (path.includes('SKILL.md')) {
        const skillName = path.split('/').slice(-2, -1)[0];
        const skill = mockSkills.find((s) => s.name === skillName);
        return `---
name: ${skill?.name || skillName}
version: 2.2.2-beta.8
description: ${skill?.description || '技能描述'}
---

# 技能文档

这是一个测试技能文档。`;
      }
      return actualFs.readFileSync(path, encoding);
    }),
  };
});

describe('SkillInstaller 测试套件', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.clearAllTimers();
  });

  describe('run', () => {
    test('整体执行-全局安装', async () => {
      // 模拟用户输入序列
      const mockQuestionAsync = jest
        .fn()
        .mockResolvedValueOnce('1') // 选择中文
        .mockResolvedValueOnce('1,2,3') // 选择所有技能
        .mockResolvedValueOnce('1') // 选择软件
        .mockResolvedValueOnce('1'); // 选择安装类型

      const installer = new SkillInstaller();

      // 替换方法为模拟实现
      installer.questionAsync = mockQuestionAsync;

      // 运行测试
      await expect(installer.run()).resolves.toBeUndefined();

      // 验证技能加载成功
      expect(installer['skills']).toHaveLength(3);
      expect(installer['skills'][0].name).toBe('use-x-chat');
      expect(installer['skills'][1].name).toBe('x-chat-provider');
      expect(installer['skills'][2].name).toBe('x-request');
    }, 30000);
    test('安装错误处理', async () => {
      const installer = new SkillInstaller();

      // 模拟用户输入
      installer.questionAsync = jest
        .fn()
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('1');

      // 模拟安装失败
      const mockInstall = jest.fn().mockRejectedValue(new Error('安装失败'));
      (installer as any).installSkills = mockInstall;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await installer.run();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    }, 30000);
  });
});
