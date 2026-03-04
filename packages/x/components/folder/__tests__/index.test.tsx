import React from 'react';

import mountTest from '../../../tests/shared/mountTest';
import rtlTest from '../../../tests/shared/rtlTest';
import { fireEvent, render, waitFakeTimer } from '../../../tests/utils';
import Folder from '../index';

const mockItems = [
  {
    key: '1',
    title: 'Documents',
    type: 'folder' as const,
    children: [
      {
        key: '1-1',
        title: 'file1.txt',
        type: 'file' as const,
      },
      {
        key: '1-2',
        title: 'file2.txt',
        type: 'file' as const,
      },
    ],
  },
  {
    key: '2',
    title: 'Images',
    type: 'folder' as const,
    children: [
      {
        key: '2-1',
        title: 'photo.jpg',
        type: 'file' as const,
      },
    ],
  },
  {
    key: '3',
    title: 'readme.md',
    type: 'file' as const,
  },
];

describe('Folder Component', () => {
  mountTest(() => <Folder />);
  rtlTest(() => <Folder />);

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('Folder component work', () => {
    const { container } = render(<Folder items={mockItems} />);
    const element = container.querySelector<HTMLDivElement>('.ant-folder');
    expect(element).toBeTruthy();
    expect(element).toMatchSnapshot();
  });

  it('Folder renders items correctly', () => {
    const { container } = render(<Folder items={mockItems} />);
    const items = container.querySelectorAll('.ant-folder-item');
    expect(items).toHaveLength(3);

    const folderItems = container.querySelectorAll('.ant-folder-item-folder');
    expect(folderItems).toHaveLength(2);

    const fileItems = container.querySelectorAll('.ant-folder-item-file');
    expect(fileItems).toHaveLength(1);
  });

  it('Folder supports title', () => {
    const { container } = render(<Folder title="My Files" items={mockItems} />);
    const title = container.querySelector<HTMLDivElement>('.ant-folder-title');
    expect(title?.textContent).toBe('My Files');
  });

  it('Folder supports expand/collapse', async () => {
    const { container } = render(<Folder items={mockItems} defaultExpanded={false} />);

    const folderItem = container.querySelector('.ant-folder-item-folder');
    expect(folderItem).toBeTruthy();

    // Initially collapsed
    let children = container.querySelector('.ant-folder-item-children');
    expect(children).toBeNull();

    // Click to expand
    fireEvent.click(folderItem!.querySelector('.ant-folder-item-content')!);
    await waitFakeTimer();

    children = container.querySelector('.ant-folder-item-children');
    expect(children).toBeTruthy();
  });

  it('Folder supports selectable', () => {
    const { container } = render(<Folder items={mockItems} selectable />);

    const firstItem = container.querySelector('.ant-folder-item');
    expect(firstItem).toBeTruthy();

    fireEvent.click(firstItem!);
    expect(firstItem).toHaveClass('ant-folder-item-selected');
  });

  it('Folder supports multiple selection', () => {
    const { container } = render(<Folder items={mockItems} selectable multiple />);

    const items = container.querySelectorAll('.ant-folder-item');
    expect(items).toHaveLength(3);

    fireEvent.click(items[0]);
    fireEvent.click(items[1]);

    expect(items[0]).toHaveClass('ant-folder-item-selected');
    expect(items[1]).toHaveClass('ant-folder-item-selected');
  });

  it('Folder supports className & style', () => {
    const { container } = render(
      <Folder items={mockItems} className="test-className" style={{ backgroundColor: 'green' }} />,
    );
    const element = container.querySelector<HTMLDivElement>('.ant-folder');
    expect(element).toHaveClass('test-className');
    expect(element).toHaveStyle({ backgroundColor: 'green' });
  });

  it('Folder supports ref', () => {
    const ref = React.createRef<any>();
    render(
      <Folder ref={ref} items={mockItems}>
        ref content
      </Folder>,
    );
    expect(ref.current).not.toBeNull();
  });

  it('Folder supports custom icons', () => {
    const customItems = [
      {
        key: '1',
        title: 'Custom Folder',
        type: 'folder' as const,
        icon: <span className="custom-icon">📁</span>,
      },
    ];

    const { container } = render(<Folder items={customItems} />);
    const customIcon = container.querySelector('.custom-icon');
    expect(customIcon).toBeTruthy();
    expect(customIcon?.textContent).toBe('📁');
  });
});
