/**
 * iframe: 500
 */

import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
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
          {
            title: 'Modal.tsx',
            path: 'Modal.tsx',
          },
        ],
      },
      {
        title: 'hooks',
        path: 'hooks',
        children: [
          {
            title: 'useAuth.ts',
            path: 'useAuth.ts',
          },
        ],
      },
    ],
  },
  {
    title: 'package.json',
    path: 'package.json',
  },
  {
    title: 'tsconfig.json',
    path: 'tsconfig.json',
  },
];

export default () => {
  const [selectedFiles, setSelectedFiles] = useState<string[] | null>([]);

  const handleSelectedFileChange = (filePaths: string[] | null) => {
    setSelectedFiles(filePaths);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>仅树形结构 - 可选择</h2>
      <Folder
        treeData={treeData}
        title="文件树"
        mode="tree"
        selectable
        selectedFile={selectedFiles}
        onSelectedFileChange={handleSelectedFileChange}
        height={400}
      />
      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
        <strong>已选择文件:</strong>{' '}
        {selectedFiles && selectedFiles.length > 0 ? selectedFiles.join('/') : '无'}
      </div>
    </div>
  );
};
