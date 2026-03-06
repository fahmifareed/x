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
<code src="./demo/custom-service.tsx">自定义文件服务</code>
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
| expandedPaths | 展开的节点路径数组（受控） | string[] | - | - |
| defaultExpandedPaths | 默认展开的节点路径数组 | string[] | `[]` | - |
| onExpandedPathsChange | 展开/收起变化时的回调 | (paths: string[]) => void | - | - |
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

<code src="./demo/_semantic.tsx" simplify="true"></code>

## 主题变量（Design Token）

<ComponentTokenTable component="Folder"></ComponentTokenTable>
