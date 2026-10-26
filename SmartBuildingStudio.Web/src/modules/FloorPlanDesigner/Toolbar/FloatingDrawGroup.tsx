// src/modules/FloorPlanDesigner/Toolbar/FloatingDrawGroup.tsx
//
// Floating drawing-tools pill anchored at the bottom-centre of the
// viewport. Wraps the DrawGroup so drawing tools are available from any
// canvas scroll position.
//
// LEVEL 1 READ-ONLY: accepts isReadOnly and forwards it to DrawGroup.
// The pill's background dims when read-only so it's visually obvious
// the drawing tools aren't available. Individual buttons inside
// DrawGroup are disabled by DrawGroup itself when isReadOnly is true.

import React from "react";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { DrawGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/DrawGroup";

export interface FloatingDrawGroupProps {
  toolManager: ToolManager;
  isReadOnly?: boolean;
}

export const FloatingDrawGroup: React.FC<FloatingDrawGroupProps> = ({
  toolManager,
  isReadOnly = false,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: isReadOnly
          ? 'rgba(15, 23, 42, 0.55)'
          : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: isReadOnly ? '1px solid rgba(255, 184, 0, 0.4)' : '1px solid #1E293B',
        borderRadius: '12px',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: 'auto',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
      title={isReadOnly ? "Read-only: drawing tools disabled" : undefined}
    >
      <DrawGroup toolManager={toolManager} isReadOnly={isReadOnly} />
    </div>
  );
};

export default FloatingDrawGroup;