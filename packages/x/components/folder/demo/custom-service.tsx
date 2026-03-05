/**
 * iframe: 600
 */

import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
import React from 'react';

const treeData: FolderProps['treeData'] = [
  {
    title: '项目根目录',
    path: '/',
    children: [
      {
        title: 'src',
        path: 'src',
        children: [
          {
            title: 'index.js',
            path: 'index.js',
            content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));`,
          },
          {
            title: 'App.js',
            path: 'App.js',
            content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Hello World</h1>
    </div>
  );
}

export default App;`,
          },
        ],
      },
      {
        title: 'public',
        path: 'public',
        children: [
          {
            title: 'index.html',
            path: 'index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
          },
        ],
      },
    ],
  },
];

// 自定义文件内容服务
class CustomFileContentService {
  private mockFiles: Record<string, string> = {
    'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));`,
    'src/App.js': `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Hello World</h1>
    </div>
  );
}

export default App;`,
    'public/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
  };

  async loadFileContent(filePath: string): Promise<string> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    const content = this.mockFiles[filePath];
    if (content) {
      return content;
    }

    throw new Error(`文件 ${filePath} 不存在`);
  }
}

export default () => (
  <div style={{ padding: 24, height: 500 }}>
    <Folder
      treeData={treeData}
      folderTitle="自定义文件浏览器"
      contentTitle={(...arg) => {
        console.log(arg, 1111);
        return 'asdsad';
      }}
      fileContentService={new CustomFileContentService()}
      defaultSelectedFile={['src', 'App.js']}
    />
  </div>
);
