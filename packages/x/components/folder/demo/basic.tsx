/**
 * iframe: 600
 */

import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
import { Flex } from 'antd';
import React from 'react';

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
];

export default () => (
  <div style={{ padding: 24, height: 500 }}>
    <Folder
      treeData={treeData}
      folderTitle={
        <Flex style={{ paddingInline: 16 }} align="center">
          项目文件浏览器
        </Flex>
      }
      defaultSelectedFile={['package.json']}
    />
  </div>
);
