import type { KatexOptions } from 'katex';
import { ReactNode } from 'react';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';

export type LatexOption = {
  katexOptions?: KatexOptions;
  replaceAlignStart?: boolean;
};

type HighlightCodeType = 'root' | 'header' | 'headerTitle' | 'code';
export type HighlighCodeProps = {
  lang?: string;
  children: string;
  header?: ReactNode | null;
  prefixCls?: string;
  style?: React.CSSProperties;
  className?: string;
  highlightProps?: Partial<SyntaxHighlighterProps>;
  // Semantic
  classNames?: Partial<Record<HighlightCodeType, string>>;
  styles?: Partial<Record<HighlightCodeType, React.CSSProperties>>;
};

type MermaidType = 'root' | 'header' | 'graph' | 'code';
export type MermaidProps = {
  children: string;
  header?: ReactNode | null;
  prefixCls?: string;
  style?: React.CSSProperties;
  className?: string;
  highlightProps?: Partial<SyntaxHighlighterProps>;
  // Semantic
  classNames?: Partial<Record<MermaidType, string>>;
  styles?: Partial<Record<MermaidType, React.CSSProperties>>;
};
