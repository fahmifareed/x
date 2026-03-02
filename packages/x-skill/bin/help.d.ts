import { LocaleMessages } from './locale/index';
declare class HelpManager {
  private messages;
  private language;
  private colorMap;
  constructor(messages?: LocaleMessages, language?: string);
  colorize(text: string, color: string): string;
  getMessage(
    key: keyof LocaleMessages,
    replacements?: Record<string, string>,
    lang?: string | null,
  ): string;
  printSeparator(): void;
  showHelp(): void;
  showVersion(): boolean;
  printHeader(): Promise<void>;
  printLanguageSelection(): void;
  printCompletion(messages?: LocaleMessages): void;
  printError(error: Error, messages?: LocaleMessages): void;
  printGoodbye(messages?: LocaleMessages): void;
}
export default HelpManager;
//# sourceMappingURL=help.d.ts.map
