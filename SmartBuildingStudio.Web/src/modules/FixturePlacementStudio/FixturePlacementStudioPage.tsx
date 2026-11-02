// src/modules/FixturePlacementStudio/FixturePlacementStudioPage.tsx
//
// Top-level workspace component for FixturePlacementStudio.
//
// Mounted by the router when URL is /designer?mode=fixtures. Reads the
// activation context from URL query params, dispatches loadDocumentThunk,
// and renders the workspace shell: Toolbar / Sidebar / Canvas / Inspector.
//
// Fills the parent container (which may be narrower than the viewport
// when the app sidebar is present). Uses flex + minWidth:0 so the canvas
// yields width to the fixed-width sidebars, and the sidebars can shrink
// if the total available width drops below their preferred values.

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { loadDocumentThunk, saveDocumentThunk } from '@/modules/FixturePlacementStudio/store/fixtureThunks';
import { projectFixturesToElements } from '@/modules/FixturePlacementStudio/store/projectFixturesThunk';
import { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';
import {
  selectLoadStatus,
  selectLoadError,
  selectIsDirty,
  selectFixtures,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import type { ActivationContext } from '@/modules/FixturePlacementStudio/Document/FixtureDocumentManager';
import FixtureCanvas from '@/modules/FixturePlacementStudio/Canvas/FixtureCanvas';
import FixtureLibrary from '@/modules/FixturePlacementStudio/Sidebar/FixtureLibrary';
import RoomListPanel from '@/modules/FixturePlacementStudio/Sidebar/RoomListPanel';
import FixtureToolbar from '@/modules/FixturePlacementStudio/Toolbar/FixtureToolbar';
import InspectorPanel from '@/modules/FixturePlacementStudio/Inspector/InspectorPanel';

// Expose the registry to the canvas (non-serializable session objects).
if (typeof window !== 'undefined') {
  (window as any).__fixtureSessionRegistry = SessionRegistry;
}

export const FixturePlacementStudioPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const loadStatus = useAppSelector(selectLoadStatus);
  const loadError = useAppSelector(selectLoadError);
  const isDirty = useAppSelector(selectIsDirty);
  const fpsFixtures = useAppSelector(selectFixtures);

  const context = useMemo<ActivationContext | null>(() => {
    const documentId = searchParams.get('documentId');
    if (!documentId) return null;

    return {
      documentId,
      projectId: searchParams.get('projectId') ?? '',
      buildingId: searchParams.get('buildingId') ?? '',
      floorId: searchParams.get('floorId') ?? '',
      revision: Number(searchParams.get('revision') ?? '0') || 0,
    };
  }, [searchParams]);

  // ── Load on mount, dispose on unmount ────────────────────────────
  useEffect(() => {
    if (!context) return;
    dispatch(loadDocumentThunk(context));

    return () => {
      SessionRegistry.dispose(context.documentId);
    };
  }, [context, dispatch]);

  // ── Project FPS fixtures into document.elements on every mutation ─
  //
  // `state.fixture.layout.fixtures` is the authoritative FPS
  // population. `document.elements` is the rendering source every
  // module (FPD, FPS, DaliDesigner) reads from. They must stay in
  // sync. This effect is the projection — it rewrites the FPS-owned
  // portion of `document.elements` to match the current layout on
  // every change (place, move, rotate, delete, undo, redo).
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    if (!fpsFixtures) return;
    dispatch(projectFixturesToElements(fpsFixtures));
  }, [dispatch, loadStatus, fpsFixtures]);

  // ── Keyboard: Ctrl+S saves ───────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isSaveCombo =
        (e.ctrlKey || e.metaKey) &&
        (e.key === 's' || e.key === 'S' || e.code === 'KeyS');
      if (!isSaveCombo) return;

      e.preventDefault();
      e.stopPropagation();

      if (!isDirty) return;
      dispatch(saveDocumentThunk() as any);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [dispatch, isDirty]);

  // ── Warn on close with unsaved changes ───────────────────────────
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // ── Render ───────────────────────────────────────────────────────

  if (!context) {
    return (
      <div style={centeredMessage}>
        <div>
          <h2 style={{ color: '#EF4444', fontFamily: 'monospace' }}>Missing documentId</h2>
          <p style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: 12 }}>
            FixturePlacementStudio requires a ?documentId= query parameter.
          </p>
        </div>
      </div>
    );
  }

  if (loadStatus === 'loading' || loadStatus === 'idle') {
    return (
      <div style={centeredMessage}>
        <div style={{ color: '#05FFC4', fontFamily: 'monospace' }}>
          📡 Loading document {context.documentId}...
        </div>
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div style={centeredMessage}>
        <div>
          <h2 style={{ color: '#EF4444', fontFamily: 'monospace' }}>Load failed</h2>
          <p style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: 12 }}>
            {loadError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={workspaceRoot}>
      {/* ── Top bar: file actions + breadcrumbs ─────────────────── */}
      <div style={topBar}>
        <div style={topBarLeft}>
          <span style={brandText}>FIXTURE PLACEMENT</span>
          <span style={separator}>|</span>
          <span style={contextText}>
            Document: {context.documentId}
            {context.floorId ? ` · Floor: ${context.floorId}` : ''}
          </span>
        </div>
        <div style={topBarRight}>
          <FixtureToolbar />
        </div>
      </div>

      {/* ── Main row: Sidebar · Canvas · Inspector ──────────────── */}
      <div style={mainRow}>
        <aside style={leftSidebar}>
          <FixtureLibrary />
          <RoomListPanel />
        </aside>

        <div style={canvasHost}>
          <FixtureCanvas />
        </div>

        <aside style={rightSidebar}>
          <InspectorPanel />
        </aside>
      </div>

      {/* ── Bottom status bar ───────────────────────────────────── */}
      <div style={statusBar}>
        <span>Mode: fixtures</span>
        <span style={{ marginLeft: 'auto' }}>Ctrl+S to save · Esc to cancel placement</span>
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

// Fills the parent container (100% of available width/height) instead
// of 100vw/100vh. Inside <AppShell> the parent is the <main> element,
// which is flex:1 with minWidth:0 — so this workspace correctly shrinks
// to fit beside the app sidebar.
const workspaceRoot: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  background: '#06090F',
  color: '#E2E8F0',
  fontFamily: 'monospace',
  overflow: 'hidden',
  minWidth: 0,
  minHeight: 0,
};

// The top bar grows to fit the toolbar. It has a 40 px minimum so the
// single-row case looks the same as before, but if the toolbar wraps
// (which happens at narrower widths once the File, Edit, and Analysis
// groups are all present), the bar expands and pushes the main row down.
const topBar: React.CSSProperties = {
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  rowGap: 6,
  padding: '6px 16px',
  borderBottom: '1px solid #1E293B',
  background: '#0B0F19',
  flexShrink: 0,
};

const topBarLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0,
};

// Allow the toolbar column to shrink and wrap inside the top bar
// rather than overflow past the right edge. minWidth: 0 is required
// for flex children with wide content; maxWidth: 100% clamps the
// toolbar to the top bar's available width so nothing spills off-screen.
const topBarRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  maxWidth: '100%',
};

const brandText: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'bold',
  color: '#38BDF8',
  letterSpacing: 1,
};

const separator: React.CSSProperties = { color: '#334155' };

const contextText: React.CSSProperties = { fontSize: 10, color: '#64748B' };

const mainRow: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  minWidth: 0,
};

// Sidebars use `flexBasis` for their preferred width but `flexShrink`
// allows them to yield space when the viewport is narrow. `minWidth`
// is set below the preferred width so shrinking is possible, but not
// so small that the panel content becomes unreadable.
const leftSidebar: React.CSSProperties = {
  flex: '0 1 220px',         // 220px preferred, can shrink
  minWidth: 180,             // floor so panel content stays readable
  borderRight: '1px solid #1E293B',
  background: '#0B0F19',
  padding: 12,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const rightSidebar: React.CSSProperties = {
  flex: '0 1 240px',         // 240px preferred, can shrink
  minWidth: 200,             // floor so inspector fields stay usable
  borderLeft: '1px solid #1E293B',
  background: '#0B0F19',
  padding: 12,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

// Canvas is the flexible middle. minWidth:0 allows it to shrink as
// far as needed rather than refusing to shrink and pushing the
// inspector off-screen.
const canvasHost: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  position: 'relative',
  background: '#06090F',
  overflow: 'hidden',
};

const statusBar: React.CSSProperties = {
  height: 28,
  minHeight: 28,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '0 16px',
  borderTop: '1px solid #1E293B',
  background: '#0B0F19',
  fontSize: 10,
  color: '#64748B',
  flexShrink: 0,
};

// Centered messages fill the parent container, not the viewport.
const centeredMessage: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#06090F',
};

export default FixturePlacementStudioPage;