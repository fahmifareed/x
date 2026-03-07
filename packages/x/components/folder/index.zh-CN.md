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
tag: 2.4.0
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
<code src="./demo/searchable.tsx">可搜索的文件树</code>
<code src="./demo/custom-icons.tsx">自定义图标</code>

## API

通用属性参考：[通用属性](/docs/react/common-props)

### FolderProps

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| treeData | 文件树数据 | [FolderTreeNode](#foldertreenode)[] | `[]` | - |
| selectable | 是否开启选择功能 | boolean | `true` | - |
| selectedFile | 选中的文件路径（受控） | string[] | - | - |
| defaultSelectedFile | 默认选中的文件路径 | string[] | `[]` | - |
| onSelectedFileChange | 文件选择变化时的回调 | (file: { path: string[]; name?: string; content?: string }) => void | - | - |
| menuWith | 目录树宽度 | number \| string | `378` | - |
| empty | 空状态时的展示内容 | React.ReactNode \| (() => React.ReactNode) | - | - |
| expandedPaths | 展开的节点路径数组（受控） | string[] | - | - |
| defaultExpandedPaths | 默认展开的节点路径数组 | string[] | - | - |
| defaultExpandAll | 是否默认展开所有节点 | boolean | `true` | - |
| onExpandedPathsChange | 展开/收起变化时的回调 | (paths: string[]) => void | - | - |
| fileContentService | 文件内容服务 | [FileContentService](#filecontentservice) | - | - |
| onFileClick | 文件点击事件 | (filePath: string, content?: string) => void | - | - |
| onFolderClick | 文件夹点击事件 | (folderPath: string) => void | - | - |
| directoryTitle | 目录树标题 | React.ReactNode \| (() => React.ReactNode) | - | - |
| previewTitle | 文件预览标题 | string \| (({ title, path, content }: { title: string; path: string[]; content: string }) => React.ReactNode) | - | - |
| directoryIcons | 自定义图标配置 | Record<'directory' \| string, React.ReactNode \| (() => React.ReactNode)> | - | - |
| classNames | 语义化结构的自定义类名 | [FolderClassNames](#folderclassnames) | - | - |
| styles | 语义化结构的自定义样式 | [FolderStyles](#folderstyles) | - | - |

### FolderTreeNode

| 属性     | 说明                     | 类型                                | 默认值 | 版本 |
| -------- | ------------------------ | ----------------------------------- | ------ | ---- |
| title    | 显示名称                 | string                              | -      | -    |
| path     | 文件路径                 | string                              | -      | -    |
| content  | 文件内容（可选）         | string                              | -      | -    |
| children | 子项（仅文件夹类型有效） | [FolderTreeNode](#foldertreenode)[] | -      | -    |

### FileContentService

文件内容服务接口，用于动态加载文件内容。

```typescript
interface FileContentService {
  loadFileContent(filePath: string): Promise<string>;
}
```

## 语义化 DOM

<code src="./demo/_semantic.tsx" simplify="true"></code>

## 主题变量（Design Token）

<ComponentTokenTable component="Folder"></ComponentTokenTable>
