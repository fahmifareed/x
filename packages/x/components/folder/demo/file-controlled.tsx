/**
 * iframe: 600
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
        title: 'App.tsx',
        path: 'App.tsx',
        content: `import React from 'react';
import Button from './components/Button';

const App: React.FC = () => {
  return (
    <div>
      <h1>Hello World</h1>
      <Button type="primary">Click me</Button>
    </div>
  );
};

export default App;`,
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

  const handleSelectButton = () => {
    setSelectedFile(['src', 'components', 'Button.tsx']);
  };

  const handleSelectInput = () => {
    setSelectedFile(['src', 'components', 'Input.tsx']);
  };

  const handleSelectPackage = () => {
    setSelectedFile(['package.json']);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>受控文件选择模式</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleSelectButton}>
          选择 Button.tsx
        </Button>
        <Button type="primary" onClick={handleSelectInput}>
          选择 Input.tsx
        </Button>
        <Button type="primary" onClick={handleSelectPackage}>
          选择 package.json
        </Button>
        <Button onClick={handleClearSelection}>清除选择</Button>
      </Space>
      <div style={{ marginBottom: 16 }}>
        <strong>当前选中文件：</strong>{' '}
        {selectedFile && selectedFile.length > 0 ? selectedFile.join('/') : '无'}
      </div>
      <Folder
        treeData={treeData}
        title="文件浏览器"
        mode="tree-with-preview"
        height={400}
        selectedFile={selectedFile}
        onSelectedFileChange={setSelectedFile}
      />
    </div>
  );
};
