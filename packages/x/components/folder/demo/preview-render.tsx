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
  // Function form
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
      <div>Path: {path.join('/')}</div>
      <pre>{content}</pre>
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 300, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <Folder treeData={treeData} previewRender={customPreview} />
      </div>
    </div>
  );
};

export default App;
