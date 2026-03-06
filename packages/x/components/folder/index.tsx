import { useControlledState } from '@rc-component/util';
import type { TreeProps } from 'antd';
import { Flex } from 'antd';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import useXComponentConfig from '../_util/hooks/use-x-component-config';
import warning from '../_util/warning';
import { useLocale } from '../locale';
import enUS from '../locale/en_US';
import { useXProviderContext } from '../x-provider';
import DirectoryTree, { type FileTreeNode } from './DirectoryTree';
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

  // 数据属性
  treeData: FileTreeNode[];
  // 选择功能
  selectable?: boolean;
  selectedFile?: string[];
  defaultSelectedFile?: string[];
  onSelectedFileChange?: (file: { path: string[]; name?: string; content?: string }) => void;
  multiple?: boolean;
  autoExpandFolder?: boolean;
  menuWith?: number | string;
  empty?: React.ReactNode | (() => React.ReactNode);
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
    directoryTitle,
    previewTitle,
    selectable = true,
    defaultSelectedFile,
    selectedFile: controlledSelectedFile,
    onSelectedFileChange,
    menuWith = 378,
    empty,
    multiple = false,
    autoExpandFolder = true,
    defaultExpandedPaths = [],
    expandedPaths,
    onExpandedPathsChange,
    onFileClick,
    onFolderClick,
  } = props;

  // ============================ State ============================
  const [selectedFileState, setSelectedFileState] = useControlledState<string[]>(
    defaultSelectedFile || [],
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

  // ============================ Locale ============================
  const [locale] = useLocale('Folder', enUS.Folder);

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

  // 验证路径是否存在于 treeData 中
  const validatePathInTreeData = useCallback(
    (path: string[]): boolean => {
      if (!path || path.length === 0) return true;

      const pathString = path.join('/');
      const segments = pathString.split('/').filter((segment) => segment !== '');
      const node = findNodeByPath(treeData, segments);
      return !!node;
    },
    [treeData, findNodeByPath],
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
          setError(locale.noService);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : locale.loadFailed);
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

    // 获取选中文件的名称和内容（单文件选择时）
    const selectedNode = nodes[0] as unknown as FileTreeNode | undefined;
    const fileName = selectedNode?.title as string | undefined;
    const fileContent = selectedNode?.content as string | undefined;

    onSelectedFileChange?.({ path: pathArray, name: fileName, content: fileContent });

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
  const prevSelectedFileRef = React.useRef<string[] | undefined>(undefined);

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
      // 验证路径是否存在于 treeData 中
      if (!validatePathInTreeData(selectedFileState)) {
        warning(
          false,
          'Folder',
          `Selected file path "${selectedFileState.join('/')}" does not exist in treeData. Please check the path.`,
        );
        // 清空无效的路径，让组件处于没有选择文件的状态
        setSelectedFileState([]);
        setFileContent('');
        onSelectedFileChange?.({ path: [], name: undefined, content: undefined });
        return;
      }
      loadFileContent(selectedFileState);
    }
  }, [selectedFileState, loadFileContent, validatePathInTreeData]);

  // 初始化时验证 defaultSelectedFile
  useEffect(() => {
    if (defaultSelectedFile && defaultSelectedFile.length > 0) {
      if (!validatePathInTreeData(defaultSelectedFile)) {
        warning(
          false,
          'Folder',
          `defaultSelectedFile path "${defaultSelectedFile.join('/')}" does not exist in treeData. Please check the path.`,
        );
        // 清空无效的 defaultSelectedFile（只在非受控模式下）
        if (controlledSelectedFile === undefined) {
          setSelectedFileState([]);
        }
      }
    }
  }, []); // 只在初始化时执行一次

  // 验证 controlledSelectedFile 的变化
  useEffect(() => {
    if (controlledSelectedFile && controlledSelectedFile.length > 0) {
      if (!validatePathInTreeData(controlledSelectedFile)) {
        warning(
          false,
          'Folder',
          `selectedFile path "${controlledSelectedFile.join('/')}" does not exist in treeData. Please check the path.`,
        );
        // 对于受控模式，由父组件处理，这里不自动清空
      }
    }
  }, [controlledSelectedFile, validatePathInTreeData]);

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
          className={clsx(`${prefixCls}-directory-tree`, classNames?.directoryTree)}
          style={{
            width: menuWith,
            ...contextConfig.styles?.directoryTree,
            ...styles?.directoryTree,
          }}
        >
          <DirectoryTree
            prefixCls={customizePrefixCls}
            treeData={treeData}
            selectedKeys={
              selectable && selectedFileState ? [selectedFileState.join('/')] : undefined
            }
            classNames={classNames}
            styles={styles}
            expandedKeys={expandedPathsState}
            onSelect={handleSelect}
            onExpand={handleExpand}
            multiple={multiple}
            blockNode
            defaultExpandAll
            directoryTitle={directoryTitle}
          />
        </div>
        <FilePreview
          empty={empty}
          prefixCls={customizePrefixCls}
          classNames={classNames}
          styles={styles}
          style={{
            width: `calc(100% - ${typeof menuWith === 'number' ? `${menuWith}px` : menuWith})`,
          }}
          selectedFile={selectedFileState}
          fileContent={fileContent}
          loading={loading}
          error={error}
          previewTitle={previewTitle}
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
