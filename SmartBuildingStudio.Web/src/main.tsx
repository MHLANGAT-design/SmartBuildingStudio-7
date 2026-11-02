// src/main.tsx
import "@/index.css";
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/Application/ConfigureStore';
import { useAppDispatch } from '@/Application/ConfigureStore';

import { bootstrap } from '@/Application/ServiceBootstrap';
import { AppShell } from '@/Application/Layout/AppShell';

import DashboardPage from '@/modules/Dashboard/DashboardPage';
import ProjectExplorerPage from '@/modules/ProjectExplorer/ProjectExplorerPage';
import { FloorPlanDesigner } from '@/modules/FloorPlanDesigner/FloorPlanDesigner';
import { FixturePlacementStudioPage } from '@/modules/FixturePlacementStudio';
import { DaliDesignerPage } from '@/modules/DaliDesigner';
import { DaliProgrammingStudioPage } from '@/modules/DaliProgrammingStudio';
import { EmergencyLightingPage } from '@/modules/EmergencyLighting';
import { ManufacturerAdminPage } from '@/modules/Admin/ManufacturerAdminPage';

import { clearDocument } from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import { resetDaliDocument } from '@/modules/DaliDesigner/store/daliSlice';
import { reset as resetFixture } from '@/modules/FixturePlacementStudio/store/fixtureSlice';

(window as any).store = store;
bootstrap();

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

    dispatch(clearDocument());
    dispatch(resetDaliDocument());
    dispatch(resetFixture());

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

const DaliRoute = () => {
  const { projectId, floorplanId, networkId } = useParams<{
    projectId: string;
    floorplanId: string;
    networkId?: string;
  }>();

  return <DaliDesignerPage />;
};

const DaliProgrammingRoute = () => {
  const { projectId, floorplanId, networkId } = useParams<{
    projectId: string;
    floorplanId: string;
    networkId?: string;
  }>();

  return <DaliProgrammingStudioPage />;
};

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
    case 'programming': {
      const projectId = searchParams.get('projectId') || undefined;
      const floorplanId = searchParams.get('floorplanId') || undefined;
      const networkId = searchParams.get('networkId') || undefined;

      if (!projectId || !floorplanId) {
        return (
          <div style={{ padding: 20, color: '#FFF', fontFamily: 'monospace' }}>
            <h1>DALI Programming &amp; Configuration</h1>
            <p>Missing required context.</p>
            <p>
              Provide <code>?projectId=…&amp;floorplanId=…</code> or open
              the deep link from ProjectExplorer.
            </p>
          </div>
        );
      }

      // Redirect to the canonical deep-link URL so useHydrateDaliDesign
      // reads params from useParams (matching DaliDesignerPage's pattern).
      const target = networkId
        ? `/projects/${projectId}/floorplans/${floorplanId}/programming/${networkId}`
        : `/projects/${projectId}/floorplans/${floorplanId}/programming`;
      return <Navigate to={target} replace />;
    }
    case 'emergency':
      return <EmergencyLightingPage />;
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

          <Route
            path="/projects/:projectId/floorplans/:floorplanId/programming/:networkId?"
            element={<DaliProgrammingRoute />}
          />

          <Route path="/admin/manufacturers" element={<ManufacturerAdminPage />} />

          <Route path="/designer/floorplan" element={<Navigate to="/designer?mode=floorplans" replace />} />
          <Route path="/designer/floorplans" element={<Navigate to="/designer?mode=floorplans" replace />} />
          <Route path="/designer/edit" element={<Navigate to="/designer?mode=floorplans" replace />} />
          <Route path="/designer/fixtures" element={<Navigate to="/designer?mode=fixtures" replace />} />
          <Route path="/designer/dali" element={<Navigate to="/designer?mode=dali" replace />} />
          <Route path="/designer/programming" element={<Navigate to="/designer?mode=programming" replace />} />
          <Route path="/designer/emergency" element={<Navigate to="/designer?mode=emergency" replace />} />

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