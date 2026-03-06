import { FolderOutlined } from '@ant-design/icons';
import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
import { Flex } from 'antd';
import React from 'react';
import SemanticPreview from '../../../.dumi/components/SemanticPreview';
import useLocale from '../../../.dumi/hooks/useLocale';

const locales = {
  cn: {
    root: '根节点',
    tree: '目录树容器',
    preview: '文件预览容器',
    header: '标题容器',
    content: '内容容器',
    treeTitle: '目录树标题',
    treeContent: '目录树内容',
    previewTitle: '预览标题',
    previewContent: '预览内容',
    filename: '文件名',
    copy: '复制按钮',
  },
  en: {
    root: 'Root',
    tree: 'Directory tree container',
    preview: 'File preview container',
    header: 'Header container',
    content: 'Content container',
    treeTitle: 'Directory tree title',
    treeContent: 'Directory tree content',
    previewTitle: 'Preview title',
    previewContent: 'Preview content',
    filename: 'Filename',
    copy: 'Copy button',
  },
};

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

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'default' | 'dashed';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  type = 'default' 
}) => {
  return (
    <button 
      className={\`btn btn-\${type}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;`,
          },
          {
            title: 'Input.tsx',
            path: 'Input.tsx',
            content: `import React from 'react';

interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const Input: React.FC<InputProps> = ({ 
  placeholder, 
  value, 
  onChange 
}) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="input"
    />
  );
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
  return date.toLocaleDateString();
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
  "name": "my-app",
  "version": "1.0.0",
  "description": "A sample application",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
  },
];

const App: React.FC = () => {
  const [locale] = useLocale(locales);

  return (
    <SemanticPreview
      componentName="Folder"
      semantics={[
        { name: 'root', desc: locale.root },
        { name: 'tree', desc: locale.tree },
        { name: 'preview', desc: locale.preview },
        { name: 'header', desc: locale.header },
        { name: 'content', desc: locale.content },
        { name: 'treeTitle', desc: locale.treeTitle },
        { name: 'treeContent', desc: locale.treeContent },
        { name: 'previewTitle', desc: locale.previewTitle },
        { name: 'previewContent', desc: locale.previewContent },
        { name: 'filename', desc: locale.filename },
        { name: 'copy', desc: locale.copy },
      ]}
    >
      <Folder
        treeData={treeData}
        folderTitle={
          <Flex
            style={{
              paddingInline: 16,
              width: '100%',
              paddingBlock: 8,
              borderBottom: '1px solid #f0f0f0',
            }}
            align="center"
          >
            <FolderOutlined style={{ marginRight: 8 }} />
            项目文件浏览器
          </Flex>
        }
        defaultSelectedFile={['src', 'components', 'Button.tsx']}
      />
    </SemanticPreview>
  );
};

export default App;
