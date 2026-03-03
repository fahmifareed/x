#!/usr/bin/env node

import * as fs from 'fs';
import ora from 'ora';
import * as os from 'os';
import * as path from 'path';
import ProgressBar from 'progress';
import * as readline from 'readline';
import SkillLoader from './getSkillRepo';
import HelpManager from './help';
import { emojis, Language, LocaleMessages, messages } from './locale/index';

interface SkillConfig {
  targets: {
    [key: string]: {
      enabled: boolean;
      paths: {
        global: string;
        project: string;
      };
    };
  };
}

interface ParsedArgs {
  tag: string | null;
  help: boolean;
  listVersions: boolean;
}

interface Skill {
  name: string;
  path: string;
  description: string;
  version: string;
}

class SkillInstaller {
  private skills: Skill[] = [];
  private language: Language = 'zh';
  private messages: LocaleMessages;
  private rl: readline.Interface;
  private skillConfig: SkillConfig;
  private skillLoader: SkillLoader;
  private helpManager: HelpManager;
  private args: ParsedArgs;
  private cacheDir: string;

  constructor() {
    this.messages = this.loadLocaleMessages();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.skillConfig = this.loadConfig();
    this.skillLoader = new SkillLoader({
      githubOwner: 'ant-design',
      githubRepo: 'x',
      tempDir: path.join(os.tmpdir(), 'x-skill-temp'),
    });
    this.cacheDir = path.join(os.tmpdir(), 'x-skill-cache');

    this.helpManager = new HelpManager(this.messages, this.language);

    // Parse command line arguments
    this.args = this.parseArgs();
  }

  colorize(text: string, color: string): string {
    return this.helpManager.colorize(text, color);
  }

  questionAsync(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  printSeparator(): void {
    this.helpManager.printSeparator();
  }

  parseArgs(): ParsedArgs {
    const args = process.argv.slice(2);
    const parsed: ParsedArgs = {
      tag: null,
      help: false,
      listVersions: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (
        (arg === '--tag' || arg === '-t') &&
        i + 1 < args.length &&
        !args[i + 1].startsWith('-')
      ) {
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

  init(): void {
    if (this.args.help) {
      this.showHelp();
      process.exit(0);
    }

    if (this.args.listVersions) {
      this.listVersions().then(() => process.exit(0));
      return;
    }
  }

  showHelp(): void {
    this.helpManager.showHelp();
  }

  loadConfig(): SkillConfig {
    // 从 packages/x-skill 目录加载配置文件
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const configPath = path.join(currentDir, '..', '.skill.json');
    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(this.getMessage('configLoadError', { message: (error as Error).message }));
      process.exit(1);
    }
  }

  loadLocaleMessages(): LocaleMessages {
    try {
      return messages.zh; // 默认返回中文消息
    } catch (error) {
      console.error(this.getMessage('localeLoadError', { message: (error as Error).message }));
      return messages.zh;
    }
  }

  getCache(key: string): any {
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

  setCache(key: string, data: any, ttlSeconds = 3600): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      const cacheFile = path.join(this.cacheDir, `${key}.json`);
      const cacheData = {
        data,
        expires: Date.now() + ttlSeconds * 1000,
      };

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
    } catch (_error) {
      // 缓存失败不影响主要功能
    }
  }

  clearCache(key: string): void {
    try {
      const cacheFile = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }
    } catch (_error) {
      // 清除缓存失败不影响主要功能
    }
  }

  async listVersions(): Promise<void> {
    try {
      const spinner = ora(this.colorize(this.getMessage('fetchingVersions'), 'cyan')).start();
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
      console.error(
        `${this.colorize(this.getMessage('error'), 'red')} ${(error as Error).message}`,
      );
    }
  }

  async loadSkills(): Promise<void> {
    try {
      console.log(`${this.colorize(this.getMessage('fetchingSkills'), 'cyan')}`);
      const version = this.args.tag || 'latest';
      const skills = await this.skillLoader.loadSkills(version, this.language);
      this.skills = skills;

      // 缓存结果
      this.setCache(`skills_${skills[0]?.version || version}`, this.skills, 1800); // 缓存30分钟
    } catch (error) {
      if ((error as Error).message.includes('rate limit')) {
        console.error(
          `${this.colorize(this.getMessage('rateLimitError', { message: (error as Error).message }), 'red')}\n`,
        );
        console.log(
          `${this.colorize(this.getMessage('info'), 'cyan')} ${this.getMessage('rateLimitHint')}`,
        );
      } else {
        console.error(
          `${this.colorize(this.getMessage('githubFetchError', { message: (error as Error).message }), 'red')}`,
        );
      }

      // Fallback to local skills if GitHub fails
      console.log(`${this.colorize(this.getMessage('usingLocalSkills'), 'yellow')}`);
      await this.loadLocalSkills();

      if (this.skills.length === 0) {
        console.log(
          `${emojis.warning} ${this.colorize(this.getMessage('noLocalSkills'), 'yellow')}`,
        );
      }
    }
  }

  async loadLocalSkills(): Promise<void> {
    try {
      const skills = await this.skillLoader.loadLocalSkills(this.language);
      this.skills = skills;
    } catch (error) {
      console.error(this.getMessage('error'), (error as Error).message);
      process.exit(1);
    }
  }

  async askQuestion(question: string, options: string[]): Promise<string | null> {
    // 防止空选项数组导致的无限递归
    if (!options || options.length === 0) {
      console.log(`${emojis.warning} ${this.colorize(this.getMessage('noSelection'), 'red')}`);
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
        const answer = await this.questionAsync(
          this.colorize('➤ ', 'green') + this.getMessage('pleaseSelectNumber'),
        );

        if (!answer || answer.trim() === '') {
          console.log(`${emojis.warning} ${this.colorize(this.getMessage('inputEmpty'), 'red')}`);
          attempts++;
          continue;
        }

        const index = parseInt(answer.trim(), 10) - 1;
        if (index >= 0 && index < options.length) {
          console.log(
            `\n${emojis.check} ${this.getMessage('yourChoice')} ${this.colorize(options[index], 'green')}\n`,
          );
          return options[index];
        }
        console.log(`${emojis.warning} ${this.colorize(this.getMessage('invalidChoice'), 'red')}`);
        attempts++;
      } catch (error) {
        console.error(
          `${emojis.cross} ${this.colorize(this.getMessage('error'), 'red')} ${(error as Error).message}`,
        );
        attempts++;
      }
    }

    console.error(
      `${emojis.cross} ${this.colorize(this.getMessage('maxAttemptsExceeded'), 'red')}`,
    );
    process.exit(1);
  }

  async askMultipleChoice(question: string, options: string[]): Promise<string[]> {
    // 防止空选项数组导致的无限递归
    if (!options || options.length === 0) {
      console.log(`${emojis.warning} ${this.colorize(this.getMessage('noSelection'), 'red')}`);
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
        const answer = await this.questionAsync(
          this.colorize('➤ ', 'green') + this.getMessage('pleaseSelect'),
        );

        if (!answer || answer.trim() === '') {
          console.log(`${emojis.warning} ${this.colorize(this.getMessage('inputEmpty'), 'red')}`);
          attempts++;
          continue;
        }

        const indices = answer
          .trim()
          .split(',')
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((i) => !isNaN(i) && i >= 0 && i < options.length);

        const selected = indices.map((i) => options[i]);

        if (selected.length > 0) {
          console.log(`\n${emojis.check} ${this.getMessage('yourChoice')}`);
          selected.forEach((item) => {
            console.log(`   ${this.colorize(`• ${item}`, 'green')}`);
          });
          return selected;
        }
        console.log(`${emojis.warning} ${this.colorize(this.getMessage('invalidInput'), 'red')}`);
        attempts++;
      } catch (error) {
        console.error(
          `${emojis.cross} ${this.colorize(this.getMessage('error'), 'red')} ${(error as Error).message}`,
        );
        attempts++;
      }
    }

    console.error(
      `${emojis.cross} ${this.colorize(this.getMessage('maxAttemptsExceeded'), 'red')}`,
    );
    process.exit(1);
  }

  getMessage(key: keyof LocaleMessages, replacements: Record<string, string> = {}): string {
    let message = this.messages[key] || key;
    // Replace template variables
    Object.keys(replacements).forEach((placeholder) => {
      message = message.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    });
    return message;
  }

  // Progress bar using progress library
  createProgressBar(total: number): ProgressBar {
    return new ProgressBar(
      `  ${this.colorize(':bar', 'green')} ${this.colorize(':percent', 'cyan')} ${this.colorize(':current/:total', 'yellow')} ${this.colorize(':etas', 'magenta')} ${this.colorize('→', 'dim')} :text`,
      {
        total: total,
        complete: '█',
        incomplete: '░',
        width: 30,
      },
    );
  }

  async run(): Promise<void> {
    try {
      await this.helpManager.printHeader();

      // Display version info if specified
      if (this.args.tag) {
        console.log(
          `${this.helpManager.colorize(this.getMessage('usingVersion', { version: this.args.tag }), 'cyan')}`,
        );
      }

      // 短暂延迟以避免自动输入问题
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Language selection - bilingual display with dual language prompt
      this.helpManager.printLanguageSelection();

      let languageChoice: string;
      while (true) {
        const answer = await this.questionAsync(
          this.colorize(`${this.getMessage('selectLanguagePrompt')}: `, 'green'),
        );
        const choice = answer.trim();
        if (choice === '1' || choice.toLowerCase() === 'zh') {
          console.log(`\n${emojis.check} 你选择了中文\n`);
          languageChoice = '中文';
          break;
        }
        if (choice === '2' || choice.toLowerCase() === 'en') {
          console.log(`\n${emojis.check} You selected English\n`);
          languageChoice = 'English';
          break;
        }
        console.log(
          `${emojis.warning} ${this.colorize('无效选择，请重新输入 / Invalid choice, please try again', 'red')}`,
        );
      }

      this.language = languageChoice === '中文' ? 'zh' : 'en';

      // Load skills from GitHub
      await this.loadSkills();

      const skillOptions = this.skills.map(
        (skill) =>
          `${skill.name}${skill.description && skill.description !== skill.name ? ` - ${skill.description}` : ''}`,
      );

      if (skillOptions.length === 0) {
        console.log(
          `${emojis.warning} ${this.colorize(this.getMessage('noSkillsFound'), 'yellow')}`,
        );
        return;
      }

      let selectedSkills: string[] = [];
      while (selectedSkills.length === 0) {
        selectedSkills = await this.askMultipleChoice(
          this.getMessage('selectSkills'),
          skillOptions,
        );

        if (selectedSkills.length === 0) {
          console.log(
            `${emojis.warning} ${this.colorize(this.getMessage('selectAtLeastOneSkill'), 'yellow')}`,
          );
        }
      }

      const selectedSkillNames = selectedSkills.map((s) => s.split(' - ')[0]);

      const softwareOptions = Object.entries(this.skillConfig.targets)
        .filter(([_, config]) => config.enabled)
        .map(([name]) => name);

      if (softwareOptions.length === 0) {
        console.log(
          `${emojis.warning} ${this.colorize(this.getMessage('noSoftwareFound'), 'yellow')}`,
        );
        return;
      }

      let selectedSoftwareList: string[] = [];
      while (selectedSoftwareList.length === 0) {
        selectedSoftwareList = await this.askMultipleChoice(
          this.getMessage('selectSoftware'),
          softwareOptions,
        );

        if (selectedSoftwareList.length === 0) {
          console.log(
            `${emojis.warning} ${this.colorize(this.getMessage('selectAtLeastOneSoftware'), 'yellow')}`,
          );
        }
      }

      // Installation method selection
      const installTypeOptions = [
        this.getMessage('globalInstall'),
        this.getMessage('projectInstall'),
      ];

      let selectedInstallType: string | null = null;
      while (!selectedInstallType) {
        selectedInstallType = await this.askQuestion(
          this.getMessage('selectInstallType'),
          installTypeOptions,
        );
      }

      const isGlobal = selectedInstallType === this.getMessage('globalInstall');

      // Installation process
      const totalSteps = selectedSoftwareList.length * selectedSkillNames.length;

      if (totalSteps > 0) {
        const progressBar = this.createProgressBar(totalSteps);

        const allTasks = [];
        for (const software of selectedSoftwareList) {
          for (const skillName of selectedSkillNames) {
            allTasks.push({ skillName, software });
          }
        }

        for (const task of allTasks) {
          const { skillName, software } = task;
          try {
            await this.installSkills([skillName], software, isGlobal);
            progressBar.tick({
              text: `${skillName} -> ${software}`,
            });
          } catch (installError) {
            console.error(
              `${emojis.cross} ${this.colorize(this.getMessage('installError', { skill: skillName, error: (installError as Error).message }), 'red')}`,
            );
            progressBar.tick({
              text: `${skillName} -> ${software} ${this.getMessage('installationFailed')}`,
            });
          }
        }
      }
      // Completion animation
      this.helpManager.printCompletion(this.messages);
    } catch (error) {
      if (
        (error as Error).message.includes('Input stream ended') ||
        (error as Error).message.includes('Readline interface is closed')
      ) {
        console.error(
          `${emojis.cross} ${this.colorize(this.getMessage('programInterrupted'), 'red')}`,
        );
      } else {
        this.helpManager.printError(error as Error, this.messages);
      }
    } finally {
      this.helpManager.printGoodbye(this.messages);
      if (this.rl && !(this.rl as any).closed) {
        this.rl.close();
      }
    }
  }

  async installSkills(skillNames: string[], software: string, isGlobal: boolean): Promise<void> {
    const targetConfig = this.skillConfig.targets[software];
    if (!targetConfig) {
      throw new Error(`Software ${software} not found in configuration`);
    }

    const targetPath = isGlobal ? targetConfig.paths.global : targetConfig.paths.project;
    const fullTargetPath = isGlobal
      ? path.join(os.homedir(), targetPath)
      : path.join(process.cwd(), targetPath);

    if (!fs.existsSync(fullTargetPath)) {
      fs.mkdirSync(fullTargetPath, { recursive: true });
    }

    for (const skillName of skillNames) {
      const skill = this.skills.find((s) => s.name === skillName);
      if (!skill) {
        // Silently skip skills not found, no warning output
        continue;
      }

      const sourcePath = skill.path;
      const destPath = path.join(fullTargetPath, skillName);

      if (fs.existsSync(destPath)) {
        // Silently delete existing skills, no update notification
        fs.rmSync(destPath, { recursive: true, force: true });
      }

      this.copyDirectory(sourcePath, destPath);
    }
  }

  copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // If source directory doesn't exist, return early
    if (!fs.existsSync(src)) {
      return;
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
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
export { SkillInstaller };

// If running directly, execute
// 检查是否直接运行
if (require.main === module || process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const helpManager = new HelpManager();

  // Handle version flag (only when it's the only argument)
  if (args.length === 1 && (args[0] === '-V' || args[0] === '--version' || args[0] === '-v')) {
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
