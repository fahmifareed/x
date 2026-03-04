/**
 * iframe: 500
 */

import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
import { Button, Space } from 'antd';
import React, { useState } from 'react';

const treeData: FolderProps['treeData'] = [
  {
    title: 'src',
    path: 'src',
    children: [
      {
        title: 'components',
        path: 'components',
        children: [
          {
            title: 'Button.tsx',
            path: 'Button.tsx',
          },
          {
            title: 'Input.tsx',
            path: 'Input.tsx',
          },
        ],
      },
      {
        title: 'utils',
        path: 'src/utils',
        children: [
          {
            title: 'helper.ts',
            path: 'helper.ts',
          },
        ],
      },
    ],
  },
  {
    title: 'docs',
    path: 'docs',
    children: [
      {
        title: 'README.md',
        path: 'README.md',
      },
    ],
  },
];

export default () => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['src']);

  const handleExpandAll = () => {
    const allKeys = ['src', 'src/components', 'src/utils', 'docs'];
    setExpandedKeys(allKeys);
  };

  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>受控展开状态</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleExpandAll}>
          展开全部
        </Button>
        <Button onClick={handleCollapseAll}>收起全部</Button>
      </Space>
      <Folder
        treeData={treeData}
        title="文件浏览器"
        mode="tree"
        height={400}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
      />
    </div>
  );
};
