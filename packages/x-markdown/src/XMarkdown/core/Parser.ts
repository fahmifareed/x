import { Marked, Renderer, Token, Tokens } from 'marked';
import { XMarkdownProps } from '../interface';

type ParserOptions = {
  markedConfig?: XMarkdownProps['config'];
  paragraphTag?: string;
  openLinksInNewTab?: boolean;
  components?: XMarkdownProps['components'];
  protectCustomTagNewlines?: boolean;
  escapeRawHtml?: boolean;
};

type ParseOptions = {
  injectTail?: boolean;
};

export const other = {
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeTest: /[&<>"'/]/,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  escapeReplace: /[&<>"'/]/g,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  completeFencedCode: /^ {0,3}(`{3,}|~{3,})([\s\S]*?)\n {0,3}\1[ \n\t]*$/,
};

const escapeReplacements: { [index: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

export function escapeHtml(html: string, encode?: boolean) {
  if (encode) {
    if (other.escapeTest.test(html)) {
      return html.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html)) {
      return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}

class Parser {
  options: ParserOptions;
  markdownInstance: Marked;
  private lastTextToken: Token | null = null;

  constructor(options: ParserOptions = {}) {
    const { markedConfig = {} } = options;
    this.options = options;
    this.markdownInstance = new Marked();

    this.configureLinkRenderer();
    this.configureParagraphRenderer();
    this.configureCodeRenderer();
    this.configureHtmlEscapeRenderer();
    this.configureTextRenderer();
    // user config at last
    this.markdownInstance.use(markedConfig);
  }

  private configureHtmlEscapeRenderer() {
    if (!this.options.escapeRawHtml) return;

    const renderer = {
      html(this: Renderer, token: Tokens.HTML | Tokens.Tag) {
        const { raw = '', text = '' } = token;
        return escapeHtml(raw || text, true);
      },
    };
    this.markdownInstance.use({ renderer });
  }

  private configureLinkRenderer() {
    if (!this.options.openLinksInNewTab) return;

    const renderer = {
      link(this: Renderer, { href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    };
    this.markdownInstance.use({ renderer });
  }

  public configureParagraphRenderer() {
    const { paragraphTag } = this.options;
    if (!paragraphTag) return;

    const renderer = {
      paragraph(this: Renderer, { tokens }: Tokens.Paragraph) {
        return `<${paragraphTag}>${this.parser.parseInline(tokens)}</${paragraphTag}>\n`;
      },
    };
    this.markdownInstance.use({ renderer });
  }

  public configureCodeRenderer() {
    const renderer = {
      code({ text, raw, lang, escaped, codeBlockStyle }: Tokens.Code): string {
        const infoString = (lang || '').trim();
        const langString = infoString.match(other.notSpaceStart)?.[0];
        const code = `${text.replace(other.endingNewline, '')}\n`;
        const isIndentedCode = codeBlockStyle === 'indented';
        // if code is indented, it's done because it has no end tag
        const streamStatus =
          isIndentedCode || other.completeFencedCode.test(raw) ? 'done' : 'loading';

        const escapedCode = escaped ? code : escapeHtml(code, true);

        const classAttr = langString ? ` class="language-${escapeHtml(langString)}"` : '';
        const dataAttrs =
          ` data-block="true" data-state="${streamStatus}"` +
          (infoString ? ` data-lang="${escapeHtml(infoString)}"` : '');

        return `<pre><code${dataAttrs}${classAttr}>${escapedCode}</code></pre>\n`;
      },
    };
    this.markdownInstance.use({ renderer });
  }

  private configureTextRenderer() {
    const self = this;
    const renderer = {
      text(this: Renderer, token: Tokens.Text | Tokens.Escape) {
        const text =
          'tokens' in token && token.tokens
            ? this.parser.parseInline(token.tokens)
            : 'text' in token
              ? token.text
              : '';

        // Inject xmd-tail after the last text token
        if (token === self.lastTextToken) {
          return `${text}<xmd-tail></xmd-tail>`;
        }
        return text;
      },
    };
    this.markdownInstance.use({ renderer });
  }

  private protectCustomTags(content: string): {
    protected: string;
    placeholders: Map<string, string>;
  } {
    const placeholders = new Map<string, string>();
    const customTagNames = Object.keys(this.options.components || {});

    if (customTagNames.length === 0) {
      return { protected: content, placeholders };
    }

    let placeholderIndex = 0;

    const tagNamePattern = customTagNames
      .map((name) => name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    const openTagRegex = new RegExp(`<(${tagNamePattern})(?:\\s[^>]*)?>`, 'gi');
    const closeTagRegex = new RegExp(`</(${tagNamePattern})>`, 'gi');

    const positions: Array<{
      index: number;
      type: 'open' | 'close';
      tagName: string;
      match: string;
    }> = [];

    let match;
    openTagRegex.lastIndex = 0;
    match = openTagRegex.exec(content);
    while (match !== null) {
      positions.push({
        index: match.index,
        type: 'open',
        tagName: match[1].toLowerCase(),
        match: match[0],
      });
      match = openTagRegex.exec(content);
    }

    closeTagRegex.lastIndex = 0;
    match = closeTagRegex.exec(content);
    while (match !== null) {
      positions.push({
        index: match.index,
        type: 'close',
        tagName: match[1].toLowerCase(),
        match: match[0],
      });
      match = closeTagRegex.exec(content);
    }

    positions.sort((a, b) => a.index - b.index);

    const stack: Array<{ tagName: string; start: number; openTag: string }> = [];
    const result: string[] = [];
    let lastIndex = 0;

    positions.forEach((pos) => {
      if (pos.type === 'open') {
        // Self-closing tags don't have inner content, so they shouldn't be pushed to the stack.
        if (!pos.match.endsWith('/>')) {
          stack.push({ tagName: pos.tagName, start: pos.index, openTag: pos.match });
        }
      } else if (
        pos.type === 'close' &&
        stack.length > 0 &&
        stack[stack.length - 1].tagName === pos.tagName
      ) {
        const open = stack.pop()!;
        if (stack.length === 0) {
          const startPos = open.start;
          const endPos = pos.index + pos.match.length;
          const openTag = open.openTag;
          const closeTag = pos.match;
          const innerContent = content.slice(startPos + openTag.length, pos.index);

          if (lastIndex < startPos) {
            result.push(content.slice(lastIndex, startPos));
          }

          if (innerContent.includes('\n\n')) {
            const protectedInner = innerContent.replace(/\n\n/g, () => {
              const ph = `__X_MD_PLACEHOLDER_${placeholderIndex++}__`;
              placeholders.set(ph, '\n\n');
              return ph;
            });
            result.push(openTag + protectedInner + closeTag);
          } else {
            result.push(openTag + innerContent + closeTag);
          }

          lastIndex = endPos;
        }
      }
    });

    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return { protected: result.join(''), placeholders };
  }

  private restorePlaceholders(content: string, placeholders: Map<string, string>): string {
    if (placeholders.size === 0) {
      return content;
    }
    return content.replace(
      /__X_MD_PLACEHOLDER_\d+__/g,
      (match) => placeholders.get(match) ?? match,
    );
  }

  /**
   * Find the last non-empty token in the token tree (reverse search)
   */
  private findLastNonEmptyToken(tokens: Token[]): Token | null {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];

      // Check for list items (list -> items -> list_item)
      if (token.type === 'list' && 'items' in token && Array.isArray((token as any).items)) {
        const items = (token as any).items;
        for (let j = items.length - 1; j >= 0; j--) {
          const item = items[j];
          // list_item has tokens property
          if ('tokens' in item && item.tokens && item.tokens.length > 0) {
            const found = this.findLastNonEmptyToken(item.tokens as Token[]);
            if (found) return found;
          }
        }
      }

      // Depth-first: check nested tokens first
      if ('tokens' in token && token.tokens && (token.tokens as Token[]).length > 0) {
        const found = this.findLastNonEmptyToken(token.tokens as Token[]);
        if (found) return found;
      }

      // Check if this is a valid token with content
      if (token.type === 'text') {
        const textContent = 'text' in token ? token.text : '';
        // Skip empty text tokens
        if (textContent.trim()) {
          return token;
        }
      } else if (token.type === 'html' || token.type === 'tag') {
        // HTML/tag token has content
        return token;
      }
    }
    return null;
  }

  /**
   * Find the last text token in the token tree (reverse search)
   * Returns null if the last non-empty token is not a text type (e.g., HTML/incomplete component)
   */
  private findLastTextToken(tokens: Token[]): Token | null {
    // Find the last non-empty token
    const lastNonEmptyToken = this.findLastNonEmptyToken(tokens);

    // If the last token is not text type, don't inject tail
    // This prevents tail from appearing before incomplete components
    if (!lastNonEmptyToken || lastNonEmptyToken.type !== 'text') {
      return null;
    }

    return lastNonEmptyToken;
  }

  public parse(content: string, options?: ParseOptions) {
    // Reset lastTextToken for each parse
    this.lastTextToken = null;

    // Protect custom tags if needed
    let processedContent = content;
    let placeholders: Map<string, string> | undefined;
    if (this.options.protectCustomTagNewlines) {
      const result = this.protectCustomTags(content);
      processedContent = result.protected;
      placeholders = result.placeholders;
    }

    // Parse and inject tail if needed
    if (options?.injectTail) {
      const tokens = this.markdownInstance.lexer(processedContent);
      this.lastTextToken = this.findLastTextToken(tokens);
    }
    const parsed = this.markdownInstance.parse(processedContent) as string;

    // Restore placeholders if needed
    if (placeholders) {
      return this.restorePlaceholders(parsed, placeholders);
    }
    return parsed;
  }
}

export default Parser;
