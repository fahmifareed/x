import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import React, { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { Streamdown } from 'streamdown';
import XMarkdown from '../../src';

type MarkdownRendererProps = {
  md: string;
};

const MarkedRenderer: FC<MarkdownRendererProps> = (props) => (
  // biome-ignore lint/security/noDangerouslySetInnerHtml: benchmark only
  <div dangerouslySetInnerHTML={{ __html: marked.parse(props.md) as string }} />
);

const MarkdownItRenderer: FC<MarkdownRendererProps> = (props) => {
  const md = new MarkdownIt();

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: benchmark only
    <div dangerouslySetInnerHTML={{ __html: md.render(props.md) }} />
  );
};

const ReactMarkdownRenderer: FC<MarkdownRendererProps> = (props) => (
  <ReactMarkdown>{props.md}</ReactMarkdown>
);

const XMarkdownRenderer: FC<MarkdownRendererProps> = (props) => <XMarkdown>{props.md}</XMarkdown>;

const StreamdownRenderer: FC<MarkdownRendererProps> = (props) => (
  <Streamdown>{props.md}</Streamdown>
);

const Empty = () => <div />;

export {
  MarkedRenderer,
  MarkdownItRenderer,
  ReactMarkdownRenderer,
  XMarkdownRenderer,
  StreamdownRenderer,
  Empty,
};
