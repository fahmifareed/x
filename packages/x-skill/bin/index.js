#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SkillInstaller = void 0;
var fs = _interopRequireWildcard(require("fs"));
var _ora = _interopRequireDefault(require("ora"));
var os = _interopRequireWildcard(require("os"));
var path = _interopRequireWildcard(require("path"));
var _progress = _interopRequireDefault(require("progress"));
var readline = _interopRequireWildcard(require("readline"));
var _getSkillRepo = _interopRequireDefault(require("./getSkillRepo"));
var _help = _interopRequireDefault(require("./help"));
var _index = require("./locale/index");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class SkillInstaller {
  skills = [];
  language = 'zh';
  messages;
  rl;
  skillConfig;
  skillLoader;
  helpManager;
  args;
  cacheDir;
  constructor() {
    this.messages = this.loadLocaleMessages();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.skillConfig = this.loadConfig();
    this.skillLoader = new _getSkillRepo.default({
      githubOwner: 'ant-design',
      githubRepo: 'x',
      tempDir: path.join(os.tmpdir(), 'x-skill-temp')
    });
    this.cacheDir = path.join(os.tmpdir(), 'x-skill-cache');
    this.helpManager = new _help.default(this.messages, this.language);

    // Parse command line arguments
    this.args = this.parseArgs();
  }
  colorize(text, color) {
    return this.helpManager.colorize(text, color);
  }
  questionAsync(question) {
    return new Promise((resolve, reject) => {
      if (!process.stdin.isTTY) {
        reject(new Error(this.getMessage('nonInteractiveEnv')));
        return;
      }
      if (this.rl.closed) {
        reject(new Error(this.getMessage('readlineClosed')));
        return;
      }

      // 确保stdout是TTY
      if (!process.stdout.isTTY) {
        reject(new Error(this.getMessage('stdoutNotTTY')));
        return;
      }
      this.rl.question(question, answer => {
        if (answer === null || answer === undefined) {
          reject(new Error(this.getMessage('inputEnded')));
        } else {
          resolve(answer);
        }
      });

      // Handle Ctrl+C gracefully
      this.rl.on('SIGINT', () => {
        console.log(`\n${this.colorize(this.getMessage('operationCanceled'), 'yellow')}`);
        this.rl.close();
        process.exit(0);
      });
    });
  }
  printSeparator() {
    this.helpManager.printSeparator();
  }
  parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
      tag: null,
      help: false,
      listVersions: false
    };
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if ((arg === '--tag' || arg === '-t') && i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.tag = args[i + 1];
        i++;
      } else if (arg === '--list-versions' || arg === '-l') {
        parsed.listVersions = true;
      } else if (arg === '--help' || arg === '-h') {
        parsed.help = true;
      }
    }
    return parsed;
  }
  init() {
    if (this.args.help) {
      this.showHelp();
      process.exit(0);
    }
    if (this.args.listVersions) {
      this.listVersions().then(() => process.exit(0));
      return;
    }
  }
  showHelp() {
    this.helpManager.showHelp();
  }
  loadConfig() {
    // 从 packages/x-skill 目录加载配置文件
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const configPath = path.join(currentDir, '..', '.skill.json');
    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(this.getMessage('configLoadError', {
        message: error.message
      }));
      process.exit(1);
    }
  }
  loadLocaleMessages() {
    try {
      return _index.messages.zh; // 默认返回中文消息
    } catch (error) {
      console.error(this.getMessage('localeLoadError', {
        message: error.message
      }));
      return _index.messages.zh;
    }
  }
  getCache(key) {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        return null;
      }
      const cacheFile = path.join(this.cacheDir, `${key}.json`);
      if (!fs.existsSync(cacheFile)) {
        return null;
      }
      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      if (Date.now() > cacheData.expires) {
        fs.unlinkSync(cacheFile);
        return null;
      }
      return cacheData.data;
    } catch (_error) {
      return null;
    }
  }
  setCache(key, data, ttlSeconds = 3600) {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, {
          recursive: true
        });
      }
      const cacheFile = path.join(this.cacheDir, `${key}.json`);
      const cacheData = {
        data,
        expires: Date.now() + ttlSeconds * 1000
      };
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
    } catch (_error) {
      // 缓存失败不影响主要功能
    }
  }
  clearCache(key) {
    try {
      const cacheFile = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }
    } catch (_error) {
      // 清除缓存失败不影响主要功能
    }
  }
  async listVersions() {
    try {
      const spinner = (0, _ora.default)(this.colorize(this.getMessage('fetchingVersions'), 'cyan')).start();
      const versions = await this.skillLoader.listVersions();
      spinner.stop();
      if (versions.length === 0) {
        console.log(`${this.colorize(this.getMessage('noVersionsFound'), 'yellow')}`);
        return;
      }
      console.log(`${this.colorize(this.getMessage('availableVersions'), 'green')}`);
      versions.forEach((version, index) => {
        const marker = index === 0 ? this.getMessage('latestMarker') : '';
        console.log(`  ${this.colorize(version, 'yellow')}${marker}`);
      });
    } catch (error) {
      console.error(`${this.colorize(this.getMessage('error'), 'red')} ${error.message}`);
    }
  }
  async loadSkills() {
    try {
      console.log(`${this.colorize(this.getMessage('fetchingSkills'), 'cyan')}`);
      const version = this.args.tag || 'latest';
      const skills = await this.skillLoader.loadSkills(version, this.language);
      this.skills = skills;

      // 缓存结果
      this.setCache(`skills_${skills[0]?.version || version}`, this.skills, 1800); // 缓存30分钟
    } catch (error) {
      if (error.message.includes('rate limit')) {
        console.error(`${this.colorize(this.getMessage('rateLimitError', {
          message: error.message
        }), 'red')}\n`);
        console.log(`${this.colorize(this.getMessage('info'), 'cyan')} ${this.getMessage('rateLimitHint')}`);
      } else {
        console.error(`${this.colorize(this.getMessage('githubFetchError', {
          message: error.message
        }), 'red')}`);
      }

      // Fallback to local skills if GitHub fails
      console.log(`${this.colorize(this.getMessage('usingLocalSkills'), 'yellow')}`);
      await this.loadLocalSkills();
      if (this.skills.length === 0) {
        console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('noLocalSkills'), 'yellow')}`);
      }
    }
  }
  async loadLocalSkills() {
    try {
      const skills = await this.skillLoader.loadLocalSkills(this.language);
      this.skills = skills;
    } catch (error) {
      console.error(this.getMessage('error'), error.message);
      process.exit(1);
    }
  }
  async askQuestion(question, options) {
    // 防止空选项数组导致的无限递归
    if (!options || options.length === 0) {
      console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('noSelection'), 'red')}`);
      return null;
    }
    console.log(`\n${this.colorize(`❓ ${question}`, 'cyan')}`);
    this.printSeparator();
    options.forEach((option, index) => {
      const number = this.colorize(`${index + 1}.`, 'yellow');
      console.log(`   ${number} ${option}`);
    });
    this.printSeparator();
    let attempts = 0;
    const maxAttempts = 3;
    console.log(this.colorize(`💡 ${this.getMessage('inputNumberTip')}`, 'dim'));
    while (attempts < maxAttempts) {
      try {
        const answer = await this.questionAsync(this.colorize('➤ ', 'green') + this.getMessage('pleaseSelectNumber'));
        if (!answer || answer.trim() === '') {
          console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('inputEmpty'), 'red')}`);
          attempts++;
          continue;
        }
        const index = parseInt(answer.trim(), 10) - 1;
        if (index >= 0 && index < options.length) {
          console.log(`\n${_index.emojis.check} ${this.getMessage('yourChoice')} ${this.colorize(options[index], 'green')}\n`);
          return options[index];
        }
        console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('invalidChoice'), 'red')}`);
        attempts++;
      } catch (error) {
        if (error.message.includes('Input stream ended') || error.message.includes('Readline interface is closed')) {
          console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('inputEnded'), 'red')}`);
          process.exit(1);
        }
        console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('error'), 'red')} ${error.message}`);
        attempts++;
      }
    }
    console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('maxAttemptsExceeded'), 'red')}`);
    process.exit(1);
  }
  async askMultipleChoice(question, options) {
    // 防止空选项数组导致的无限递归
    if (!options || options.length === 0) {
      console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('noSelection'), 'red')}`);
      return [];
    }
    console.log(`\n${this.colorize(`✨ ${question}`, 'cyan')}`);
    options.forEach((option, index) => {
      const checkbox = this.colorize('[ ]', 'dim');
      const number = this.colorize(`${index + 1}.`, 'yellow');
      console.log(`   ${checkbox} ${number} ${option}`);
    });
    console.log(''); // 添加空行让提示更清晰

    let attempts = 0;
    const maxAttempts = 3;
    console.log(this.colorize(`💡 ${this.getMessage('inputMultipleTip')}`, 'dim'));
    while (attempts < maxAttempts) {
      try {
        const answer = await this.questionAsync(this.colorize('➤ ', 'green') + this.getMessage('pleaseSelect'));
        if (!answer || answer.trim() === '') {
          console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('inputEmpty'), 'red')}`);
          attempts++;
          continue;
        }
        const indices = answer.trim().split(',').map(s => parseInt(s.trim(), 10) - 1).filter(i => !isNaN(i) && i >= 0 && i < options.length);
        const selected = indices.map(i => options[i]);
        if (selected.length > 0) {
          console.log(`\n${_index.emojis.check} ${this.getMessage('yourChoice')}`);
          selected.forEach(item => {
            console.log(`   ${this.colorize(`• ${item}`, 'green')}`);
          });
          return selected;
        }
        console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('invalidInput'), 'red')}`);
        attempts++;
      } catch (error) {
        if (error.message.includes('Input stream ended') || error.message.includes('Readline interface is closed')) {
          console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('inputEnded'), 'red')}`);
          process.exit(1);
        }
        console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('error'), 'red')} ${error.message}`);
        attempts++;
      }
    }
    console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('maxAttemptsExceeded'), 'red')}`);
    process.exit(1);
  }
  getMessage(key, replacements = {}) {
    let message = this.messages[key] || key;
    // Replace template variables
    Object.keys(replacements).forEach(placeholder => {
      message = message.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    });
    return message;
  }

  // Progress bar using progress library
  createProgressBar(total) {
    return new _progress.default(`  ${this.colorize(':bar', 'green')} ${this.colorize(':percent', 'cyan')} ${this.colorize(':current/:total', 'yellow')} ${this.colorize(':etas', 'magenta')} ${this.colorize('→', 'dim')} :text`, {
      total: total,
      complete: '█',
      incomplete: '░',
      width: 30
    });
  }
  async run() {
    try {
      await this.helpManager.printHeader();

      // Display version info if specified
      if (this.args.tag) {
        console.log(`${this.helpManager.colorize(this.getMessage('usingVersion', {
          version: this.args.tag
        }), 'cyan')}`);
      }

      // 短暂延迟以避免自动输入问题
      await new Promise(resolve => setTimeout(resolve, 100));

      // Language selection - bilingual display with dual language prompt
      this.helpManager.printLanguageSelection();
      let languageChoice;
      while (true) {
        const answer = await this.questionAsync(this.colorize(`${this.getMessage('selectLanguagePrompt')}: `, 'green'));
        const choice = answer.trim();
        if (choice === '1' || choice.toLowerCase() === 'zh') {
          console.log(`\n${_index.emojis.check} 你选择了中文\n`);
          languageChoice = '中文';
          break;
        }
        if (choice === '2' || choice.toLowerCase() === 'en') {
          console.log(`\n${_index.emojis.check} You selected English\n`);
          languageChoice = 'English';
          break;
        }
        console.log(`${_index.emojis.warning} ${this.colorize('无效选择，请重新输入 / Invalid choice, please try again', 'red')}`);
      }
      this.language = languageChoice === '中文' ? 'zh' : 'en';

      // Load skills from GitHub
      await this.loadSkills();
      const skillOptions = this.skills.map(skill => `${skill.name}${skill.description && skill.description !== skill.name ? ` - ${skill.description}` : ''}`);
      if (skillOptions.length === 0) {
        console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('noSkillsFound'), 'yellow')}`);
        return;
      }
      let selectedSkills = [];
      while (selectedSkills.length === 0) {
        selectedSkills = await this.askMultipleChoice(this.getMessage('selectSkills'), skillOptions);
        if (selectedSkills.length === 0) {
          console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('selectAtLeastOneSkill'), 'yellow')}`);
        }
      }
      const selectedSkillNames = selectedSkills.map(s => s.split(' - ')[0]);
      const softwareOptions = Object.entries(this.skillConfig.targets).filter(([_, config]) => config.enabled).map(([name]) => name);
      if (softwareOptions.length === 0) {
        console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('noSoftwareFound'), 'yellow')}`);
        return;
      }
      let selectedSoftwareList = [];
      while (selectedSoftwareList.length === 0) {
        selectedSoftwareList = await this.askMultipleChoice(this.getMessage('selectSoftware'), softwareOptions);
        if (selectedSoftwareList.length === 0) {
          console.log(`${_index.emojis.warning} ${this.colorize(this.getMessage('selectAtLeastOneSoftware'), 'yellow')}`);
        }
      }

      // Installation method selection
      const installTypeOptions = [this.getMessage('globalInstall'), this.getMessage('projectInstall')];
      let selectedInstallType = null;
      while (!selectedInstallType) {
        selectedInstallType = await this.askQuestion(this.getMessage('selectInstallType'), installTypeOptions);
      }
      const isGlobal = selectedInstallType === this.getMessage('globalInstall');

      // Installation process
      const totalSteps = selectedSoftwareList.length * selectedSkillNames.length;
      if (totalSteps > 0) {
        const progressBar = this.createProgressBar(totalSteps);
        const allTasks = [];
        for (const software of selectedSoftwareList) {
          for (const skillName of selectedSkillNames) {
            allTasks.push({
              skillName,
              software
            });
          }
        }
        for (const task of allTasks) {
          const {
            skillName,
            software
          } = task;
          try {
            await this.installSkills([skillName], software, isGlobal);
            progressBar.tick({
              text: `${skillName} -> ${software}`
            });
          } catch (installError) {
            console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('installError', {
              skill: skillName,
              error: installError.message
            }), 'red')}`);
            progressBar.tick({
              text: `${skillName} -> ${software} ${this.getMessage('installationFailed')}`
            });
          }
        }
      }
      // Completion animation
      this.helpManager.printCompletion(this.messages);
    } catch (error) {
      if (error.message.includes('Input stream ended') || error.message.includes('Readline interface is closed')) {
        console.error(`${_index.emojis.cross} ${this.colorize(this.getMessage('programInterrupted'), 'red')}`);
      } else {
        this.helpManager.printError(error, this.messages);
      }
    } finally {
      this.helpManager.printGoodbye(this.messages);
      if (this.rl && !this.rl.closed) {
        this.rl.close();
      }
    }
  }
  async installSkills(skillNames, software, isGlobal) {
    const targetConfig = this.skillConfig.targets[software];
    if (!targetConfig) {
      throw new Error(`Software ${software} not found in configuration`);
    }
    const targetPath = isGlobal ? targetConfig.paths.global : targetConfig.paths.project;
    const fullTargetPath = isGlobal ? path.join(os.homedir(), targetPath) : path.join(process.cwd(), targetPath);
    if (!fs.existsSync(fullTargetPath)) {
      fs.mkdirSync(fullTargetPath, {
        recursive: true
      });
    }
    for (const skillName of skillNames) {
      const skill = this.skills.find(s => s.name === skillName);
      if (!skill) {
        // Silently skip skills not found, no warning output
        continue;
      }
      const sourcePath = skill.path;
      const destPath = path.join(fullTargetPath, skillName);
      if (fs.existsSync(destPath)) {
        // Silently delete existing skills, no update notification
        fs.rmSync(destPath, {
          recursive: true,
          force: true
        });
      }
      this.copyDirectory(sourcePath, destPath);
    }
  }
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, {
        recursive: true
      });
    }

    // If source directory doesn't exist, return early
    if (!fs.existsSync(src)) {
      return;
    }
    const entries = fs.readdirSync(src, {
      withFileTypes: true
    });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Export class for testing purposes
exports.SkillInstaller = SkillInstaller;
// If running directly, execute
// 检查是否直接运行
if (require.main === module || process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const helpManager = new _help.default();

  // Handle version flag (only when it's the only argument)
  if (args.length === 1 && (args[0] === '-V' || args[0] === '--version')) {
    const success = helpManager.showVersion();
    process.exit(success ? 0 : 1);
  }

  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    helpManager.showHelp();
    process.exit(0);
  }

  // Handle list versions flag
  if (args.includes('--list-versions') || args.includes('-l')) {
    const installer = new SkillInstaller();
    installer.listVersions().then(() => process.exit(0));
  } else {
    // Normal execution
    const installer = new SkillInstaller();
    installer.run().catch(console.error);
  }
}