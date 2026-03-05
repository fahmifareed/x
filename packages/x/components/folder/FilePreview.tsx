import { Empty, Flex, Spin } from 'antd';
import { clsx } from 'clsx';
import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useXComponentConfig from '../_util/hooks/use-x-component-config';
import ActionsCopy from '../actions/ActionsCopy';
import { useXProviderContext } from '../x-provider';
import useStyle from './style';

export interface FileViewProps {
  prefixCls?: string;
  classNames?: Partial<Record<'preview' | 'header' | 'content', string>>;
  styles?: Partial<Record<'preview' | 'header' | 'content', React.CSSProperties>>;
  selectedFile?: string[] | null;
  fileContent?: string;
  loading?: boolean;
  error?: string;
  contentTitle?:
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
    selectedFile,
    fileContent = '',
    loading = false,
    error = '',
    contentTitle,
    getFileNode,
  } = props;

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
        <div className={clsx(`${previewCls}-loading-container`, classNames?.preview)}>
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <div className={clsx(`${previewCls}-error-container`, classNames?.preview)}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error} />
        </div>
      );
    }

    if (!selectedFile || selectedFile.length === 0) {
      return (
        <div className={clsx(`${previewCls}-empty-container`, classNames?.preview)}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个文件" />
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
    if (contentTitle) {
      headerNode =
        typeof contentTitle === 'function'
          ? contentTitle({ title, path, content: fileContent })
          : contentTitle;
    } else {
      headerNode = (
        <Flex justify="space-between" align="center" className={`${previewCls}-title`}>
          <span className={`${previewCls}-filename`}>{title}</span>
          <ActionsCopy text={fileContent} className={`${previewCls}-copy`} />
        </Flex>
      );
    }

    return (
      <div className={clsx(`${previewCls}-content`, classNames?.content)}>
        {headerNode}
        <div className={`${previewCls}-code`}>
          <SyntaxHighlighter
            language={language}
            wrapLines={true}
            style={customOneLight}
            codeTagProps={{ style: { background: 'transparent' } }}
          >
            {fileContent.replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx(`${prefixCls}-preview`, classNames?.preview, hashId, cssVarCls)}
      style={{ ...contextConfig.styles?.preview, ...styles?.preview }}
    >
      {renderContent()}
    </div>
  );
};

export default FileView;
