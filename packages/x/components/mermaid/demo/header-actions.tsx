import { EditOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Checkbox, message, Space } from 'antd';
import React, { useState } from 'react';
import Mermaid from '../Mermaid';

const App: React.FC = () => {
  const [showZoom, setShowZoom] = useState(true);
  const [showDownload, setShowDownload] = useState(true);
  const [showCopy, setShowCopy] = useState(true);
  const [showCustom, setShowCustom] = useState(false);

  const customActions = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onItemClick: () => {
        message.info('Edit button clicked');
      },
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: 'Share',
      onItemClick: () => {
        message.success('Chart link copied to clipboard');
      },
    },
  ];

  const headerActions = {
    showZoom,
    showDownload,
    showCopy,
    ...(showCustom && { customActions }),
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16, color: '#1a1a1a' }}>Header Actions Configuration</h2>
        <Space size="large" wrap>
          <Checkbox checked={showZoom} onChange={(e) => setShowZoom(e.target.checked)}>
            Show Zoom
          </Checkbox>
          <Checkbox checked={showDownload} onChange={(e) => setShowDownload(e.target.checked)}>
            Show Download
          </Checkbox>
          <Checkbox checked={showCopy} onChange={(e) => setShowCopy(e.target.checked)}>
            Show Copy
          </Checkbox>
          <Checkbox checked={showCustom} onChange={(e) => setShowCustom(e.target.checked)}>
            Show Custom Actions
          </Checkbox>
        </Space>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Mermaid headerActions={headerActions}>
          {`flowchart TD
    A[Start] --> B{Decision Point}
    B -->|Yes| C[Process Data]
    B -->|No| D[Skip Processing]
    C --> E[Generate Report]
    D --> E
    E --> F[End]`}
        </Mermaid>
      </div>
    </div>
  );
};

export default App;
