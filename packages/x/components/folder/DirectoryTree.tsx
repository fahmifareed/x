import { FileOutlined, FolderOutlined } from '@ant-design/icons';
import type { TreeProps } from 'antd';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useXProviderContext } from '../x-provider';
import type { SemanticType } from '.';
// File tree node type
export interface FolderTreeData {
  title: string;
  path: string;
  content?: string;
  children?: FolderTreeData[];
}

const { DirectoryTree: AntDirectoryTree } = Tree;

export interface DirectoryTreeProps {
  treeData: FolderTreeData[];
  directoryIcons?: Record<'directory' | string, React.ReactNode | (() => React.ReactNode)>;
  selectedKeys?: string[];
  expandedKeys?: string[];
  onSelect?: TreeProps['onSelect'];
  onExpand?: TreeProps['onExpand'];
  multiple?: boolean;
  showLine?: boolean;
  defaultExpandAll?: boolean;
  blockNode?: boolean;
  className?: string;
  classNames?: Partial<Record<SemanticType, string>>;
  styles?: Partial<Record<SemanticType, React.CSSProperties>>;
  style?: React.CSSProperties;
  directoryTitle?: React.ReactNode | (() => React.ReactNode);
  prefixCls?: string;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  treeData,
  selectedKeys,
  expandedKeys,
  onSelect,
  onExpand,
  multiple = false,
  showLine = false,
  defaultExpandAll = true,
  blockNode = true,
  className,
  classNames,
  directoryIcons,
  styles,
  style,
  directoryTitle,
  prefixCls: customizePrefixCls,
}) => {
  // ============================ Tree Config ============================
  const isFolder = (node: FolderTreeData): boolean => {
    return !!node.children && node.children.length > 0;
  };

  const getIcon = (node: FolderTreeData) => {
    if (isFolder(node)) {
      return typeof directoryIcons?.['directory'] === 'function'
        ? directoryIcons?.['directory']?.()
        : directoryIcons?.['directory'] || <FolderOutlined />;
    }

    // Return corresponding icon based on file extension
    const fileName = node.title.toLowerCase();
    const extension = fileName.split('.').pop();

    if (extension) {
      // Check if custom icon configuration exists
      if (directoryIcons?.[extension]) {
        return typeof directoryIcons[extension] === 'function'
          ? directoryIcons[extension]()
          : directoryIcons[extension];
      }
    }

    return <FileOutlined />;
  };

  const buildPathSegments = useCallback(
    (node: FolderTreeData, parentSegments: string[] = []): string[] => {
      if (node.path === '/' && parentSegments.length === 0) {
        return ['/'];
      }
      return [...parentSegments, node.path].filter((segment) => segment !== '');
    },
    [],
  );

  const convertToTreeData = useCallback(
    (nodes: FolderTreeData[], parentSegments: string[] = []): DataNode[] => {
      return nodes.map((node) => {
        const pathSegments = buildPathSegments(node, parentSegments);
        const fullPath = pathSegments.join('/').replace(/^\/+/, '');
        return {
          ...node,
          key: fullPath,
          path: fullPath,
          pathSegments,
          title: node.title,
          icon: getIcon(node),
          isLeaf: !isFolder(node),
          children: node.children ? convertToTreeData(node.children, pathSegments) : undefined,
        };
      });
    },
    [buildPathSegments, directoryTitle],
  );

  const treeDataConverted = convertToTreeData(treeData);
  const titleNode = typeof directoryTitle === 'function' ? directoryTitle() : directoryTitle;
  // ============================ Prefix ============================
  const { getPrefixCls } = useXProviderContext();
  const prefixCls = getPrefixCls('folder', customizePrefixCls);
  return (
    <>
      {titleNode ? (
        <div
          style={{ ...styles?.directoryTitle, ...style }}
          className={clsx(
            `${prefixCls}-directory-tree-title`,
            className,
            classNames?.directoryTitle,
          )}
        >
          {titleNode}
        </div>
      ) : null}
      <AntDirectoryTree
        treeData={treeDataConverted}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onSelect={onSelect}
        onExpand={onExpand}
        multiple={multiple}
        blockNode={blockNode}
        classNames={{
          itemTitle: `${prefixCls}-directory-tree-item-title`,
        }}
        showLine={showLine}
        defaultExpandAll={defaultExpandAll}
        className={clsx(`${prefixCls}-directory-tree-content`)}
      />
    </>
  );
};

export default DirectoryTree;
