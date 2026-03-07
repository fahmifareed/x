---
category: Components
group:
  title: Feedback
  order: 4
title: Folder
subtitle: File Tree
description: Display hierarchical relationships of files and folders in a tree structure.
cover: https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*gEo2RrZtK7EAAAAAAAAAAAAADgCCAQ/original
coverDark: https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*Xq4TR7kYo1EAAAAAAAAAAAAADgCCAQ/original
tag: 2.4.0
---

## When to use

- Used to display hierarchical structure of file systems.
- Need to support expand/collapse interactions for folders.
- Need to support selection operations for files and folders.

## Code examples

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">Basic Usage</code>
<code src="./demo/custom-service.tsx">Custom File Service</code>
<code src="./demo/file-controlled.tsx">Controlled File Selection</code>
<code src="./demo/fully-controlled.tsx">Fully Controlled Mode</code>
<code src="./demo/searchable.tsx">Searchable File Tree</code>
<code src="./demo/custom-icons.tsx">Custom Icons</code>

## API

Common props ref: [Common props](/docs/react/common-props)

### FolderProps

| Property | Description | Type | Default | Version |
| --- | --- | --- | --- | --- |
| treeData | File tree data | [FolderTreeNode](#foldertreenode)[] | `[]` | - |
| selectable | Whether to enable selection functionality | boolean | `true` | - |
| selectedFile | Selected file paths (controlled) | string[] | - | - |
| defaultSelectedFile | Default selected file paths | string[] | `[]` | - |
| onSelectedFileChange | Callback when file selection changes | (file: { path: string[]; name?: string; content?: string }) => void | - | - |
| menuWith | Directory tree width | number \| string | `378` | - |
| empty | Content to display when empty | React.ReactNode \| (() => React.ReactNode) | - | - |
| expandedPaths | Array of expanded node paths (controlled) | string[] | - | - |
| defaultExpandedPaths | Array of default expanded node paths | string[] | - | - |
| defaultExpandAll | Whether to expand all nodes by default | boolean | `true` | - |
| onExpandedPathsChange | Callback when expand/collapse changes | (paths: string[]) => void | - | - |
| fileContentService | File content service | [FileContentService](#filecontentservice) | - | - |
| onFileClick | File click event | (filePath: string, content?: string) => void | - | - |
| onFolderClick | Folder click event | (folderPath: string) => void | - | - |
| directoryTitle | Directory tree title | React.ReactNode \| (() => React.ReactNode) | - | - |
| previewTitle | File preview title | string \| (({ title, path, content }: { title: string; path: string[]; content: string }) => React.ReactNode) | - | - |
| directoryIcons | Custom icon configuration | Record<'directory' \| string, React.ReactNode \| (() => React.ReactNode)> | - | - |

### FolderTreeNode

| Property | Description | Type | Default | Version |
| --- | --- | --- | --- | --- |
| title | Display name | string | - | - |
| path | File path | string | - | - |
| content | File content (optional) | string | - | - |
| children | Sub-items (valid only for folder type) | [FolderTreeNode](#foldertreenode)[] | - | - |

### FileContentService

File content service interface, used for dynamically loading file content.

```typescript
interface FileContentService {
  loadFileContent(filePath: string): Promise<string>;
}
```

## Semantic DOM

<code src="./demo/_semantic.tsx" simplify="true"></code>

## Design Token

<ComponentTokenTable component="Folder"></ComponentTokenTable>
