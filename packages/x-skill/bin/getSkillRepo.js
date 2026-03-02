"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var fs = _interopRequireWildcard(require("fs"));
var https = _interopRequireWildcard(require("https"));
var os = _interopRequireWildcard(require("os"));
var path = _interopRequireWildcard(require("path"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class SkillLoader {
  githubOwner;
  githubRepo;
  tempDir;
  cacheDir;
  constructor(options = {}) {
    this.githubOwner = options.githubOwner || 'ant-design';
    this.githubRepo = options.githubRepo || 'x';
    this.tempDir = options.tempDir || path.join(os.tmpdir(), 'x-skill-temp');
    this.cacheDir = options.cacheDir || path.join(os.tmpdir(), 'x-skill-cache');
  }
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        headers: {
          'User-Agent': 'X-Skill-Loader',
          Accept: 'application/vnd.github.v3+json',
          ...options.headers
        }
      };

      // 添加GitHub token支持
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `token ${githubToken}`
        };
      }
      https.get(url, requestOptions, res => {
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
            https.get(res.headers.location, redirectOptions, res2 => {
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
          } else {
            if (res.statusCode === 403) {
              reject(new Error(`GitHub API access denied: ${res.statusMessage}. Please use classic personal access token instead of fine-grained token`));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          }
        });
      }).on('error', reject);
    });
  }
  async downloadFile(url) {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          https.get(res.headers.location, res2 => {
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
          const filePath = path.join(destPath, item.name);
          fs.writeFileSync(filePath, fileContent);
        } else if (item.type === 'dir') {
          const subDirPath = path.join(destPath, item.name);
          if (!fs.existsSync(subDirPath)) {
            fs.mkdirSync(subDirPath, {
              recursive: true
            });
          }
          await this.downloadDirectory(item.url, subDirPath);
        }
      }
    } catch (_error) {
      // Fallback: try to download individual files we know should exist
      const filesToTry = ['SKILL.md', 'index.js', 'package.json'];
      for (const file of filesToTry) {
        try {
          const fileUrl = `${url}/${file}`;
          const fileContent = await this.downloadFile(fileUrl);
          const filePath = path.join(destPath, file);
          fs.writeFileSync(filePath, fileContent);
        } catch (_e) {
          // Skip files that don't exist
        }
      }
    }
  }
  async downloadSkillFromGitHub(skillName, version = 'latest', language = 'en') {
    try {
      // 获取最新标签
      const tag = version === 'latest' ? await this.getLatestTag() : version;
      const basePath = language === 'zh' ? 'packages/x-skill/skills-zh' : 'packages/x-skill/skills';
      const baseUrl = `https://raw.githubusercontent.com/${this.githubOwner}/${this.githubRepo}/${tag}/${basePath}`;
      const skillUrl = `${baseUrl}/${skillName}`;

      // Create temp directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, {
          recursive: true
        });
      }
      const skillTempDir = path.join(this.tempDir, skillName);
      if (!fs.existsSync(skillTempDir)) {
        fs.mkdirSync(skillTempDir, {
          recursive: true
        });
      }

      // Download skill files
      await this.downloadDirectory(skillUrl, skillTempDir);
      return skillTempDir;
    } catch (error) {
      throw new Error(`Failed to download skill ${skillName}: ${error.message}`);
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
          const skillMdPath = path.join(skillTempDir, 'SKILL.md');
          if (fs.existsSync(skillMdPath)) {
            try {
              const content = fs.readFileSync(skillMdPath, 'utf-8');
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
      throw new Error(`Failed to load skills: ${error.message}`);
    }
  }
  async loadLocalSkills(language = 'zh') {
    // 获取当前脚本所在目录
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const packageDir = path.join(currentDir, '..');
    const skillsDir = language === 'zh' ? path.join(packageDir, 'skills-zh') : path.join(packageDir, 'skills');
    try {
      const skillDirs = fs.readdirSync(skillsDir, {
        withFileTypes: true
      }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
      return skillDirs.map(skillName => {
        const skillPath = path.join(skillsDir, skillName);
        let description = '';
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          try {
            const content = fs.readFileSync(skillMdPath, 'utf-8');
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