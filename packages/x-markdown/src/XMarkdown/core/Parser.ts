import { Marked, Renderer, Tokens } from 'marked';
import { XMarkdownProps } from '../interface';

type ParserOptions = {
  markedConfig?: XMarkdownProps['config'];
  paragraphTag?: string;
  openLinksInNewTab?: boolean;
  components?: XMarkdownProps['components'];
};

export const other = {
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeTest: /[&<>"']/,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  escapeReplace: /[&<>"']/g,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  completeFencedCode: /^ {0,3}(`{3,}|~{3,})([\s\S]*?)\n {0,3}\1[ \n\t]*$/,
};

const escapeReplacements: { [index: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
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

  constructor(options: ParserOptions = {}) {
    const { markedConfig = {} } = options;
    this.options = options;
    this.markdownInstance = new Marked();

    this.configureLinkRenderer();
    this.configureParagraphRenderer();
    this.configureCodeRenderer();
    // user config at last
    this.markdownInstance.use(markedConfig);
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
        const langString = (lang || '').match(other.notSpaceStart)?.[0];
        const code = `${text.replace(other.endingNewline, '')}\n`;
        const isIndentedCode = codeBlockStyle === 'indented';
        // if code is indented, it's done because it has no end tag
        const streamStatus =
          isIndentedCode || other.completeFencedCode.test(raw) ? 'done' : 'loading';
        const escapedCode = escaped ? code : escapeHtml(code, true);

        const classAttr = langString ? ` class="language-${escapeHtml(langString)}"` : '';

        return `<pre><code data-block="true" data-state="${streamStatus}"${classAttr}>${escapedCode}</code></pre>\n`;
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

    let protectedContent = content;
    let placeholderIndex = 0;

    customTagNames.forEach((tagName) => {
      const tagNameLower = tagName.toLowerCase();
      const regex = new RegExp(
        `(<${tagNameLower}(?:\\s[^>]*)?>)([\\s\\S]*?)(</${tagNameLower}>)`,
        'gi',
      );

      protectedContent = protectedContent.replace(
        regex,
        (match, openTag, innerContent, closeTag) => {
          if (innerContent.includes('\n\n')) {
            const protectedInner = innerContent.replace(/\n\n/g, () => {
              const ph = `__X_MD_PLACEHOLDER_${placeholderIndex++}__`;
              placeholders.set(ph, '\n\n');
              return ph;
            });

            return openTag + protectedInner + closeTag;
          }
          return match;
        },
      );
    });

    return { protected: protectedContent, placeholders };
  }

  private restorePlaceholders(content: string, placeholders: Map<string, string>): string {
    let restored = content;
    placeholders.forEach((original, placeholder) => {
      const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(escaped, 'g'), original);
    });
    return restored;
  }

  public parse(content: string) {
    const { protected: protectedContent, placeholders } = this.protectCustomTags(content);
    const parsed = this.markdownInstance.parse(protectedContent) as string;
    return this.restorePlaceholders(parsed, placeholders);
  }
}

export default Parser;
