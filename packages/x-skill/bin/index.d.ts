#!/usr/bin/env node
import ProgressBar from 'progress';
import { LocaleMessages } from './locale/index';
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
declare class SkillInstaller {
  private skills;
  private language;
  private messages;
  private rl;
  private skillConfig;
  private skillLoader;
  private helpManager;
  private args;
  private cacheDir;
  constructor();
  colorize(text: string, color: string): string;
  questionAsync(question: string): Promise<string>;
  printSeparator(): void;
  parseArgs(): ParsedArgs;
  init(): void;
  showHelp(): void;
  loadConfig(): SkillConfig;
  loadLocaleMessages(): LocaleMessages;
  getCache(key: string): any;
  setCache(key: string, data: any, ttlSeconds?: number): void;
  clearCache(key: string): void;
  listVersions(): Promise<void>;
  loadSkills(): Promise<void>;
  loadLocalSkills(): Promise<void>;
  askQuestion(question: string, options: string[]): Promise<string | null>;
  askMultipleChoice(question: string, options: string[]): Promise<string[]>;
  getMessage(key: keyof LocaleMessages, replacements?: Record<string, string>): string;
  createProgressBar(total: number): ProgressBar;
  run(): Promise<void>;
  installSkills(skillNames: string[], software: string, isGlobal: boolean): Promise<void>;
  copyDirectory(src: string, dest: string): void;
}
export { SkillInstaller };
