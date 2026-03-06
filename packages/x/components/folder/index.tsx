import { useControlledState } from '@rc-component/util';
import type { TreeProps } from 'antd';
import { Flex, Splitter } from 'antd';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import useXComponentConfig from '../_util/hooks/use-x-component-config';
import { useLocale } from '../locale';
import enUS from '../locale/en_US';
import { useXProviderContext } from '../x-provider';
import DirectoryTree, { type FolderTreeNode } from './DirectoryTree';
import FilePreview from './FilePreview';
import useStyle from './style';

// 文件内容服务接口
export interface FileContentService {
  loadFileContent(filePath: string): Promise<string>;
}

export type SemanticType =
  | 'root'
  | 'directoryTree'
  | 'directoryTitle'
  | 'filePreview'
  | 'previewTitle'
  | 'previewContent';

// 文件夹属性
export interface FolderProps {
  // 基础属性
  prefixCls?: string;
  className?: string;
  classNames?: Partial<Record<SemanticType, string>>;
  styles?: Partial<Record<SemanticType, React.CSSProperties>>;
  style?: React.CSSProperties;
  directoryIcons?: Record<'directory' | string, React.ReactNode | (() => React.ReactNode)>;
  // 数据属性
  treeData: FolderTreeNode[];
  // 选择功能
  selectable?: boolean;
  selectedFile?: string[];
  defaultSelectedFile?: string[];
  onSelectedFileChange?: (file: { path: string[]; name?: string; content?: string }) => void;
  multiple?: boolean;
  directoryTreeWith?: number | string;
  empty?: React.ReactNode | (() => React.ReactNode);
  // 展开控制
  defaultExpandedPaths?: string[];
  expandedPaths?: string[];
  defaultExpandAll?: boolean;
  onExpandedPathsChange?: (paths: string[]) => void;

  // 文件内容服务
  fileContentService?: FileContentService;

  // 事件回调
  onFileClick?: (filePath: string, content?: string) => void;
  onFolderClick?: (folderPath: string) => void;

  // 自定义标题
  directoryTitle?: React.ReactNode | (() => React.ReactNode);
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
}

const Folder: React.FC<FolderProps> = (props) => {
  const {
    prefixCls: customizePrefixCls,
    className,
    classNames,
    styles,
    style,
    treeData,
    directoryIcons,
    directoryTitle,
    previewTitle,
    selectable = true,
    defaultSelectedFile,
    defaultExpandAll = true,
    selectedFile,
    onSelectedFileChange,
    directoryTreeWith = 278,
    empty,
    multiple = false,
    defaultExpandedPaths,
    expandedPaths,
    onExpandedPathsChange,
    onFileClick,
    onFolderClick,
  } = props;

  // ============================ State ============================

  // 查找节点并验证路径
  const findNodeAndValidate = useCallback(
    (
      path: string | string[],
      validateAsFile = false,
    ): { node: FolderTreeNode | undefined; isValid: boolean } => {
      if (!path) return { node: undefined, isValid: false };

      const segments = Array.isArray(path) ? path.filter(Boolean) : path.split('/').filter(Boolean);

      if (segments.length === 0) return { node: undefined, isValid: false };

      const findNode = (nodes: FolderTreeNode[], index = 0): FolderTreeNode | undefined => {
        if (index >= segments.length) return undefined;

        const currentSegment = segments[index];
        for (const node of nodes) {
          if (node.path === currentSegment) {
            return index === segments.length - 1
              ? node
              : node.children
                ? findNode(node.children, index + 1)
                : undefined;
          }
        }
        return undefined;
      };

      try {
        const node = findNode(treeData);
        const isValid = validateAsFile
          ? !!node && (!node.children || node.children.length === 0)
          : !!node;
        return { node, isValid };
      } catch (error) {
        console.warn('Error validating path:', path, error);
        return { node: undefined, isValid: false };
      }
    },
    [treeData],
  );

  const [validSelectedFile, setValidSelectedFile] = useState<boolean>(false);

  const isValidSelectedFile = (filePath?: string[]): boolean =>
    !!(filePath && filePath.length > 0 && findNodeAndValidate(filePath, true).isValid);

  const [expandedPathsState, setExpandedPaths] = useControlledState<string[] | undefined>(
    defaultExpandedPaths,
    expandedPaths,
  );

  const [selectedFileState, setSelectedFileState] = useControlledState<string[]>(
    isValidSelectedFile(defaultSelectedFile || []) ? defaultSelectedFile || [] : [],
    selectedFile,
  );

  useEffect(() => {
    const isValid = isValidSelectedFile(selectedFile || defaultSelectedFile || []);
    setValidSelectedFile(isValid);
  }, [selectedFile, treeData, defaultSelectedFile]);

  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  // ============================ Prefix ============================
  const { getPrefixCls, direction } = useXProviderContext();
  const prefixCls = getPrefixCls('folder', customizePrefixCls);
  const [hashId, cssVarCls] = useStyle(prefixCls);
  const contextConfig = useXComponentConfig('folder');
  const [locale] = useLocale('Folder', enUS.Folder);

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
      [`${prefixCls}-selectable`]: selectable,
    },
  );

  // ============================ Event Handlers ============================
  const handleSelect: TreeProps['onSelect'] = (_keys, info) => {
    const keys = _keys as string[];
    const nodes = Array.isArray(info.selectedNodes) ? info.selectedNodes : [info.selectedNodes];

    // 检查是否点击的是文件夹
    const isFolder = nodes.some((node) => {
      const fileNode = node as unknown as FolderTreeNode;
      return !!fileNode.children && fileNode.children.length > 0;
    });

    if (isFolder) {
      // 点击文件夹：不更新selectedFileState，只触发文件夹点击事件
      if (nodes.length === 1) {
        const node = nodes[0] as unknown as FolderTreeNode;
        onFolderClick?.(node.path);
      }
      return;
    }

    // 将完整路径转换为数组格式
    const pathArray = keys[0]?.split('/').filter(Boolean) || [];

    // 避免空路径或无效路径
    if (pathArray.length === 0) return;

    // 获取选中文件的名称和内容（单文件选择时）
    const selectedNode = nodes[0] as unknown as FolderTreeNode | undefined;
    const fileName = selectedNode?.title as string | undefined;
    const fileContent = selectedNode?.content as string | undefined;

    // 触发选择变更回调（这是主要的交互方式）
    onSelectedFileChange?.({ path: pathArray, name: fileName, content: fileContent });

    // // 在非受控模式下更新内部状态
    const isControlled = selectedFile !== undefined;
    if (!isControlled) {
      setValidSelectedFile(true);
      setSelectedFileState(pathArray);
    }

    // 处理单个文件点击事件
    if (nodes.length === 1) {
      const node = nodes[0] as unknown as FolderTreeNode;
      onFileClick?.(node.path, node.content);
    }
  };

  const handleExpand: TreeProps['onExpand'] = (keys) => {
    const newPaths = keys as string[];
    setExpandedPaths(newPaths);
    onExpandedPathsChange?.(newPaths);
  };

  // ============================ Effects ============================

  useEffect(() => {
    const loadFileContent = async () => {
      if (!validSelectedFile || selectedFileState.length === 0) {
        setFileContent('');
        setLoadingContent(false);
        return;
      }

      const filePath = selectedFileState.join('/');

      // 首先检查节点是否已经有内容
      const segments = filePath.split('/').filter((segment) => segment !== '');
      const { node } = findNodeAndValidate(segments);

      if (node?.content) {
        // 如果节点已经有内容，直接使用
        setFileContent(node.content);
        setLoadingContent(false);
        return;
      }

      // 如果有文件内容服务，使用服务加载内容
      if (props.fileContentService) {
        setLoadingContent(true);
        try {
          const content = await props.fileContentService.loadFileContent(filePath);
          setFileContent(content);
        } catch (error) {
          console.error('Failed to load file content:', error);
          setFileContent(
            `// ${locale?.loadError}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        } finally {
          setLoadingContent(false);
        }
      } else {
        // 没有文件内容服务，显示提示信息
        setFileContent(`// ${locale.noService}`);
        setLoadingContent(false);
      }
    };

    loadFileContent();
  }, [
    validSelectedFile,
    selectedFileState,
    treeData,
    props.fileContentService,
    findNodeAndValidate,
  ]);

  // ============================ Style ============================
  const mergedStyle = {
    ...contextConfig.style,
    ...styles?.root,
    ...style,
  };

  return (
    <div className={mergedCls} style={mergedStyle}>
      <Flex className={`${prefixCls}-container`}>
        <Splitter>
          <Splitter.Panel defaultSize={directoryTreeWith}>
            <div
              className={clsx(`${prefixCls}-directory-tree`, classNames?.directoryTree)}
              style={{
                width: directoryTreeWith,
                overflow: 'auto',
                ...contextConfig.styles?.directoryTree,
                ...styles?.directoryTree,
              }}
            >
              <DirectoryTree
                directoryIcons={directoryIcons}
                prefixCls={customizePrefixCls}
                treeData={treeData}
                selectedKeys={
                  selectable && selectedFileState && validSelectedFile
                    ? [selectedFileState.join('/')]
                    : []
                }
                classNames={classNames}
                styles={styles}
                expandedKeys={expandedPathsState}
                onSelect={handleSelect}
                onExpand={handleExpand}
                multiple={multiple}
                blockNode
                defaultExpandAll={defaultExpandAll}
                directoryTitle={directoryTitle}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel>
            <FilePreview
              empty={empty}
              prefixCls={customizePrefixCls}
              classNames={classNames}
              styles={styles}
              selectedFile={validSelectedFile ? selectedFileState : []}
              fileContent={fileContent}
              loading={loadingContent}
              previewTitle={previewTitle}
              getFileNode={(path) => {
                if (!path || path.length === 0) return undefined;
                const { node } = findNodeAndValidate(path);
                return node
                  ? { title: node.title, path: node.path, content: node.content }
                  : undefined;
              }}
            />
          </Splitter.Panel>
        </Splitter>
      </Flex>
    </div>
  );
};

export default Folder;
