---
category: Components
group:
  title: Feedback
  order: 4
title: Mermaid
description: Used to render diagrams with Mermaid.
cover: https://mdn.alipayobjects.com/huamei_lkxviz/afts/img/yTn9SILS900AAAAAPaAAAAgADtFMAQFr/original
coverDark: https://mdn.alipayobjects.com/huamei_lkxviz/afts/img/uYcMRYLDTCMAAAAAQBAAAAgADtFMAQFr/original
tag: 2.1.0
---

## When to Use

- Used to render interactive Mermaid diagrams that support zooming, panning, and switching between image and code views in applications.
- When used together with XMarkdown, it can render Mermaid diagrams within Markdown content and enhance interactive features.

## Code Demo

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">Basic</code>
<code src="./demo/custom-header.tsx">Custom Header</code>
<code src="./demo/header-actions.tsx">Header Actions</code>
<code src="./demo/with-xmarkdown.tsx">With XMarkdown</code>

## API

<!-- prettier-ignore -->
| Property | Description | Type | Default |
| --- | --- | --- | --- |
| children | Code content | `string` | - |
| header | Header | `React.ReactNode \| null` | React.ReactNode |
| className | Style class name | `string` | - |
| classNames | Style class name | `Partial<Record<'root' \| 'header' \| 'graph' \| 'code', string>>` | - |
| styles | Style object | `Partial<Record<'root' \| 'header' \| 'graph' \| 'code', React.CSSProperties>>` | - |
| highlightProps | Code highlighting configuration | [`highlightProps`](https://github.com/react-syntax-highlighter/react-syntax-highlighter?tab=readme-ov-file#props) | - |
| config | Mermaid configuration | `MermaidConfig` | - |
| headerActions | Header actions configuration | `{ showZoom?: boolean; showDownload?: boolean; showCopy?: boolean; customActions?: ItemType[] }` | `{ showZoom: true, showDownload: true, showCopy: true }` |
| onRenderTypeChange | Callback when render type changes | `(value: 'image' \| 'code') => void` | - |
| prefixCls | Style prefix | `string` | - |
| style | Custom style | `React.CSSProperties` | - |

## Semantic DOM

<code src="./demo/_semantic.tsx" simplify="true"></code>

## Theme Variables (Design Token)

<ComponentTokenTable component="Mermaid"></ComponentTokenTable>
