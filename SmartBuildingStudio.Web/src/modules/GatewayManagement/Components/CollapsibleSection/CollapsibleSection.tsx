// src/modules/GatewayManagement/Components/CollapsibleSection/CollapsibleSection.tsx

import React, { useState } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<Props> = ({
  title,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #1F2937', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          color: '#94A3B8',
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 9, color: '#64748B', width: 10 }}>
          {open ? '▼' : '▶'}
        </span>
        {title}
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px 12px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;