import { clsx } from 'clsx';
import React, { useMemo } from 'react';
import { Parser, Renderer } from './core';
import DebugPanel from './DebugPanel';
import { useStreaming } from './hooks';
import { XMarkdownProps } from './interface';
import './index.css';

const XMarkdown: React.FC<XMarkdownProps> = React.memo((props) => {
  const {
    streaming,
    config,
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
    footer,
  } = props;

  const components = useMemo(() => {
    return Object.assign(
      {
        'xmd-footer': footer,
      },
      props?.components ?? {},
    );
  }, [footer, props?.components]);

  // ============================ style ============================
  const mergedCls = clsx('x-markdown', rootClassName, className);

  // ============================ Streaming ============================

  const output = useStreaming(content || children || '', { streaming, components });
  const displayContent = useMemo(() => {
    if (streaming?.hasNextChunk) {
      return output + '<xmd-footer></xmd-footer>';
    }

    return !footer ? output : output.replace(/<xmd-footer><\/xmd-footer>/g, '') || '';
  }, [streaming?.hasNextChunk, output, footer]);
  // ============================ Render ============================
  const parser = useMemo(
    () =>
      new Parser({
        markedConfig: config,
        paragraphTag,
        openLinksInNewTab,
        components,
        protectCustomTagNewlines,
        escapeRawHtml,
        configureRenderCleaner: (code: string, type) => {
          if (type === 'code') {
            return !footer ? code : code.replace(/<xmd-footer><\/xmd-footer>/g, '') || '';
          }

          return code;
        },
      }),
    [config, paragraphTag, openLinksInNewTab, components, protectCustomTagNewlines, escapeRawHtml],
  );

  const renderer = useMemo(
    () =>
      new Renderer({
        components: components,
        dompurifyConfig,
        streaming,
      }),
    [components, dompurifyConfig, streaming],
  );

  const htmlString = useMemo(() => {
    if (!displayContent) {
      return '';
    }

    return parser.parse(displayContent);
  }, [displayContent, parser]);

  if (!displayContent) {
    return null;
  }

  return (
    <>
      <div className={mergedCls} style={style}>
        {renderer.render(htmlString)}
      </div>
      {debug ? <DebugPanel /> : null}
    </>
  );
});

if (process.env.NODE_ENV !== 'production') {
  XMarkdown.displayName = 'XMarkdown';
}

export default XMarkdown;
