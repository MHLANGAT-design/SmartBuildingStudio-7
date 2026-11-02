// src/modules/FixturePlacementStudio/Toolbar/groups/FileGroup.tsx
//
// File operations: Save, Save As, Import, Export.
//
// LEVEL 1 LOCK ENFORCEMENT:
//   When the document is locked by another user, Save / Save As /
//   Import are disabled (they would write to the locked document).
//   Export remains enabled — it reads data, doesn't modify the doc.

import React from 'react';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';
import { SaveButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/SaveButton';
import { SaveAsButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/SaveAsButton';
import { ImportFixturesButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/ImportFixturesButton';
import { ExportButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/ExportButton';

export const FileGroup: React.FC = () => {
  const { isReadOnly, lockedByUsername } = useFixtureLockState();

  const writeTooltip = isReadOnly
    ? `Read-only: document is locked by ${lockedByUsername || 'another user'}`
    : undefined;

  return (
    <div style={group}>
      {/* Save / Save As / Import — write operations, gated in read-only */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          rowGap: 4,
          opacity: isReadOnly ? 0.45 : 1,
          pointerEvents: isReadOnly ? 'none' : 'auto',
          transition: 'opacity 0.15s',
        }}
        title={writeTooltip}
      >
        <SaveButton />
        <SaveAsButton />
        <span style={divider}>|</span>
        <ImportFixturesButton />
      </div>

      {/* Export — read operation, always enabled */}
      <ExportButton />
    </div>
  );
};

const group: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  rowGap: 4,
};

const divider: React.CSSProperties = {
  color: '#334155',
  fontSize: 11,
  userSelect: 'none',
  margin: '0 2px',
};

export default FileGroup;