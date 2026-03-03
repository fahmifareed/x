import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

interface SkillLoaderOptions {
  githubOwner?: string;
  githubRepo?: string;
  tempDir?: string;
}

interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  url?: string;
}

interface GitHubTag {
  name: string;
  commit: {
    sha: string;
    url: string;
    commit?: {
      author?: {
        date: string;
      };
    };
  };
}

interface Skill {
  name: string;
  path: string;
  description: string;
  version: string;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

class SkillLoader {
  private githubOwner: string;
  private githubRepo: string;
  private tempDir: string;

  constructor(options: SkillLoaderOptions = {}) {
    this.githubOwner = options.githubOwner || 'ant-design';
    this.githubRepo = options.githubRepo || 'x';
    this.tempDir = options.tempDir || path.join(os.tmpdir(), 'x-skill-temp');
  }

  async makeRequest(url: string, options: { headers?: Record<string, string> } = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        headers: {
          'User-Agent': 'X-Skill-Loader',
          Accept: 'application/vnd.github.v3+json',
          ...options.headers,
        } as Record<string, string>,
        timeout: 60000, // 60秒超时
      };

      // 添加GitHub token支持
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `token ${githubToken}`,
        };
      }

      const req = https
        .get(url, requestOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch (_e) {
                reject(new Error('Failed to parse JSON response'));
              }
            } else if (res.statusCode === 302 || res.statusCode === 301) {
              // Follow redirect
              const redirectOptions = { ...requestOptions };
              const redirectReq = https
                .get(res.headers.location!, redirectOptions, (res2) => {
                  let data2 = '';
                  res2.on('data', (chunk) => (data2 += chunk));
                  res2.on('end', () => {
                    if (res2.statusCode && res2.statusCode >= 200 && res2.statusCode < 300) {
                      try {
                        resolve(JSON.parse(data2));
                      } catch (_e) {
                        reject(new Error('Failed to parse JSON response'));
                      }
                    } else {
                      reject(new Error(`HTTP ${res2.statusCode}: ${res2.statusMessage}`));
                    }
                  });
                })
                .on('error', reject);

              // 设置重定向请求的超时
              redirectReq.setTimeout(60000, () => {
                redirectReq.destroy();
                reject(new Error('Request timeout after 60 seconds'));
              });
            } else {
              if (res.statusCode === 403) {
                reject(
                  new Error(
                    `GitHub API access denied: ${res.statusMessage}. Please use classic personal access token instead of fine-grained token`,
                  ),
                );
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
              }
            }
          });
        })
        .on('error', reject);

      // 设置超时
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Request timeout after 60 seconds'));
      });
    });
  }

  async downloadFile(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            // Follow redirect
            https
              .get(res.headers.location!, (res2) => {
                let data = '';
                res2.on('data', (chunk) => (data += chunk));
                res2.on('end', () => resolve(data));
              })
              .on('error', reject);
            return;
          }

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        })
        .on('error', reject);
    });
  }

  async downloadDirectory(url: string, destPath: string): Promise<void> {
    try {
      // 构建正确的GitHub API URL
      let apiUrl: string;

      if (url.includes('raw.githubusercontent.com')) {
        // 转换raw URL到GitHub API URL
        const match = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
        if (match) {
          const [, owner, repo, ref, path] = match;
          apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
          if (ref !== 'main' && ref !== 'master') {
            apiUrl += `?ref=${ref}`;
          }
        } else {
          throw new Error('Invalid raw GitHub URL format');
        }
      } else if (url.includes('api.github.com')) {
        // 已经是GitHub API URL
        apiUrl = url;
      } else {
        throw new Error('Unsupported URL format');
      }

      const contents = (await this.makeRequest(apiUrl)) as GitHubContent[];

      for (const item of contents) {
        if (item.type === 'file') {
          const fileContent = await this.downloadFile(item.download_url!);
          const filePath = path.join(destPath, item.name);
          fs.writeFileSync(filePath, fileContent);
        } else if (item.type === 'dir') {
          const subDirPath = path.join(destPath, item.name);
          if (!fs.existsSync(subDirPath)) {
            fs.mkdirSync(subDirPath, { recursive: true });
          }
          await this.downloadDirectory(item.url!, subDirPath);
        }
      }
    } catch (_error) {
      // 远程下载失败时，直接抛出错误，让上层处理兜底逻辑
      throw new Error(`Failed to download directory from remote: ${_error}`);
    }
  }

  async downloadSkillFromGitHub(
    skillName: string,
    version = 'latest',
    language = 'en',
  ): Promise<string> {
    // Create temp directory
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const skillTempDir = path.join(this.tempDir, skillName);
    if (!fs.existsSync(skillTempDir)) {
      fs.mkdirSync(skillTempDir, { recursive: true });
    }

    try {
      // 获取最新标签
      const tag = version === 'latest' ? await this.getLatestTag() : version;
      const basePath = language === 'zh' ? 'packages/x-skill/skills-zh' : 'packages/x-skill/skills';

      // 使用GitHub API URL
      const apiUrl = `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/contents/${basePath}/${skillName}?ref=${tag}`;

      // Download skill files
      await this.downloadDirectory(apiUrl, skillTempDir);

      return skillTempDir;
    } catch (error) {
      console.warn(
        `Failed to download skill ${skillName} from remote: ${(error as Error).message}`,
      );
      console.warn('Using local skill files instead...');

      // 使用本地技能文件夹作为兜底
      const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
      const packageDir = path.join(currentDir, '..');
      const skillsDir =
        language === 'zh'
          ? path.join(packageDir, 'skills-zh', skillName)
          : path.join(packageDir, 'skills', skillName);

      if (!fs.existsSync(skillsDir)) {
        throw new Error(`Local skill directory not found: ${skillsDir}`);
      }

      // 复制本地文件夹到目标位置
      this.copyDirectorySync(skillsDir, skillTempDir);
      return skillTempDir;
    }
  }

  async getLatestTag(): Promise<string> {
    try {
      const tags = (await this.makeRequest(
        `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/tags`,
      )) as GitHubTag[];

      // 语义化版本号比较函数
      const compareVersions = (a: GitHubTag, b: GitHubTag): number => {
        const parseVersion = (version: string): ParsedVersion => {
          const cleanVersion = version.replace(/^v/, '');
          const parts = cleanVersion.split('-')[0].split('.');
          return {
            major: parseInt(parts[0] || '0', 10),
            minor: parseInt(parts[1] || '0', 10),
            patch: parseInt(parts[2] || '0', 10),
            prerelease: cleanVersion.includes('-') ? cleanVersion.split('-')[1] : null,
          };
        };

        const vA = parseVersion(a.name);
        const vB = parseVersion(b.name);

        if (vA.major !== vB.major) return vB.major - vA.major;
        if (vA.minor !== vB.minor) return vB.minor - vA.minor;
        if (vA.patch !== vB.patch) return vB.patch - vA.patch;

        if (!vA.prerelease && vB.prerelease) return -1;
        if (vA.prerelease && !vB.prerelease) return 1;
        if (vA.prerelease && vB.prerelease) {
          return vA.prerelease.localeCompare(vB.prerelease);
        }

        return 0;
      };

      // 过滤有效的版本标签
      const validVersions = tags.filter((tag) => {
        const name = tag.name;
        const versionRegex = /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/;
        return versionRegex.test(name);
      });

      if (validVersions.length > 0) {
        validVersions.sort(compareVersions);
        return validVersions[0].name;
      }

      // 如果没有有效的版本标签，使用最新的标签（即使不是语义化版本）
      if (tags.length > 0) {
        tags.sort(
          (a, b) =>
            new Date(b.commit?.commit?.author?.date || 0).getTime() -
            new Date(a.commit?.commit?.author?.date || 0).getTime(),
        );
        return tags[0].name;
      }
      return 'main';
    } catch (error) {
      console.error('Failed to fetch tags:', (error as Error).message);
      // 在错误情况下，尝试使用 main 分支作为最后的 fallback
      return 'main';
    }
  }

  async loadSkills(version = 'latest', language = 'en'): Promise<Skill[]> {
    try {
      const tag = version === 'latest' ? await this.getLatestTag() : version;
      const basePath = language === 'zh' ? 'packages/x-skill/skills-zh' : 'packages/x-skill/skills';
      const apiUrl = `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/contents/${basePath}?ref=${tag}`;
      const contents = (await this.makeRequest(apiUrl)) as GitHubContent[];
      const skillDirs = contents.filter((item) => item.type === 'dir').map((item) => item.name);

      const skills: Skill[] = [];

      for (const skillName of skillDirs) {
        try {
          const skillTempDir = await this.downloadSkillFromGitHub(skillName, version, language);
          let description = '';
          const skillMdPath = path.join(skillTempDir, 'SKILL.md');

          if (fs.existsSync(skillMdPath)) {
            try {
              const content = fs.readFileSync(skillMdPath, 'utf-8');
              const descMatch =
                content.match(/^description:\s*(.*)$/m) || content.match(/^#\s*(.*)$/m);
              description = descMatch ? descMatch[1].trim() : '';
              if (
                !description ||
                description === '-' ||
                description === '---' ||
                description === skillName
              ) {
                description = '';
              }
            } catch (_e) {
              description = '';
            }
          }

          skills.push({
            name: skillName,
            path: skillTempDir,
            description: description || skillName,
            version: tag,
          });
        } catch (error) {
          console.warn(`Skipping skill ${skillName}: ${(error as Error).message}`);
        }
      }

      if (skills.length === 0) {
        throw new Error('No available skills found');
      }

      return skills;
    } catch (error) {
      console.warn(`Failed to load skills from remote: ${(error as Error).message}`);
      console.warn('Falling back to local skills...');

      // 兜底逻辑：远程失败时使用本地文件
      try {
        return await this.loadLocalSkills(language);
      } catch (localError) {
        throw new Error(
          `Failed to load skills from both remote and local: ${(localError as Error).message}`,
        );
      }
    }
  }

  async loadLocalSkills(language = 'zh'): Promise<Skill[]> {
    // 获取当前脚本所在目录
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const packageDir = path.join(currentDir, '..');

    const skillsDir =
      language === 'zh' ? path.join(packageDir, 'skills-zh') : path.join(packageDir, 'skills');

    try {
      const skillDirs = fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      return skillDirs.map((skillName) => {
        const skillPath = path.join(skillsDir, skillName);
        let description = '';
        const skillMdPath = path.join(skillPath, 'SKILL.md');

        if (fs.existsSync(skillMdPath)) {
          try {
            const content = fs.readFileSync(skillMdPath, 'utf-8');
            const descMatch =
              content.match(/^description:\s*(.*)$/m) || content.match(/^#\s*(.*)$/m);
            description = descMatch ? descMatch[1].trim() : '';
            if (
              !description ||
              description === '-' ||
              description === '---' ||
              description === skillName
            ) {
              description = '';
            }
          } catch (_e) {
            description = '';
          }
        }

        return {
          name: skillName,
          path: skillPath,
          description: description || skillName,
          version: 'local',
        };
      });
    } catch (error) {
      throw new Error(`Failed to load local skills: ${(error as Error).message}`);
    }
  }

  private copyDirectorySync(src: string, dest: string): void {
    // 先移除目标文件夹（如果存在），确保干净复制
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }

    // 创建目标文件夹
    fs.mkdirSync(dest, { recursive: true });

    const items = fs.readdirSync(src, { withFileTypes: true });

    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);

      if (item.isDirectory()) {
        this.copyDirectorySync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async listVersions(): Promise<string[]> {
    try {
      const tags = (await this.makeRequest(
        `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/tags`,
      )) as GitHubTag[];

      if (tags.length === 0) {
        throw new Error('No version tags found');
      }

      // 语义化版本号比较函数
      const compareVersions = (a: GitHubTag, b: GitHubTag): number => {
        const parseVersion = (version: string): ParsedVersion => {
          const cleanVersion = version.replace(/^v/, '');
          const parts = cleanVersion.split('-')[0].split('.');
          return {
            major: parseInt(parts[0] || '0', 10),
            minor: parseInt(parts[1] || '0', 10),
            patch: parseInt(parts[2] || '0', 10),
            prerelease: cleanVersion.includes('-') ? cleanVersion.split('-')[1] : null,
          };
        };

        const vA = parseVersion(a.name);
        const vB = parseVersion(b.name);

        if (vA.major !== vB.major) return vB.major - vA.major;
        if (vA.minor !== vB.minor) return vB.minor - vA.minor;
        if (vA.patch !== vB.patch) return vB.patch - vA.patch;

        if (!vA.prerelease && vB.prerelease) return -1;
        if (vA.prerelease && !vB.prerelease) return 1;
        if (vA.prerelease && vB.prerelease) {
          return vA.prerelease.localeCompare(vB.prerelease);
        }

        return 0;
      };

      // 过滤有效的版本标签并排序
      const validVersions = tags.filter((tag) => {
        const name = tag.name;
        const versionRegex = /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/;
        return versionRegex.test(name);
      });

      if (validVersions.length > 0) {
        validVersions.sort(compareVersions);
        return validVersions.map((tag) => tag.name);
      }

      return tags.map((tag) => tag.name); // 如果没有有效的版本标签，返回所有标签
    } catch (error) {
      throw new Error(`Failed to fetch tags: ${(error as Error).message}`);
    }
  }
}

export default SkillLoader;
