import { Empty, Flex, Spin } from 'antd';
import { clsx } from 'clsx';
import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useXComponentConfig from '../_util/hooks/use-x-component-config';
import ActionsCopy from '../actions/ActionsCopy';
import { useLocale } from '../locale';
import enUS from '../locale/en_US';
import { useXProviderContext } from '../x-provider';
import type { SemanticType } from '.';
import useStyle from './style';

export interface FileViewProps {
  prefixCls?: string;
  style?: React.CSSProperties;
  classNames?: Partial<Record<SemanticType, string>>;
  styles?: Partial<Record<SemanticType, React.CSSProperties>>;
  selectedFile?: string[] | null;
  fileContent?: string;
  loading?: boolean;
  error?: string;
  previewTitle?:
    | string
    | (({
        title,
        path,
        content,
      }: {
        title: string;
        path: string[];
        content: string;
      }) => React.ReactNode);
  getFileNode?: (path: string[]) => { title: string; path: string; content?: string } | undefined;
  empty?: React.ReactNode | (() => React.ReactNode);
}

const customOneLight = {
  ...oneLight,
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    margin: 0,
    background: 'transparent',
    padding: 0,
    borderRadius: 0,
  },
};

const FileView: React.FC<FileViewProps> = (props) => {
  const {
    prefixCls: customizePrefixCls,
    classNames,
    styles,
    style,
    selectedFile,
    fileContent = '',
    loading = false,
    error = '',
    previewTitle,
    getFileNode,
    empty,
  } = props;

  const [contextLocale] = useLocale('Folder', enUS.Folder);

  // ============================ Prefix ============================
  const { getPrefixCls } = useXProviderContext();
  const prefixCls = getPrefixCls('folder', customizePrefixCls);
  const contextConfig = useXComponentConfig('folder');
  const previewCls = `${prefixCls}-preview`;
  const [hashId, cssVarCls] = useStyle(prefixCls);
  // ============================ Helpers ============================
  const getFileExtension = (path = '') => {
    const parts = path.split('.');
    return parts[parts.length - 1] || '';
  };

  const getLanguageFromExtension = (ext: string) => {
    return ext.toLowerCase() || 'txt';
  };

  // ============================ Render ============================
  const renderContent = () => {
    if (loading) {
      return (
        <div className={clsx(`${previewCls}-loading-container`, classNames?.previewContent)}>
          <Spin />
        </div>
      );
    }

    if (error) {
      return (
        <div className={clsx(`${previewCls}-error-container`, classNames?.previewContent)}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={contextLocale.loadError} />
        </div>
      );
    }

    if (!selectedFile || selectedFile.length === 0) {
      const emptyNode =
        typeof empty === 'function'
          ? empty()
          : empty || (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={contextLocale.selectFile} />
            );

      return (
        <div className={clsx(`${previewCls}-empty-container`, classNames?.previewContent)}>
          {emptyNode}
        </div>
      );
    }

    const fileNode = getFileNode?.(selectedFile);
    const title = fileNode?.title || selectedFile[selectedFile.length - 1];
    const path = selectedFile;

    // 从文件名获取扩展名
    const fileName = selectedFile[selectedFile.length - 1];
    const extension = getFileExtension(fileName);
    const language = getLanguageFromExtension(extension);

    // 处理自定义内容标题
    let headerNode: React.ReactNode;
    if (previewTitle) {
      headerNode =
        typeof previewTitle === 'function'
          ? previewTitle({ title, path, content: fileContent })
          : previewTitle;
    } else {
      headerNode = (
        <Flex justify="space-between" align="center" className={`${previewCls}-title`}>
          <span className={`${previewCls}-filename`}>{title}</span>
          <ActionsCopy text={fileContent} className={`${previewCls}-copy`} />
        </Flex>
      );
    }

    return (
      <>
        <div className={clsx(`${previewCls}-title-wrapper`, classNames?.previewTitle)}>
          {headerNode}
        </div>
        <div className={clsx(`${previewCls}-content`, classNames?.previewContent)}>
          <SyntaxHighlighter
            language={language}
            wrapLines={true}
            style={customOneLight}
            codeTagProps={{ style: { background: 'transparent' } }}
          >
            {fileContent.replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </>
    );
  };

  return (
    <div
      className={clsx(`${prefixCls}-preview`, classNames?.filePreview, hashId, cssVarCls)}
      style={{ ...contextConfig.styles?.filePreview, ...styles?.filePreview, ...style }}
    >
      {renderContent()}
    </div>
  );
};

export default FileView;
