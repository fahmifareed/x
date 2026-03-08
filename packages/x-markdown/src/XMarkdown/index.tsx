import { clsx } from 'clsx';
import React, { useMemo } from 'react';
import { Parser, Renderer } from './core';
import DebugPanel from './DebugPanel';
import { useStreaming } from './hooks';
import { XMarkdownProps } from './interface';
import { resolveTailContent } from './utils/tail';
import './index.css';

const DEFAULT_TAIL_CONTENT = '▋';

const XMarkdown: React.FC<XMarkdownProps> = React.memo((props) => {
  const {
    streaming,
    config,
    components,
    paragraphTag,
    content,
    children,
    rootClassName,
    className,
    style,
    openLinksInNewTab,
    dompurifyConfig,
    protectCustomTagNewlines,
    escapeRawHtml,
    debug,
  } = props;
  const tailContent = useMemo(() => resolveTailContent(streaming?.tail), [streaming?.tail]);
  const hasNextChunk = !!streaming?.hasNextChunk;
  const tailConfig = typeof streaming?.tail === 'object' ? streaming.tail : undefined;
  const TailComponent = tailConfig?.component;

  // ============================ style ============================
  const mergedCls = clsx('x-markdown', rootClassName, className);

  // ============================ Streaming ============================
  const output = useStreaming(content || children || '', { streaming, components });

  // ============================ Merge components with xmd-tail ============================
  const mergedComponents = useMemo(() => {
    // Only add xmd-tail if streaming is active
    if (!hasNextChunk || !streaming?.tail) {
      return components;
    }

    // Default tail component
    const DefaultTail: React.FC = () => (
      <span className="xmd-tail">{tailContent || DEFAULT_TAIL_CONTENT}</span>
    );

    // Use custom component or default
    const TailElement = TailComponent
      ? React.createElement(TailComponent, { content: tailContent || DEFAULT_TAIL_CONTENT })
      : React.createElement(DefaultTail);

    return {
      ...components,
      'xmd-tail': () => TailElement,
    };
  }, [hasNextChunk, streaming?.tail, components, TailComponent, tailContent]);

  // ============================ Render ============================
  const parser = useMemo(
    () =>
      new Parser({
        markedConfig: config,
        paragraphTag,
        openLinksInNewTab,
        components: mergedComponents,
        protectCustomTagNewlines,
        escapeRawHtml,
      }),
    [
      config,
      paragraphTag,
      openLinksInNewTab,
      mergedComponents,
      protectCustomTagNewlines,
      escapeRawHtml,
    ],
  );

  const renderer = useMemo(
    () =>
      new Renderer({
        components: mergedComponents,
        dompurifyConfig,
        streaming,
      }),
    [mergedComponents, dompurifyConfig, streaming],
  );

  const htmlString = useMemo(() => {
    if (!output) {
      return '';
    }

    // Inject tail only when streaming and tail is enabled
    const shouldInjectTail = hasNextChunk && !!streaming?.tail;
    return parser.parse(output, { injectTail: shouldInjectTail });
  }, [output, parser, hasNextChunk, streaming?.tail]);

  const renderedContent = useMemo(
    () => (htmlString ? renderer.render(htmlString) : null),
    [htmlString, renderer],
  );

  if (!output) {
    return null;
  }

  return (
    <>
      <div className={mergedCls} style={style} data-streaming={hasNextChunk ? 'true' : 'false'}>
        {renderedContent}
      </div>
      {debug ? <DebugPanel /> : null}
    </>
  );
});

if (process.env.NODE_ENV !== 'production') {
  XMarkdown.displayName = 'XMarkdown';
}

export default XMarkdown;
