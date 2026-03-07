import React from 'react';
import { render } from '../../../tests/utils';
import Folder, { type FolderRef } from '../index';

const mockTreeData = [
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
            content: 'export const Button = () => <button>Click</button>;',
          },
        ],
      },
    ],
  },
  {
    title: 'package.json',
    path: 'package.json',
    content: '{ "name": "test-app" }',
  },
];

describe('Folder Component', () => {
  it('renders basic folder structure', () => {
    const { container } = render(
      <Folder
        treeData={mockTreeData}
        directoryTitle="Project Files"
        previewTitle="Custom Preview"
        className="custom-class"
        style={{ backgroundColor: 'red' }}
      />,
    );
    expect(container.querySelector('.ant-folder')).toBeTruthy();
    const element = container.querySelector('.ant-folder');
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveStyle({ backgroundColor: 'red' });
  });

  it('renders empty state', () => {
    const { container } = render(<Folder treeData={[]} />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles selectable mode', () => {
    const { container } = render(<Folder treeData={mockTreeData} selectable />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles custom directory width', () => {
    const { container } = render(<Folder treeData={mockTreeData} directoryTreeWith={300} />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles file content service', () => {
    const fileContentService = {
      loadFileContent: jest.fn().mockResolvedValue('// Mock content'),
    };

    const { container } = render(
      <Folder treeData={mockTreeData} fileContentService={fileContentService} />,
    );
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles custom empty state', () => {
    const { container } = render(
      <Folder treeData={mockTreeData} empty={<div>Custom Empty</div>} />,
    );
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles custom icons', () => {
    const customIcons = {
      directory: <span>📁</span>,
      tsx: <span>⚛️</span>,
    };

    const { container } = render(<Folder treeData={mockTreeData} directoryIcons={customIcons} />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles ref forwarding', () => {
    const ref = React.createRef<FolderRef>();
    render(<Folder ref={ref} treeData={mockTreeData} />);
    expect(ref.current).not.toBeNull();
  });

  it('handles selectedFile prop', () => {
    const { container } = render(
      <Folder treeData={mockTreeData} selectable selectedFile={['package.json']} />,
    );
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles defaultSelectedFile prop', () => {
    const { container } = render(
      <Folder treeData={mockTreeData} defaultSelectedFile={['package.json']} />,
    );
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles expandedPaths prop', () => {
    const { container } = render(<Folder treeData={mockTreeData} expandedPaths={['src']} />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles defaultExpandedPaths prop', () => {
    const { container } = render(<Folder treeData={mockTreeData} defaultExpandedPaths={['src']} />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles defaultExpandAll prop', () => {
    const { container } = render(<Folder treeData={mockTreeData} defaultExpandAll={true} />);
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });

  it('handles callbacks', () => {
    const onSelectedFileChange = jest.fn();
    const onFileClick = jest.fn();
    const onFolderClick = jest.fn();
    const onExpandedPathsChange = jest.fn();

    const { container } = render(
      <Folder
        treeData={mockTreeData}
        selectable
        onSelectedFileChange={onSelectedFileChange}
        onFileClick={onFileClick}
        onFolderClick={onFolderClick}
        onExpandedPathsChange={onExpandedPathsChange}
      />,
    );
    expect(container.querySelector('.ant-folder')).toBeTruthy();
  });
});
