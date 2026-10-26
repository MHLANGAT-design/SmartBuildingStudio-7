// src/modules/FloorPlanDesigner/Toolbar/CameraToolbar.tsx
import React from "react";
import { ZoomIn, ZoomOut, Maximize2, SquareDashed, Hand, MousePointer2 } from "lucide-react";

export type CameraTool = "select" | "pan" | "window";

export interface CameraToolbarProps {
  tool: CameraTool;
  onTool: (tool: CameraTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/**
 * 🚀 COMPACT FLOATING CAMERA TOOLBAR
 * Floating CAD navigation control with smaller, sleeker buttons.
 * Debug logging added to trace tool activation.
 */
export function CameraToolbar({
  tool,
  onTool,
  onZoomIn,
  onZoomOut,
  onFit,
}: CameraToolbarProps) {
  
  const btn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    toolId?: string
  ) => {
    const handleClick = () => {
      console.log(`[CameraToolbar] Button clicked: ${label} (${toolId || 'action'})`);
      onClick();
    };
    return (
      <button
        onClick={handleClick}
        title={label}
        type="button"
        style={{
          width: '32px',
          height: '32px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '6px',
          border: active ? '1px solid #38BDF8' : '1px solid transparent',
          background: active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
          color: active ? '#38BDF8' : '#94A3B8',
          cursor: 'pointer',
          transition: 'all 0.15s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent';
        }}
      >
        {icon}
      </button>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 8px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        userSelect: 'none',
      }}
    >
      {btn(tool === "select", () => onTool("select"), <MousePointer2 size={14} />, "Select Mode", "select")}
      {btn(tool === "pan", () => onTool("pan"), <Hand size={14} />, "Pan Instrument", "pan")}
      {btn(tool === "window", () => onTool("window"), <SquareDashed size={14} />, "Window Zoom Selector", "window")}
      
      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
      
      {btn(false, onZoomIn, <ZoomIn size={14} />, "Zoom In")}
      {btn(false, onZoomOut, <ZoomOut size={14} />, "Zoom Out")}
      {btn(false, onFit, <Maximize2 size={14} />, "Fit to View")}
    </div>
  );
}

export default CameraToolbar;