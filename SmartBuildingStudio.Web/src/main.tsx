// src/main.tsx
import "@/index.css";
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/Application/ConfigureStore';
import { useAppDispatch } from '@/Application/ConfigureStore';

// ── Service bootstrap — wires module-level singletons before render ──
import { bootstrap } from '@/Application/ServiceBootstrap';

// Layout
import { AppShell } from '@/Application/Layout/AppShell';

// Core Application Pages Layout Assets
import DashboardPage from '@/modules/Dashboard/DashboardPage';
import ProjectExplorerPage from '@/modules/ProjectExplorer/ProjectExplorerPage';
import { FloorPlanDesigner } from '@/modules/FloorPlanDesigner/FloorPlanDesigner';
import { FixturePlacementStudioPage } from '@/modules/FixturePlacementStudio';
import { DaliDesignerPage } from '@/modules/DaliDesigner';
import { ManufacturerAdminPage } from '@/modules/Admin/ManufacturerAdminPage';

// Slice actions used by the document boundary.
import { clearDocument } from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import { resetDaliDocument } from '@/modules/DaliDesigner/store/daliSlice';
import { reset as resetFixture } from '@/modules/FixturePlacementStudio/store/fixtureSlice';

(window as any).store = store;

// ── Bootstrap services before the store is touched by any component. ─
bootstrap();

/**
 * DocumentBoundary — clears document-scoped state when the URL's
 * documentId changes.
 */
const DocumentBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const lastDocIdRef = useRef<string | null>(null);

  const urlDocumentId =
    searchParams.get('documentId') || searchParams.get('id');

  useEffect(() => {
    if (!urlDocumentId) return;
    if (lastDocIdRef.current === urlDocumentId) return;

    lastDocIdRef.current = urlDocumentId;

    console.log('[DocumentBoundary] document changed — clearing slices', {
      to: urlDocumentId,
    });

    // Floor plan slice: geometry, elements, fixtures, metadata.
    dispatch(clearDocument());

    // DALI slice: fixtures, groups, scenes, networks, selection.
    dispatch(resetDaliDocument());

    // Fixture Placement slice: layout, placed fixtures, zones, calculations.
    dispatch(resetFixture());

    // Legacy globals that mirror document state.
    if (typeof window !== 'undefined') {
      const win = window as any;
      win.__persistentDwgVectorBackupCache = [];
      win.__floorPlanActiveDocumentInstance = null;
      win.__viewportState = undefined;
      win.__viewportInstance = undefined;
      win.__floorPlanActiveViewportInstance = undefined;
    }
  }, [urlDocumentId, dispatch]);

  return <>{children}</>;
};

/**
 * Deep-link route wrapper for the DALI Designer.
 */
const DaliRoute = () => {
  const { projectId, floorplanId, networkId } = useParams<{
    projectId: string;
    floorplanId: string;
    networkId?: string;
  }>();

  return <DaliDesignerPage />;
};

/**
 * Designer route dispatcher.
 */
const DesignerRoute = () => {
  const [searchParams] = useSearchParams();
  const rawMode = (searchParams.get('mode') || 'floorplans').toLowerCase();
  const mode = rawMode === 'edit' ? 'floorplans' : rawMode;

  switch (mode) {
    case 'fixtures':
      return <FixturePlacementStudioPage />;
    case 'dali': {
      const projectId = searchParams.get('projectId') || undefined;
      const floorplanId = searchParams.get('floorplanId') || undefined;
      const networkId = searchParams.get('networkId') || undefined;

      if (!projectId || !floorplanId) {
        return (
          <div style={{ padding: 20, color: '#FFF', fontFamily: 'monospace' }}>
            <h1>DALI Designer</h1>
            <p>Missing required context.</p>
            <p>
              Provide <code>?projectId=…&amp;floorplanId=…</code> or open
              the deep link from ProjectExplorer.
            </p>
          </div>
        );
      }

      return <DaliDesignerPage />;
    }
    case 'emergency':
      return (
        <div style={{ padding: 20, color: '#FFF', fontFamily: 'monospace' }}>
          <h1>Module Not Yet Available</h1>
          <p>Mode: {mode}</p>
        </div>
      );
    case 'import':
    case 'floorplans':
    default:
      return <FloorPlanDesigner />;
  }
};

const App = () => {
  return (
    <DocumentBoundary>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/explorer" element={<ProjectExplorerPage />} />

          <Route path="/floor-plan-designer" element={<FloorPlanDesigner />} />

          <Route path="/designer" element={<DesignerRoute />} />

          <Route
            path="/projects/:projectId/floorplans/:floorplanId/dali/:networkId?"
            element={<DaliRoute />}
          />

          {/* Admin */}
          <Route path="/admin/manufacturers" element={<ManufacturerAdminPage />} />

          <Route
            path="/designer/floorplan"
            element={<Navigate to="/designer?mode=floorplans" replace />}
          />
          <Route
            path="/designer/floorplans"
            element={<Navigate to="/designer?mode=floorplans" replace />}
          />
          <Route
            path="/designer/edit"
            element={<Navigate to="/designer?mode=floorplans" replace />}
          />
          <Route
            path="/designer/fixtures"
            element={<Navigate to="/designer?mode=fixtures" replace />}
          />
          <Route
            path="/designer/dali"
            element={<Navigate to="/designer?mode=dali" replace />}
          />
          <Route
            path="/designer/emergency"
            element={<Navigate to="/designer?mode=emergency" replace />}
          />

          <Route
            path="*"
            element={
              <div style={{ padding: '20px', color: '#FFF' }}>
                <h1>404: Module Resource Not Found</h1>
              </div>
            }
          />
        </Routes>
      </AppShell>
    </DocumentBoundary>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);