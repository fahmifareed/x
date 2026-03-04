---
category: Components
group:
  title: 反馈
  order: 4
title: Folder
subtitle: 文件夹
description: 以树形结构展示文件和文件夹层级关系。
cover: https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*gEo2RrZtK7EAAAAAAAAAAAAADgCCAQ/original
coverDark: https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*Xq4TR7kYo1EAAAAAAAAAAAAADgCCAQ/original
tag: 2.0.0
---

## 何时使用

- 用于展示文件系统的层级结构。
- 需要支持文件夹的展开/收起交互。
- 需要支持文件和文件夹的选择操作。

## 代码演示

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">基本用法</code>
<code src="./demo/tree-only.tsx">仅树形结构</code>
<code src="./demo/custom-service.tsx">自定义文件服务</code>
<code src="./demo/expand-controlled.tsx">受控展开状态</code>
<code src="./demo/select-controlled.tsx">受控选择状态</code>
<code src="./demo/file-controlled.tsx">受控文件选择</code>
<code src="./demo/fully-controlled.tsx">完全受控模式</code>

## API

通用属性参考：[通用属性](/docs/react/common-props)

### FolderProps

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| treeData | 文件树数据 | [FileTreeNode](#filetreenode)[] | `[]` | - |
| mode | 展示模式 | `tree` \| `tree-with-preview` | `tree-with-preview` | - |
| height | 组件高度 | number | `400` | - |
| selectable | 是否开启选择功能 | boolean | `false` | - |
| selectedFile | 选中的文件路径（受控） | string \| null | - | - |
| defaultSelectedFile | 默认选中的文件路径 | string | - | - |
| onSelectedFileChange | 文件选择变化时的回调 | (filePath: string \| null, content?: string) => void | - | - |
| multiple | 是否支持多选 | boolean | `false` | - |
| expandedKeys | 展开的节点 key 数组（受控） | string[] | - | - |
| defaultExpandedKeys | 默认展开的节点 key 数组 | string[] | `[]` | - |
| onExpand | 展开/收起变化时的回调 | (keys: string[]) => void | - | - |
| fileContentService | 文件内容服务 | [FileContentService](#filecontentservice) | - | - |
| classNames | 语义化结构的自定义类名 | [FolderClassNames](#folderclassnames) | - | - |
| styles | 语义化结构的自定义样式 | [FolderStyles](#folderstyles) | - | - |

### FolderItem

| 属性     | 说明                     | 类型                        | 默认值 | 版本 |
| -------- | ------------------------ | --------------------------- | ------ | ---- |
| key      | 唯一标识符               | string                      | -      | -    |
| title    | 显示名称                 | string                      | -      | -    |
| type     | 类型                     | 'file' \| 'folder'          | -      | -    |
| children | 子项（仅文件夹类型有效） | [FolderItem](#folderitem)[] | -      | -    |
| icon     | 自定义图标               | React.ReactNode             | -      | -    |

### FileTreeNode

| 属性     | 说明                     | 类型                            | 默认值 | 版本 |
| -------- | ------------------------ | ------------------------------- | ------ | ---- |
| key      | 唯一标识符               | string                          | -      | -    |
| title    | 显示名称                 | string                          | -      | -    |
| path     | 文件路径                 | string                          | -      | -    |
| type     | 类型                     | 'file' \| 'folder'              | -      | -    |
| content  | 文件内容（可选）         | string                          | -      | -    |
| children | 子项（仅文件夹类型有效） | [FileTreeNode](#filetreenode)[] | -      | -    |
| icon     | 自定义图标               | React.ReactNode                 | -      | -    |

### Semantic ClassNames

#### FolderClassNames

```typescript
interface FolderClassNames {
  root?: string;
  tree?: string;
  preview?: string;
  header?: string;
  content?: string;
}
```

### Semantic Styles

#### FolderStyles

```typescript
interface FolderStyles {
  root?: React.CSSProperties;
  tree?: React.CSSProperties;
  preview?: React.CSSProperties;
  header?: React.CSSProperties;
  content?: React.CSSProperties;
}
```

## 语义化 DOM

<!-- <code src="./demo/_semantic.tsx" simplify="true"></code> -->

## 受控模式

Folder 组件支持多种受控模式，可以通过外部状态完全控制组件行为。

### 受控属性

组件支持以下受控属性：

- **selectedFile**: 控制选中的文件
- **expandedKeys**: 控制展开的节点

### 使用示例

#### 受控文件选择

```typescript
import React, { useState } from 'react';
import { Folder } from '@ant-design/x';

const App = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>('src/App.tsx');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['src']);

  return (
    <Folder
      treeData={treeData}
      selectable
      selectedFile={selectedFile}
      onSelectedFileChange={setSelectedFile}
      expandedKeys={expandedKeys}
      onExpand={setExpandedKeys}
    />
  );
};
```

## 文件内容服务

### FileContentService

文件内容服务用于异步加载文件内容，支持本地文件和模拟数据。

#### 内置服务

- **LocalFileContentService**: 本地文件内容加载服务
- **MockFileContentService**: 模拟文件内容服务
- **defaultMockService**: 默认的模拟服务实例

#### 使用示例

```typescript
import { Folder, LocalFileContentService } from '@ant-design/x';

const fileService = new LocalFileContentService('/api/files');

const App = () => {
  const [treeData] = useState([
    {
      title: 'src',
      path: 'src',
      type: 'folder',
      key: 'src',
      children: [
        {
          title: 'App.tsx',
          path: 'src/App.tsx',
          type: 'file',
          key: 'src/App.tsx',
        },
      ],
    },
  ]);

  return (
    <Folder
      treeData={treeData}
      height={500}
      mode="tree-with-preview"
      fileContentService={fileService}
    />
  );
};
```

## 主题变量（Design Token）

<ComponentTokenTable component="Folder"></ComponentTokenTable>
