import type { Config as DOMPurifyConfig } from 'dompurify';
import type { DOMNode } from 'html-react-parser';
import type { MarkedExtension, Tokens } from 'marked';
import { CSSProperties } from 'react';

export interface AnimationConfig {
  fadeDuration?: number;
  opacity?: number;
  [key: string]: unknown;
}

type Token = Tokens.Generic;

interface SteamingOption {
  /**
   * @description 是否还有流式数据
   * @default false
   */
  hasNextChunk?: boolean;
  /**
   * @description 是否开启文字渐显
   * @default false
   */
  enableAnimation?: boolean;
  /**
   * @description 文字动画配置
   */
  animationConfig?: AnimationConfig;
}

type StreamStatus = 'loading' | 'done';

type ComponentProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  /**
   * @description 组件对应的DOM节点，来自 html-react-parser
   */
  domNode?: DOMNode;
  /**
   * @description 流式状态，loading 表示正在加载，done 表示加载完成
   */
  streamStatus?: StreamStatus;
  /**
   * @description 子节点内容
   */
  children?: React.ReactNode;
  /**
   * @description 其他HTML属性和自定义属性
   */
  [key: string]: unknown;
} & T;

interface XMarkdownProps {
  content?: string;
  children?: string;
  /**
   * @description 自定义组件映射，组件会接收 domNode、streamStatus 等属性
   */
  components?: Record<string, React.FC<ComponentProps>>;
  streaming?: SteamingOption;
  config?: MarkedExtension;
  rootClassName?: string;
  className?: string;
  paragraphTag?: string;
  style?: CSSProperties;
  prefixCls?: string;
  /**
   * @description a 标签是否增加 target="_blank"
   */
  openLinksInNewTab?: boolean;
  /**
   * @description Dompurify 配置选项，用于自定义 HTML 净化规则
   */
  dompurifyConfig?: DOMPurifyConfig;
}

export type { XMarkdownProps, Token, Tokens, StreamStatus, ComponentProps };
