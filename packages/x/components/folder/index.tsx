import { useControlledState } from '@rc-component/util';
import type { TreeProps } from 'antd';
import { Flex } from 'antd';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import useXComponentConfig from '../_util/hooks/use-x-component-config';
import { useXProviderContext } from '../x-provider';
import DirectoryTree, { type FileTreeNode } from './DirectoryTree';
import FilePreview from './FilePreview';
import useStyle from './style';

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
  // 选择功能
  selectable?: boolean;
  selectedFile?: string[] | null;
  defaultSelectedFile?: string[];
  onSelectedFileChange?: (filePath: string[] | null, content?: string[]) => void;
  multiple?: boolean;
  autoExpandFolder?: boolean;

  // 展开控制
  defaultExpandedPaths?: string[];
  expandedPaths?: string[];
  onExpandedPathsChange?: (paths: string[]) => void;

  // 文件内容服务
  fileContentService?: FileContentService;

  // 事件回调
  onFileClick?: (filePath: string, content?: string) => void;
  onFolderClick?: (folderPath: string) => void;

  // 自定义标题
  folderTitle?: string | (() => React.ReactNode);
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
}

const Folder: React.FC<FolderProps> = (props) => {
  const {
    prefixCls: customizePrefixCls,
    className,
    classNames,
    styles,
    style,
    treeData,
    folderTitle,
    contentTitle,
    selectable = true,
    defaultSelectedFile,
    selectedFile: controlledSelectedFile,
    onSelectedFileChange,
    multiple = false,
    autoExpandFolder = true,
    defaultExpandedPaths = [],
    expandedPaths,
    onExpandedPathsChange,
    onFileClick,
    onFolderClick,
  } = props;

  // ============================ State ============================
  const [selectedFileState, setSelectedFileState] = useControlledState<string[] | null>(
    defaultSelectedFile || null,
    controlledSelectedFile,
  );
  const [expandedPathsState, setExpandedPaths] = useControlledState<string[]>(
    defaultExpandedPaths,
    expandedPaths,
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
      [`${prefixCls}-selectable`]: selectable,
    },
  );

  // ============================ File Content ============================
  const findNodeByPath = useCallback(
    (nodes: FileTreeNode[], segments: string[], index = 0): FileTreeNode | undefined => {
      if (index >= segments.length) return undefined;

      const currentSegment = segments[index];
      for (const node of nodes) {
        if (node.path === currentSegment) {
          if (index === segments.length - 1 && !node.children) {
            return node;
          }
          if (node.children && index < segments.length - 1) {
            return findNodeByPath(node.children, segments, index + 1);
          }
        }
      }
      return undefined;
    },
    [treeData],
  );

  const loadFileContent = useCallback(
    async (filePath: string[]) => {
      if (!filePath || filePath.length === 0) return;

      // 将数组路径转换为字符串路径
      const pathString = filePath.join('/');

      const segments = pathString.split('/').filter((segment) => segment !== '');
      const node = findNodeByPath(treeData, segments);
      if (node?.content !== undefined) {
        setFileContent(node.content);
        return;
      }

      setLoading(true);
      setError('');

      try {
        if (props.fileContentService) {
          const content = await props.fileContentService.loadFileContent(pathString);
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
    [treeData, props.fileContentService, findNodeByPath],
  );

  // ============================ Event Handlers ============================
  const handleSelect: TreeProps['onSelect'] = (_keys, info) => {
    const keys = _keys as string[];
    const nodes = Array.isArray(info.selectedNodes) ? info.selectedNodes : [info.selectedNodes];

    // 检查是否点击的是文件夹
    const isFolder = nodes.some((node) => {
      const fileNode = node as unknown as FileTreeNode;
      return !!fileNode.children && fileNode.children.length > 0;
    });

    if (isFolder) {
      // 点击文件夹：不更新selectedFileState，只触发文件夹点击事件
      if (nodes.length === 1) {
        const node = nodes[0] as unknown as FileTreeNode;
        onFolderClick?.(node.path);
      }
      return;
    }

    // 将完整路径转换为数组格式
    const pathArray = keys[0]?.split('/').filter(Boolean) || [];

    // 点击文件：更新selectedFileState
    setSelectedFileState(pathArray);

    // 自动展开文件夹（如果需要）
    if (autoExpandFolder && pathArray.length > 1) {
      const parentPaths = pathArray.slice(0, -1).reduce((acc, _, index) => {
        const path = [...pathArray.slice(0, index + 1)].join('/');
        if (!expandedPathsState.includes(path)) {
          acc.push(path);
        }
        return acc;
      }, [] as string[]);

      if (parentPaths.length > 0) {
        const newExpandedPaths = [...expandedPathsState, ...parentPaths];
        setExpandedPaths(newExpandedPaths);
        onExpandedPathsChange?.(newExpandedPaths);
      }
    }

    // 获取所有选中文件的内容
    const fileContents: string[] = [];
    nodes.forEach((node) => {
      const fileNode = node as unknown as FileTreeNode;
      if (fileNode.content) {
        fileContents.push(fileNode.content);
      }
    });

    onSelectedFileChange?.(pathArray, fileContents);

    // 处理单个文件点击事件
    if (nodes.length === 1) {
      const node = nodes[0] as unknown as FileTreeNode;
      onFileClick?.(node.path, node.content);

      if (node.content !== undefined) {
        setFileContent(node.content);
      } else {
        loadFileContent(node.path.split('/').filter(Boolean));
      }
    }
  };

  const handleExpand: TreeProps['onExpand'] = (keys) => {
    const newPaths = keys as string[];
    setExpandedPaths(newPaths);
    onExpandedPathsChange?.(newPaths);
  };

  // ============================ Effects ============================

  // 当非受控模式下 selectedFile 变化时自动展开文件夹
  const prevSelectedFileRef = React.useRef<string[] | null | undefined>(undefined);

  useEffect(() => {
    // 只在非受控模式下且 selectedFile 真正变化时触发
    const isNonControlledMode = expandedPaths === undefined;
    const hasChanged =
      JSON.stringify(prevSelectedFileRef.current) !== JSON.stringify(selectedFileState);

    if (
      isNonControlledMode &&
      hasChanged &&
      selectedFileState &&
      selectedFileState.length > 1 &&
      autoExpandFolder
    ) {
      const pathArray = selectedFileState;
      const parentPaths = pathArray
        .slice(0, -1)
        .map((_, index) => pathArray.slice(0, index + 1).join('/'));

      const newExpandedPaths = Array.from(new Set([...expandedPathsState, ...parentPaths]));
      setExpandedPaths(newExpandedPaths);
      onExpandedPathsChange?.(newExpandedPaths);
    }

    prevSelectedFileRef.current = selectedFileState;
  }, [
    selectedFileState,
    autoExpandFolder,
    expandedPaths,
    expandedPathsState,
    setExpandedPaths,
    onExpandedPathsChange,
  ]);

  useEffect(() => {
    if (selectedFileState && selectedFileState.length > 0) {
      loadFileContent(selectedFileState);
    }
  }, [selectedFileState, loadFileContent]);

  // ============================ Style ============================
  const mergedStyle = {
    ...contextConfig.style,
    ...styles?.root,
    ...style,
  };

  return (
    <div className={mergedCls} style={mergedStyle}>
      <Flex className={`${prefixCls}-container`}>
        <div
          className={clsx(`${prefixCls}-tree`, classNames?.tree)}
          style={{ width: 378, ...contextConfig.styles?.tree, ...styles?.tree }}
        >
          <DirectoryTree
            prefixCls={customizePrefixCls}
            treeData={treeData}
            selectedKeys={
              selectable && selectedFileState ? [selectedFileState.join('/')] : undefined
            }
            expandedKeys={expandedPathsState}
            onSelect={handleSelect}
            onExpand={handleExpand}
            multiple={multiple}
            blockNode
            defaultExpandAll
            folderTitle={folderTitle}
          />
        </div>
        <FilePreview
          prefixCls={customizePrefixCls}
          classNames={classNames}
          styles={styles}
          selectedFile={selectedFileState}
          fileContent={fileContent}
          loading={loading}
          error={error}
          contentTitle={contentTitle}
          getFileNode={(path) => {
            if (!path || path.length === 0) return undefined;
            const pathString = path.join('/');
            const segments = pathString.split('/').filter((segment) => segment !== '');
            const node = findNodeByPath(treeData, segments);
            return node ? { title: node.title, path: node.path, content: node.content } : undefined;
          }}
        />
      </Flex>
    </div>
  );
};

export default Folder;
