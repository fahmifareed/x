import { FileOutlined, FolderOutlined } from '@ant-design/icons';
import type { TreeProps } from 'antd';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useXProviderContext } from '../x-provider';
// 文件树节点类型
export interface FileTreeNode {
  title: string;
  path: string;
  content?: string;
  children?: FileTreeNode[];
}

const { DirectoryTree: AntDirectoryTree } = Tree;

export interface DirectoryTreeProps {
  treeData: FileTreeNode[];
  selectedKeys?: string[];
  expandedKeys?: string[];
  onSelect?: TreeProps['onSelect'];
  onExpand?: TreeProps['onExpand'];
  multiple?: boolean;
  showLine?: boolean;
  defaultExpandAll?: boolean;
  blockNode?: boolean;
  className?: string;
  style?: React.CSSProperties;
  folderTitle?: string | (() => React.ReactNode);
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
  style,
  folderTitle,
  prefixCls: customizePrefixCls,
}) => {
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

  const buildPathSegments = useCallback(
    (node: FileTreeNode, parentSegments: string[] = []): string[] => {
      if (node.path === '/' && parentSegments.length === 0) {
        return ['/'];
      }
      return [...parentSegments, node.path].filter((segment) => segment !== '');
    },
    [],
  );

  const convertToTreeData = useCallback(
    (nodes: FileTreeNode[], parentSegments: string[] = []): DataNode[] => {
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
    [buildPathSegments, folderTitle],
  );

  const treeDataConverted = convertToTreeData(treeData);
  const titleNode = typeof folderTitle === 'function' ? folderTitle() : folderTitle;
  // ============================ Prefix ============================
  const { getPrefixCls } = useXProviderContext();
  const prefixCls = getPrefixCls('folder', customizePrefixCls);
  return (
    <>
      {titleNode ? <div className={clsx(`${prefixCls}-tree-title`)}> {titleNode}</div> : null}
      <AntDirectoryTree
        treeData={treeDataConverted}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onSelect={onSelect}
        onExpand={onExpand}
        multiple={multiple}
        blockNode={blockNode}
        showLine={showLine}
        defaultExpandAll={defaultExpandAll}
        className={clsx(`${prefixCls}-tree-content`, className)}
        style={style}
      />
    </>
  );
};

export default DirectoryTree;
