// src/Application/Layout/AppShell.tsx
import React from 'react';
import { Sidebar } from './Sidebar';
import { GlobalZoomControl } from '@/modules/Shared/Zoom/GlobalZoomControl';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        background: '#0B0F19',
        color: '#E2E8F0',
        fontFamily: 'monospace',
        overflow: 'hidden',
        boxSizing: 'border-box',
        margin: 0,
        padding: 0,
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          minWidth: 0,
          minHeight: 0,
          boxSizing: 'border-box',
          position: 'relative',   // ← allows the zoom control to float in this container
        }}
      >
        {children}

        {/* Global zoom control — floats at bottom-LEFT of the content
            area, keeping the bottom-right free for the DALI inspector
            panel and other per-module right-side UI. Same bottom:8
            margin and zIndex as before. */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 16,
            zIndex: 100,
            pointerEvents: 'auto',
          }}
        >
          <GlobalZoomControl />
        </div>
      </main>
    </div>
  );
};

export default AppShell;