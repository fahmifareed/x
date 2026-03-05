/**
 * iframe: 600
 */

import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
import { Button, Card, Space } from 'antd';
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
            content: `import React from 'react';
import { Button as AntButton } from 'antd';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <AntButton {...props}>{children}</AntButton>;
};

export default Button;`,
          },
          {
            title: 'Input.tsx',
            path: 'Input.tsx',
            content: `import React from 'react';
import { Input as AntInput } from 'antd';

interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const Input: React.FC<InputProps> = ({ ...props }) => {
  return <AntInput {...props} />;
};

export default Input;`,
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
            content: `export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};`,
          },
        ],
      },
    ],
  },
  {
    title: 'package.json',
    path: 'package.json',
    content: `{
  "name": "demo-app",
  "version": "1.0.0",
  "description": "A demo application",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "antd": "^5.0.0"
  }
}`,
  },
  {
    title: 'README.md',
    path: 'README.md',
    content: `# Demo Application

This is a demo application showcasing the Folder component.

## Features

- 📁 File tree navigation
- 🔍 File preview
- 🎨 Code syntax highlighting
- 📱 Responsive design
`,
  },
];

export default () => {
  const [selectedFile, setSelectedFile] = useState<string[] | null>([
    'src',
    'components',
    'Button.tsx',
  ]);
  const [expandedPaths, setExpandedPaths] = useState<string[]>(['src']);

  const handleReset = () => {
    setSelectedFile(['src', 'components', 'Button.tsx']);
    setExpandedPaths(['src']);
  };

  const handleExpandAll = () => {
    setExpandedPaths(['src', 'src/components', 'src/utils']);
  };

  const handleCollapseAll = () => {
    setExpandedPaths([]);
  };

  const handleSelectPackage = () => {
    setSelectedFile(['package.json']);
    setExpandedPaths([]);
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleReset}>
          重置状态
        </Button>
        <Button onClick={handleExpandAll}>展开全部</Button>
        <Button onClick={handleCollapseAll}>收起全部</Button>
        <Button onClick={handleSelectPackage}>选择 package.json</Button>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Space vertical>
          <div>
            <strong>当前选中文件：</strong>{' '}
            {selectedFile && selectedFile.length > 0 ? selectedFile.join('/') : '无'}
          </div>
          <div>
            <strong>展开节点：</strong> {expandedPaths.join(', ') || '无'}
          </div>
        </Space>
      </Card>

      <Folder
        style={{ height: 600 }}
        treeData={treeData}
        folderTitle="文件浏览器"
        selectedFile={selectedFile}
        onSelectedFileChange={setSelectedFile}
        expandedPaths={expandedPaths}
        onExpandedPathsChange={setExpandedPaths}
      />
    </div>
  );
};
