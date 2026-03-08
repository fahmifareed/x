import { Folder } from '@ant-design/x';
import { Card, Tag } from 'antd';
import React from 'react';

const treeData = [
  {
    title: 'src',
    path: 'src',
    children: [
      { title: 'index.js', path: 'index.js', content: 'console.log("Hello");' },
      { title: 'App.tsx', path: 'App.tsx', content: 'const App = () => <div>App</div>;' },
    ],
  },
  { title: 'package.json', path: 'package.json', content: '{"name": "demo"}' },
];

const App: React.FC = () => {
  // 函数形式
  const customPreview = ({
    content,
    path,
    title,
    language,
  }: {
    content?: string;
    path: string[];
    title?: React.ReactNode;
    language: string;
  }) => (
    <Card title={title} extra={<Tag>{language}</Tag>}>
      <div>路径: {path.join('/')}</div>
      <pre>{content}</pre>
    </Card>
  );

  // ReactNode 形式
  const staticPreview = <div style={{ padding: 20 }}>静态预览内容</div>;

  return (
    <div style={{ padding: 24 }}>
      <h3>函数形式</h3>
      <div style={{ height: 300, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <Folder treeData={treeData} previewContent={customPreview} />
      </div>

      <h3>ReactNode 形式</h3>
      <div style={{ height: 300, border: '1px solid #f0f0f0' }}>
        <Folder treeData={treeData} previewContent={staticPreview} />
      </div>
    </div>
  );
};

export default App;
