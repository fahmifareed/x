import { FileOutlined, FolderOutlined } from '@ant-design/icons';
import { useControlledState } from '@rc-component/util';
import type { TreeProps } from 'antd';
import { Empty, Spin, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import useXComponentConfig from '../_util/hooks/use-x-component-config';
import CodeHighlighter from '../code-highlighter/CodeHighlighter';
import { useXProviderContext } from '../x-provider';
import useStyle from './style';

const { DirectoryTree } = Tree;

// 文件树节点类型
export interface FileTreeNode extends Omit<TreeProps['treeData'], 'key'> {
  title: string;
  path: string;
  content?: string;
  children?: FileTreeNode[];
}

// 文件内容服务接口
export interface FileContentService {
  loadFileContent(filePath: string): Promise<string>;
}

// 文件夹属性
export interface FolderProps {
  // 基础属性
  prefixCls?: string;
  className?: string;
  classNames?: Partial<Record<'root' | 'tree' | 'preview' | 'header' | 'content', string>>;
  styles?: Partial<Record<'root' | 'tree' | 'preview' | 'header' | 'content', React.CSSProperties>>;
  style?: React.CSSProperties;

  // 数据属性
  treeData: FileTreeNode[];
  title?: React.ReactNode;

  // 展示模式
  mode?: 'tree' | 'tree-with-preview';
  height?: number;

  // 选择功能
  selectable?: boolean;
  selectedFile?: string[] | null;
  defaultSelectedFile?: string[];
  onSelectedFileChange?: (filePath: string[] | null, content?: string[]) => void;
  multiple?: boolean;

  // 展开控制
  defaultExpandedKeys?: string[];
  expandedKeys?: string[];
  onExpand?: (keys: string[]) => void;

  // 文件内容服务
  fileContentService?: FileContentService;

  // 事件回调
  onFileClick?: (filePath: string, content?: string) => void;
  onFolderClick?: (folderPath: string) => void;
}

const Folder: React.FC<FolderProps> = (props) => {
  const {
    prefixCls: customizePrefixCls,
    className,
    classNames,
    styles,
    style,
    treeData,
    title,
    mode = 'tree',
    height = 400,
    selectable = false,
    defaultSelectedFile,
    selectedFile: controlledSelectedFile,
    onSelectedFileChange,
    multiple = false,
    defaultExpandedKeys = [],
    expandedKeys,
    onExpand,
    onFileClick,
    onFolderClick,
  } = props;

  // ============================ State ============================
  const [selectedFileState, setSelectedFileState] = useControlledState<string[] | null>(
    defaultSelectedFile || null,
    controlledSelectedFile,
  );
  const [expandedKeysState, setExpandedKeys] = useControlledState<string[]>(
    defaultExpandedKeys,
    expandedKeys,
  );
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // ============================ Prefix ============================
  const { getPrefixCls, direction } = useXProviderContext();
  const prefixCls = getPrefixCls('folder', customizePrefixCls);
  const [hashId, cssVarCls] = useStyle(prefixCls);
  const contextConfig = useXComponentConfig('folder');

  // ============================ Style ============================
  const mergedCls = clsx(
    prefixCls,
    contextConfig.className,
    className,
    classNames?.root,
    hashId,
    cssVarCls,
    {
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-${mode}`]: mode,
      [`${prefixCls}-selectable`]: selectable,
    },
  );

  // ============================ Tree Config ============================
  const isFolder = (node: FileTreeNode): boolean => {
    return !!node.children && node.children.length > 0;
  };

  const getIcon = (node: FileTreeNode) => {
    if (isFolder(node)) {
      return <FolderOutlined />;
    }
    return <FileOutlined />;
  };

  const buildPathSegments = (node: FileTreeNode, parentSegments: string[] = []): string[] => {
    if (node.path === '/' && parentSegments.length === 0) {
      return ['/'];
    }
    return [...parentSegments, node.path].filter((segment) => segment !== '');
  };

  const convertToTreeData = (nodes: FileTreeNode[], parentSegments: string[] = []): DataNode[] => {
    return nodes.map((node) => {
      const pathSegments = buildPathSegments(node, parentSegments);
      const fullPath = pathSegments.join('/').replace(/^\/+/, '');
      return {
        ...node,
        key: fullPath,
        path: fullPath,
        pathSegments,
        icon: getIcon(node),
        isLeaf: !isFolder(node),
        children: node.children ? convertToTreeData(node.children, pathSegments) : undefined,
      };
    });
  };

  // ============================ File Content ============================
  const loadFileContent = useCallback(
    async (filePath: string) => {
      if (!filePath) return;

      // 先从节点中查找预加载的内容
      const findNodeByPath = (
        nodes: FileTreeNode[],
        segments: string[],
        index = 0,
      ): FileTreeNode | undefined => {
        if (index >= segments.length) return undefined;

        const currentSegment = segments[index];
        for (const node of nodes) {
          if (node.path === currentSegment) {
            if (index === segments.length - 1 && !isFolder(node)) {
              return node;
            }
            if (node.children && index < segments.length - 1) {
              return findNodeByPath(node.children, segments, index + 1);
            }
          }
        }
        return undefined;
      };

      const segments = filePath.split('/').filter((segment) => segment !== '');
      const node = findNodeByPath(treeData, segments);
      if (node?.content !== undefined) {
        setFileContent(node.content);
        return;
      }

      setLoading(true);
      setError('');

      try {
        if (props.fileContentService) {
          const content = await props.fileContentService.loadFileContent(filePath);
          setFileContent(content);
        } else {
          setError('未配置文件内容服务');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载文件失败');
      } finally {
        setLoading(false);
      }
    },
    [treeData, props.fileContentService],
  );

  // ============================ Event Handlers ============================
  const handleSelect: TreeProps['onSelect'] = (_keys, info) => {
    const keys = _keys as string[];
    const nodes = Array.isArray(info.selectedNodes) ? info.selectedNodes : [info.selectedNodes];

    setSelectedFileState(keys);

    // 获取所有选中文件的内容
    const fileContents: string[] = [];
    nodes.forEach((node) => {
      const fileNode = node as unknown as FileTreeNode;
      if (!isFolder(fileNode) && fileNode.content) {
        fileContents.push(fileNode.content);
      }
    });

    onSelectedFileChange?.(keys, fileContents);

    // 处理单个文件点击事件
    if (nodes.length === 1) {
      const node = nodes[0] as unknown as FileTreeNode;
      const isNodeFolder = isFolder(node);

      if (!isNodeFolder) {
        onFileClick?.(node.path, node.content);

        if (mode === 'tree-with-preview') {
          if (node.content !== undefined) {
            setFileContent(node.content);
          } else {
            loadFileContent(node.path);
          }
        }
      } else {
        onFolderClick?.(node.path);
      }
    }
  };

  const handleExpand: TreeProps['onExpand'] = (keys) => {
    const newKeys = keys as string[];
    setExpandedKeys(newKeys);
    onExpand?.(newKeys);
  };

  // ============================ Effects ============================

  useEffect(() => {
    if (selectedFileState && selectedFileState.length > 0 && mode === 'tree-with-preview') {
      // 将路径段数组转换为完整路径
      const fullPath = selectedFileState.join('/');
      loadFileContent(fullPath);
    }
  }, [selectedFileState, mode, loadFileContent]);

  // ============================ Preview Helpers ============================
  const getFileExtension = (path = '') => {
    const parts = path.split('.');
    return parts[parts.length - 1] || '';
  };

  const getLanguageFromExtension = (ext: string) => {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      json: 'json',
      css: 'css',
      less: 'less',
      scss: 'scss',
      sass: 'sass',
      html: 'html',
      xml: 'xml',
      md: 'markdown',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return languageMap[ext.toLowerCase()] || 'text';
  };

  const renderPreview = () => {
    if (mode !== 'tree-with-preview') return null;

    const renderContent = () => {
      if (loading) {
        return (
          <div className={clsx(`${prefixCls}-loading-container`, classNames?.preview)}>
            <Spin size="large" />
          </div>
        );
      }

      if (error) {
        return (
          <div className={clsx(`${prefixCls}-error-container`, classNames?.preview)}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error} />
          </div>
        );
      }

      if (!selectedFileState || selectedFileState.length === 0) {
        return (
          <div className={clsx(`${prefixCls}-empty-container`, classNames?.preview)}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个文件" />
          </div>
        );
      }

      const fullPath = selectedFileState.join('/');
      const extension = getFileExtension(fullPath);
      const language = getLanguageFromExtension(extension);

      return (
        <div className={clsx(`${prefixCls}-content`, classNames?.content)}>
          <div
            className={clsx(`${prefixCls}-header`, classNames?.header)}
            style={{ ...contextConfig.styles?.header, ...styles?.header }}
          >
            <span className={`${prefixCls}-filename`}>{fullPath}</span>
          </div>
          <div className={clsx(`${prefixCls}-code`, classNames?.content)}>
            <CodeHighlighter lang={language}>{fileContent}</CodeHighlighter>
          </div>
        </div>
      );
    };

    return (
      <div
        className={clsx(`${prefixCls}-preview`, classNames?.preview)}
        style={{ ...contextConfig.styles?.preview, ...styles?.preview }}
      >
        {renderContent()}
      </div>
    );
  };

  // ============================ Style ============================
  const mergedStyle = {
    ...contextConfig.style,
    ...styles?.root,
    ...style,
  };

  // ============================ Render ============================
  const treeDataConverted = convertToTreeData(treeData);

  if (mode === 'tree-with-preview') {
    return (
      <div className={mergedCls} style={mergedStyle}>
        {title && (
          <div
            className={clsx(`${prefixCls}-header`, classNames?.header)}
            style={{ ...contextConfig.styles?.header, ...styles?.header }}
          >
            {title}
          </div>
        )}
        <div className={`${prefixCls}-container`}>
          <div
            className={clsx(`${prefixCls}-tree`, classNames?.tree)}
            style={{ width: '50%', ...contextConfig.styles?.tree, ...styles?.tree }}
          >
            <DirectoryTree
              treeData={treeDataConverted}
              height={height}
              selectedKeys={selectable && selectedFileState ? selectedFileState : undefined}
              expandedKeys={expandedKeysState}
              onSelect={handleSelect}
              onExpand={handleExpand}
              multiple={multiple}
              blockNode
              showLine
              defaultExpandAll
            />
          </div>
          {renderPreview()}
        </div>
      </div>
    );
  }

  return (
    <div className={mergedCls} style={mergedStyle}>
      {title && (
        <div
          className={clsx(`${prefixCls}-header`, classNames?.header)}
          style={{ ...contextConfig.styles?.header, ...styles?.header }}
        >
          {title}
        </div>
      )}
      <div
        className={clsx(`${prefixCls}-tree`, classNames?.tree)}
        style={{ ...contextConfig.styles?.tree, ...styles?.tree }}
      >
        <DirectoryTree
          treeData={treeDataConverted}
          height={height}
          selectedKeys={selectable && selectedFileState ? selectedFileState : undefined}
          expandedKeys={expandedKeysState}
          onSelect={handleSelect}
          onExpand={handleExpand}
          multiple={multiple}
          blockNode
          showLine
          defaultExpandAll
        />
      </div>
    </div>
  );
};

export default Folder;
