/**
 * iframe: 600
 */

import type { FolderProps } from '@ant-design/x';
import { Folder } from '@ant-design/x';
import { Button, Card, Flex, Space } from 'antd';
import React, { useState } from 'react';

const treeData: FolderProps['treeData'] = [
  {
    title: 'use-x-chat',
    path: 'use-x-chat',
    children: [
      {
        title: 'skill.md',
        path: 'skill.md',
        content: `---
name: use-x-chat
version: 2.3.0-beta.1
description: Focus on explaining how to use the useXChat Hook, including custom Provider integration, message management, error handling, etc.
---

# 🎯 Skill Positioning

> **Core Positioning**: Use the \`useXChat\` Hook to build professional AI conversation applications **Prerequisites**: Already have a custom Chat Provider (refer to [x-chat-provider skill](../x-chat-provider))

## Table of Contents

- [🚀 Quick Start](#-quick-start)
  - [Dependency Management](#1-dependency-management)
  - [Three-step Integration](#2-three-step-integration)
- [🧩 Core Concepts](#-core-concepts)
  - [Technology Stack Architecture](#technology-stack-architecture)
  - [Data Model](#data-model)
- [🔧 Core Function Details](#-core-function-details)
  - [Message Management](#1-message-management)
  - [Request Control](#2-request-control)
  - [Error Handling](#3-error-handling)
  - [Complete Example Project](#-complete-example-project)
- [📋 Prerequisites and Dependencies](#-prerequisites-and-dependencies)
- [🚨 Development Rules](#-development-rules)
- [🔗 Reference Resources](#-reference-resources)
  - [📚 Core Reference Documentation](#-core-reference-documentation)
  - [🌐 SDK Official Documentation](#-sdk-official-documentation)
  - [💻 Example Code](#-example-code)`,
      },
      {
        title: 'reference',
        path: 'reference',
        children: [
          {
            title: 'API.md',
            path: 'API.md',
            content: `### useXChat

\`\`\`tsx | pure
type useXChat<
  ChatMessage extends SimpleType = object,
  ParsedMessage extends SimpleType = ChatMessage,
  Input = RequestParams<ChatMessage>,
  Output = SSEOutput,
> = (config: XChatConfig<ChatMessage, ParsedMessage, Input, Output>) => XChatConfigReturnType;
\`\`\``,
          },
          {
            title: 'CORE.md',
            path: 'CORE.md',
            content: `### 1. Message Management

#### Get Message List

\`\`\`ts
const { messages } = useXChat({ provider });
// messages structure: MessageInfo<MessageType>[]
// Actual message data is in msg.message
\`\`\``,
          },
          {
            title: 'EXAMPLES.md',
            path: 'EXAMPLES.md',
            content: `# Complete Example Projects

## Project with Conversation Management

\`\`\`tsx
import React, { useRef, useState } from 'react';
import { useXChat } from '@ant-design/x-sdk';
import { chatProvider } from '../services/chatService';
import type { ChatMessage } from '../providers/ChatProvider';
import { Bubble, Sender, Conversations, type ConversationsProps } from '@ant-design/x';
import { GetRef } from 'antd';

const App: React.FC = () => {
  const [conversations, setConversations] = useState([{ key: '1', label: 'New Conversation' }]);
  const [activeKey, setActiveKey] = useState('1');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  
  // ... rest of the implementation
};
export default App;
\`\`\``,
          },
        ],
      },
    ],
  },
];

export default () => {
  const [selectedFile, setSelectedFile] = useState<string[]>(['src', 'components', 'Button.tsx']);
  const [expandedPaths, setExpandedPaths] = useState<string[]>(['src']);

  const handleReset = () => {
    setSelectedFile(['src', 'components', 'Button.tsx']);
    setExpandedPaths(['src']);
  };

  const handleExpandAll = () => {
    setExpandedPaths(['src', 'src/components', 'src/utils']);
  };

  const handleCollapseAll = () => {
    setExpandedPaths([]);
  };

  const handleSelectPackage = () => {
    setSelectedFile(['package.json']);
    setExpandedPaths([]);
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleReset}>
          重置状态
        </Button>
        <Button onClick={handleExpandAll}>展开全部</Button>
        <Button onClick={handleCollapseAll}>收起全部</Button>
        <Button onClick={handleSelectPackage}>选择 package.json</Button>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Space vertical>
          <div>
            <strong>当前选中文件：</strong>{' '}
            {selectedFile && selectedFile.length > 0 ? selectedFile.join('/') : '无'}
          </div>
          <div>
            <strong>展开节点：</strong> {expandedPaths.join(', ') || '无'}
          </div>
        </Space>
      </Card>

      <Folder
        style={{ height: 500 }}
        treeData={treeData}
        directoryTitle={
          <Flex
            style={{
              paddingInline: 16,
              width: '100%',
              paddingBlock: 8,
              borderBottom: '1px solid #f0f0f0',
            }}
            align="center"
          >
            文件浏览器
          </Flex>
        }
        selectedFile={selectedFile}
        onSelectedFileChange={({ path }) => setSelectedFile(path)}
        expandedPaths={expandedPaths}
        onExpandedPathsChange={setExpandedPaths}
      />
    </div>
  );
};
