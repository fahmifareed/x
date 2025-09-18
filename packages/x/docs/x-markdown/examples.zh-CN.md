---
title: 代码示例
order: 2
---

## 何时使用

用于渲染 LLM 返回的流式 Markdown 格式。

## 代码演示

<!-- prettier-ignore -->
<code src="./demo/codeDemo/basic.tsx" description="markdown基础语法渲染。" title="基础用法"></code>
<code src="./demo/codeDemo/streaming.tsx" description="配合 `Bubble` 实现流式对话。" title="流式渲染"></code>
<code src="./demo/codeDemo/components.tsx" description="自定义组件渲染标签。" title="自定义组件"></code>
<code src="./demo/codeDemo/supersets.tsx" description="使用插件渲染。" title="插件使用"></code>
<code src="./demo/codeDemo/plugin.tsx" title="自定义拓展插件"></code>
<code src="./demo/codeDemo/xss.tsx"  title="XSS 防御"></code>
<code src="./demo/codeDemo/open-links-in-new-tab.tsx" description="链接在新标签页打开。" title="新标签页打开链接"></code>

## API

<!-- prettier-ignore -->
| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| content | markdown 内容 | `string` | - |
| children | markdown 内容，与 content 作用一样 | `string` | - |
| components | 自定义组件 | `Record<string, React.FC<ComponentProps>>`，查看[详情](/markdowns/components-cn) | - |
| paragraphTag | 自定义段落渲染的标签。避免自定义组件导致 p 标签包裹 div 报错。 | `string` | `p` |
| streaming | 流式渲染配置 | `SteamingOption`，查看[详情](/markdowns/streaming-cn) | - |
| config | Marked.js extension | [`MarkedExtension`](https://marked.js.org/using_advanced#options) | `{ gfm: true }` |
| openLinksInNewTab | 是否在新标签页打开链接 | `boolean` | `false` |
| dompurifyConfig | Dompurify 配置选项，用于自定义 HTML 净化规则 | [`DOMPurify.Config`](https://github.com/cure53/DOMPurify#can-i-configure-dompurify) | - |
| className | 自定义 className | `string` | - |
| rootClassName | 根节点自定义 className, 与 className 作用一致 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - |

### SteamingOption

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| hasNextChunk | 是否还有下一个 chunk，如果为 false，清除所有缓存并渲染 | `boolean` | `false` |
| enableAnimation | 是否开启文字动画，支持 `p, li, h1, h2, h3, h4` | `boolean` | `false` |
| animationConfig | 文字动画配置 | [`ControllerUpdate`](https://react-spring.dev/docs/typescript#controllerupdate) | `{ from: { opacity: 0 }, to: { opacity: 1 }, config: { tension: 170, friction: 26 } }` |

### ComponentProps

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| domNode | Component Element | [`DomNode`](https://github.com/remarkablemark/html-react-parser?tab=readme-ov-file#replace) | - |
| children | 包裹在 component 的内容 | `string` | - |
| **rest** | 组件上的属性，支持标准 HTML 属性（如 `a`(link) href、title）及自定义属性 | `Record<string,unknown>` | - |

## FAQ

### Components 与 Config Marked Extensions 的区别

#### Config Marked Extensions（插件扩展）

`config` 属性中的 [`extensions`](https://marked.js.org/using_pro#extensions) 用于扩展 Markdown 解析器的功能，它们在 **Markdown 转换为 HTML 的过程中** 起作用：

- **作用阶段**：Markdown 解析阶段
- **功能**：识别和转换特殊的 Markdown 语法
- **示例**：将 `[^1]` 脚注语法转换为 `<footnote>1</footnote>` HTML 标签
- **使用场景**：扩展 Markdown 语法，支持更多标记格式

```typescript
// 插件示例：脚注扩展
const footnoteExtension = {
  name: 'footnote',
  level: 'inline',
  start(src) { return src.match(/\[\^/)?.index; },
  tokenizer(src) {
    const rule = /^\[\^([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'footnote',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token) {
    return `<footnote>${token.text}</footnote>`;
  }
};

// 使用插件
<XMarkdown
  content="这是一个脚注示例[^1]"
  config={{ extensions: [footnoteExtension] }}
/>
```

### Components（组件替换）

`components` 属性用于将已生成的 HTML 标签替换为自定义的 React 组件：

- **作用阶段**：HTML 渲染阶段
- **功能**：将 HTML 标签替换为 React 组件
- **示例**：将 `<footnote>1</footnote>` 替换为 `<CustomFootnote>1</CustomFootnote>`
- **使用场景**：自定义标签的渲染样式和交互行为

```typescript
// 自定义脚注组件
const CustomFootnote = ({ children, ...props }) => (
  <sup
    className="footnote-ref"
    onClick={() => console.log('点击脚注:', children)}
    style={{ color: 'blue', cursor: 'pointer' }}
  >
    {children}
  </sup>
);

// 使用组件替换
<XMarkdown
  content="<footnote>1</footnote>"
  components={{ footnote: CustomFootnote }}
/>
```
