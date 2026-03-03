import figlet from 'figlet';
import * as fs from 'fs';
import * as path from 'path';
import { LocaleMessages } from './locale/index';

interface ColorMap {
  [key: string]: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  bright: string;
  dim: string;
  reset: string;
}

class HelpManager {
  private messages: LocaleMessages;
  private language: string;
  private colorMap: ColorMap;

  constructor(messages: LocaleMessages = {} as LocaleMessages, language = 'zh') {
    this.messages = messages;
    this.language = language;
    this.colorMap = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      reset: '\x1b[0m',
    };
  }

  colorize(text: string, color: string): string {
    if (!this.colorMap[color]) {
      return text;
    }
    return `${this.colorMap[color]}${text}${this.colorMap.reset}`;
  }

  getMessage(key: keyof LocaleMessages, replacements: Record<string, string> = {}): string {
    let message = this.messages[key] || key;

    // Replace template variables
    Object.keys(replacements).forEach((placeholder) => {
      message = message.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    });

    return message;
  }

  printSeparator(): void {
    console.log(this.colorize('─'.repeat(50), 'dim'));
  }

  showHelp(): void {
    const title = this.language === 'zh' ? 'X-Skill 安装器' : 'X-Skill Installer';
    const description =
      this.language === 'zh' ? '从GitHub获取skill文件' : 'Fetch skill files from GitHub';
    const githubTokenDesc =
      this.language === 'zh'
        ? 'GitHub访问令牌，用于避免API速率限制'
        : 'GitHub access token to avoid API rate limits';
    const tagDesc =
      this.language === 'zh'
        ? '指定要使用的版本标签 (默认: latest)'
        : 'Specify version tag to use (default: latest)';
    const listDesc =
      this.language === 'zh' ? '列出所有可用的版本标签' : 'List all available version tags';
    const helpDesc = this.language === 'zh' ? '显示帮助信息' : 'Show help information';
    const versionDesc = this.language === 'zh' ? '显示程序版本号' : 'Show program version';
    const example1 = this.language === 'zh' ? '# 使用latest版本' : '# Use latest version';
    const example2 = this.language === 'zh' ? '# 使用指定版本' : '# Use specific version';
    const example3 = this.language === 'zh' ? '# 列出所有版本' : '# List all versions';
    const example4 = this.language === 'zh' ? '# 显示程序版本号' : '# Show program version';
    const example5 =
      this.language === 'zh' ? '# 使用token避免速率限制' : '# Use token to avoid rate limits';

    console.log(`
${this.colorize(`${title}`, 'cyan')} - ${description}

${this.colorize(this.getMessage('usage' as keyof LocaleMessages), 'yellow')}
  x-skill [${this.language === 'zh' ? '选项' : 'options'}]

${this.colorize(this.getMessage('environmentVariables' as keyof LocaleMessages), 'yellow')}
  GITHUB_TOKEN           ${githubTokenDesc}

${this.colorize(this.getMessage('options' as keyof LocaleMessages), 'yellow')}
  -t, --tag <tag>         ${tagDesc}
  -l, --list-versions     ${listDesc}
  -h, --help             ${helpDesc}
  -V, --version          ${versionDesc}
  -v, --version          ${versionDesc}

${this.colorize(this.getMessage('examples' as keyof LocaleMessages), 'yellow')}
  x-skill                  ${example1}
  x-skill -t v1.0.0        ${example2}
  x-skill --list-versions  ${example3}
  x-skill --version        ${example4}
  GITHUB_TOKEN=your_token x-skill -t 2.3.0  ${example5}
`);
  }

  showVersion(): boolean {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      console.log(packageJson.version);
      return true;
    } catch (error) {
      console.error(
        this.getMessage('versionReadError' as keyof LocaleMessages, {
          message: (error as Error).message,
        }),
      );
      return false;
    }
  }

  async printHeader(): Promise<void> {
    try {
      console.log(figlet.textSync('X-Skill'));
    } catch (err) {
      console.log('Something went wrong...');
      console.dir(err);
    }
  }

  printLanguageSelection(): void {
    console.log(
      `\n${this.colorize(this.getMessage('selectLanguage' as keyof LocaleMessages), 'cyan')}`,
    );
    this.printSeparator();
    console.log(`   ${this.colorize('1.', 'yellow')} 中文`);
    console.log(`   ${this.colorize('2.', 'yellow')} English`);
    this.printSeparator();
  }

  printCompletion(messages: LocaleMessages = {} as LocaleMessages): void {
    console.log(`\n\n${this.colorize(messages.startUsing || '开始愉快地使用吧！', 'bright')}`);
  }

  printError(error: Error, messages: LocaleMessages = {} as LocaleMessages): void {
    console.error(
      `\n${this.colorize(`❌ ${messages.installFailed || '安装失败'}`, 'red')}\n`,
      error.message,
    );
  }

  printGoodbye(messages: LocaleMessages = {} as LocaleMessages): void {
    console.log(`\n${this.colorize(messages.goodbye || '再见！', 'cyan')}\n\n`);
  }
}

export default HelpManager;
