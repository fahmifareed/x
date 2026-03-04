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
        path: 'utils',
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
  const [selectedFile, setSelectedFile] = useState<string[] | null>([
    'src',
    'components',
    'Button.tsx',
  ]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['src', 'src/components']);

  const handleSelectButton = () => {
    setSelectedFile(['src', 'components', 'Button.tsx']);
  };

  const handleSelectInput = () => {
    setSelectedFile(['src', 'components', 'Input.tsx']);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>受控选择状态</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleSelectButton}>
          选择 Button.tsx
        </Button>
        <Button type="primary" onClick={handleSelectInput}>
          选择 Input.tsx
        </Button>
        <Button onClick={handleClearSelection}>清除选择</Button>
      </Space>
      <Folder
        treeData={treeData}
        title="文件浏览器"
        mode="tree"
        height={400}
        selectable
        selectedFile={selectedFile}
        onSelectedFileChange={setSelectedFile}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
      />
    </div>
  );
};
