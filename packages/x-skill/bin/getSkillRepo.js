"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _https = _interopRequireDefault(require("https"));
var _os = _interopRequireDefault(require("os"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class SkillLoader {
  githubOwner;
  githubRepo;
  tempDir;
  constructor(options = {}) {
    this.githubOwner = options.githubOwner || 'ant-design';
    this.githubRepo = options.githubRepo || 'x';
    this.tempDir = options.tempDir || _path.default.join(_os.default.tmpdir(), 'x-skill-temp');
  }
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        headers: {
          'User-Agent': 'X-Skill-Loader',
          Accept: 'application/vnd.github.v3+json',
          ...options.headers
        },
        timeout: 60000 // 60秒超时
      };

      // 添加GitHub token支持
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `token ${githubToken}`
        };
      }
      const req = _https.default.get(url, requestOptions, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (_e) {
              reject(new Error('Failed to parse JSON response'));
            }
          } else if (res.statusCode === 302 || res.statusCode === 301) {
            // Follow redirect
            const redirectOptions = {
              ...requestOptions
            };
            const redirectReq = _https.default.get(res.headers.location, redirectOptions, res2 => {
              let data2 = '';
              res2.on('data', chunk => data2 += chunk);
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
            }).on('error', reject);

            // 设置重定向请求的超时
            redirectReq.setTimeout(60000, () => {
              redirectReq.destroy();
              reject(new Error('Request timeout after 60 seconds'));
            });
          } else {
            if (res.statusCode === 403) {
              reject(new Error(`GitHub API access denied: ${res.statusMessage}. Please use classic personal access token instead of fine-grained token`));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          }
        });
      }).on('error', reject);

      // 设置超时
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Request timeout after 60 seconds'));
      });
    });
  }
  async downloadFile(url) {
    return new Promise((resolve, reject) => {
      _https.default.get(url, res => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          _https.default.get(res.headers.location, res2 => {
            let data = '';
            res2.on('data', chunk => data += chunk);
            res2.on('end', () => resolve(data));
          }).on('error', reject);
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }
  async downloadDirectory(url, destPath) {
    try {
      // First, try to get the directory listing
      const apiUrl = url.replace('raw.githubusercontent.com', 'api.github.com/repos').replace('/skills/', '/contents/packages/x-skill/skills/');
      const contents = await this.makeRequest(apiUrl);
      for (const item of contents) {
        if (item.type === 'file') {
          const fileContent = await this.downloadFile(item.download_url);
          const filePath = _path.default.join(destPath, item.name);
          _fs.default.writeFileSync(filePath, fileContent);
        } else if (item.type === 'dir') {
          const subDirPath = _path.default.join(destPath, item.name);
          if (!_fs.default.existsSync(subDirPath)) {
            _fs.default.mkdirSync(subDirPath, {
              recursive: true
            });
          }
          await this.downloadDirectory(item.url, subDirPath);
        }
      }
    } catch (_error) {
      // 远程下载失败时，直接抛出错误，让上层处理兜底逻辑
      throw new Error(`Failed to download directory from remote: ${_error}`);
    }
  }
  async downloadSkillFromGitHub(skillName, version = 'latest', language = 'en') {
    // Create temp directory
    if (!_fs.default.existsSync(this.tempDir)) {
      _fs.default.mkdirSync(this.tempDir, {
        recursive: true
      });
    }
    const skillTempDir = _path.default.join(this.tempDir, skillName);
    if (!_fs.default.existsSync(skillTempDir)) {
      _fs.default.mkdirSync(skillTempDir, {
        recursive: true
      });
    }
    try {
      // 获取最新标签
      const tag = version === 'latest' ? await this.getLatestTag() : version;
      const basePath = language === 'zh' ? 'packages/x-skill/skills-zh' : 'packages/x-skill/skills';
      const baseUrl = `https://raw.githubusercontent.com/${this.githubOwner}/${this.githubRepo}/${tag}/${basePath}`;
      const skillUrl = `${baseUrl}/${skillName}`;

      // Download skill files
      await this.downloadDirectory(skillUrl, skillTempDir);
      return skillTempDir;
    } catch (error) {
      console.warn(`Failed to download skill ${skillName} from remote: ${error.message}`);
      console.warn('Using local skill files instead...');

      // 使用本地技能文件夹作为兜底
      const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
      const packageDir = _path.default.join(currentDir, '..');
      const skillsDir = language === 'zh' ? _path.default.join(packageDir, 'skills-zh', skillName) : _path.default.join(packageDir, 'skills', skillName);
      if (!_fs.default.existsSync(skillsDir)) {
        throw new Error(`Local skill directory not found: ${skillsDir}`);
      }

      // 复制本地文件夹到目标位置
      this.copyDirectorySync(skillsDir, skillTempDir);
      return skillTempDir;
    }
  }
  async getLatestTag() {
    try {
      const tags = await this.makeRequest(`https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/tags`);

      // 语义化版本号比较函数
      const compareVersions = (a, b) => {
        const parseVersion = version => {
          const cleanVersion = version.replace(/^v/, '');
          const parts = cleanVersion.split('-')[0].split('.');
          return {
            major: parseInt(parts[0] || '0', 10),
            minor: parseInt(parts[1] || '0', 10),
            patch: parseInt(parts[2] || '0', 10),
            prerelease: cleanVersion.includes('-') ? cleanVersion.split('-')[1] : null
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
      const validVersions = tags.filter(tag => {
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
        tags.sort((a, b) => new Date(b.commit?.commit?.author?.date || 0).getTime() - new Date(a.commit?.commit?.author?.date || 0).getTime());
        return tags[0].name;
      }
      return 'main';
    } catch (error) {
      console.error('Failed to fetch tags:', error.message);
      // 在错误情况下，尝试使用 main 分支作为最后的 fallback
      return 'main';
    }
  }
  async loadSkills(version = 'latest', language = 'en') {
    try {
      const tag = version === 'latest' ? await this.getLatestTag() : version;
      const basePath = language === 'zh' ? 'packages/x-skill/skills-zh' : 'packages/x-skill/skills';
      const apiUrl = `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/contents/${basePath}?ref=${tag}`;
      const contents = await this.makeRequest(apiUrl);
      const skillDirs = contents.filter(item => item.type === 'dir').map(item => item.name);
      const skills = [];
      for (const skillName of skillDirs) {
        try {
          const skillTempDir = await this.downloadSkillFromGitHub(skillName, version, language);
          let description = '';
          const skillMdPath = _path.default.join(skillTempDir, 'SKILL.md');
          if (_fs.default.existsSync(skillMdPath)) {
            try {
              const content = _fs.default.readFileSync(skillMdPath, 'utf-8');
              const descMatch = content.match(/^description:\s*(.*)$/m) || content.match(/^#\s*(.*)$/m);
              description = descMatch ? descMatch[1].trim() : '';
              if (!description || description === '-' || description === '---' || description === skillName) {
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
            version: tag
          });
        } catch (error) {
          console.warn(`Skipping skill ${skillName}: ${error.message}`);
        }
      }
      if (skills.length === 0) {
        throw new Error('No available skills found');
      }
      return skills;
    } catch (error) {
      console.warn(`Failed to load skills from remote: ${error.message}`);
      console.warn('Falling back to local skills...');

      // 兜底逻辑：远程失败时使用本地文件
      try {
        return await this.loadLocalSkills(language);
      } catch (localError) {
        throw new Error(`Failed to load skills from both remote and local: ${localError.message}`);
      }
    }
  }
  async loadLocalSkills(language = 'zh') {
    // 获取当前脚本所在目录
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const packageDir = _path.default.join(currentDir, '..');
    const skillsDir = language === 'zh' ? _path.default.join(packageDir, 'skills-zh') : _path.default.join(packageDir, 'skills');
    try {
      const skillDirs = _fs.default.readdirSync(skillsDir, {
        withFileTypes: true
      }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
      return skillDirs.map(skillName => {
        const skillPath = _path.default.join(skillsDir, skillName);
        let description = '';
        const skillMdPath = _path.default.join(skillPath, 'SKILL.md');
        if (_fs.default.existsSync(skillMdPath)) {
          try {
            const content = _fs.default.readFileSync(skillMdPath, 'utf-8');
            const descMatch = content.match(/^description:\s*(.*)$/m) || content.match(/^#\s*(.*)$/m);
            description = descMatch ? descMatch[1].trim() : '';
            if (!description || description === '-' || description === '---' || description === skillName) {
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
          version: 'local'
        };
      });
    } catch (error) {
      throw new Error(`Failed to load local skills: ${error.message}`);
    }
  }
  copyDirectorySync(src, dest) {
    // 先移除目标文件夹（如果存在），确保干净复制
    if (_fs.default.existsSync(dest)) {
      _fs.default.rmSync(dest, {
        recursive: true,
        force: true
      });
    }

    // 创建目标文件夹
    _fs.default.mkdirSync(dest, {
      recursive: true
    });
    const items = _fs.default.readdirSync(src, {
      withFileTypes: true
    });
    for (const item of items) {
      const srcPath = _path.default.join(src, item.name);
      const destPath = _path.default.join(dest, item.name);
      if (item.isDirectory()) {
        this.copyDirectorySync(srcPath, destPath);
      } else {
        _fs.default.copyFileSync(srcPath, destPath);
      }
    }
  }
  async listVersions() {
    try {
      const tags = await this.makeRequest(`https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/tags`);
      if (tags.length === 0) {
        throw new Error('No version tags found');
      }

      // 语义化版本号比较函数
      const compareVersions = (a, b) => {
        const parseVersion = version => {
          const cleanVersion = version.replace(/^v/, '');
          const parts = cleanVersion.split('-')[0].split('.');
          return {
            major: parseInt(parts[0] || '0', 10),
            minor: parseInt(parts[1] || '0', 10),
            patch: parseInt(parts[2] || '0', 10),
            prerelease: cleanVersion.includes('-') ? cleanVersion.split('-')[1] : null
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
      const validVersions = tags.filter(tag => {
        const name = tag.name;
        const versionRegex = /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/;
        return versionRegex.test(name);
      });
      if (validVersions.length > 0) {
        validVersions.sort(compareVersions);
        return validVersions.map(tag => tag.name);
      }
      return tags.map(tag => tag.name); // 如果没有有效的版本标签，返回所有标签
    } catch (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
  }
}
var _default = exports.default = SkillLoader;