// src/Application/ConfigureStore.ts

import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { enableMapSet } from "immer";

import FloorPlanReducer from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import DashboardReducer from "@/modules/Dashboard/Store/DashboardSlice";
import ProjectExplorerReducer from "@/modules/ProjectExplorer/Store/ProjectExplorerSlice";
import FixtureReducer from "@/modules/FixturePlacementStudio/store/fixtureSlice";
import { daliReducer } from "@/modules/DaliDesigner/store/daliSlice";
import { emergencyReducer } from "@/modules/EmergencyLighting/store/emergencySlice";
import { daliProgrammingReducer } from "@/modules/DaliProgrammingStudio/store";
import { commissioningReducer } from "@/modules/Commissioning";
import deviceDiscoveryReducer from "@/modules/DeviceDiscovery/Store/deviceDiscoverySlice";
import documentVersionReducer from "@/modules/Shared/DocumentVersion/documentVersionSlice";
import { fixtureHistoryMiddleware } from "@/modules/FixturePlacementStudio/store/fixtureHistoryMiddleware";

import { ApplicationServices } from "@/Application/ApplicationServices";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ProjectExplorerApi } from "@/modules/ProjectExplorer/Services/ProjectExplorerApi";
import { DeviceDiscoveryApi } from "@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi";

enableMapSet();

let floorPlanApiInstance: any;
try {
  floorPlanApiInstance = new FloorPlanApi();
} catch {
  floorPlanApiInstance = Object.create(FloorPlanApi.prototype);
}

const projectExplorerApiInstance = new ProjectExplorerApi("/api");
const docMgr = floorPlanApiInstance?.getDocumentManager?.() || null;

if (typeof window !== "undefined") {
  (window as any).__sbsDocumentManager = docMgr;
  (window as any).__floorPlanApiInstance = floorPlanApiInstance;
}

const servicesContainer: ApplicationServices = {
  floorPlanApi: floorPlanApiInstance,
  projectExplorerApi: projectExplorerApiInstance,
  // DeviceDiscoveryApi is a plain object (not a class), so no `new`, no
  // try/catch. The USE_MOCK switch lives in Services/apiConfig.ts, so this
  // registration is identical for mock and real backends — flipping the
  // switch is a one-line change there, not here.
  deviceDiscoveryApi: DeviceDiscoveryApi,
};

// `store` is intentionally NOT annotated `: any`. `RootState` must be a real
// type so every selector, thunk, hook, and component in DeviceDiscovery (and
// the rest of the app) is compile-time checked. If removing `: any` surfaces
// a circular-type error, the compiler will name the offending file — the fix
// there is to convert its `RootState` import to `import type { RootState }
// from "@/Application/ConfigureStore"`. Type-only imports are erased and do
// not create runtime cycles. Every DeviceDiscovery file already uses
// `import type`; if a cycle appears, it is in a pre-existing slice/middleware.
export const store = configureStore({
  reducer: {
    floorPlan: FloorPlanReducer,
    dashboard: DashboardReducer,
    projectExplorer: ProjectExplorerReducer,
    fixture: FixtureReducer,
    dali: daliReducer,
    emergency: emergencyReducer,
    daliProgramming: daliProgrammingReducer,
    commissioning: commissioningReducer,
    deviceDiscovery: deviceDiscoveryReducer,
    documentVersion: documentVersionReducer,
  },
  // `getDefaultMiddleware` is left inferred (no `: any`). The middleware chain
  // type flows through `.concat(fixtureHistoryMiddleware)`; if that middleware
  // has a loose type, the compiler will flag it here — not in DeviceDiscovery.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: { extraArgument: { services: servicesContainer } },
      serializableCheck: false,
      immutableCheck: false,
    }).concat(fixtureHistoryMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export interface ThunkApiConfig {
  dispatch: AppDispatch;
  state: RootState;
  extra: { services: ApplicationServices };
}

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

if (typeof window !== "undefined") {
  (window as any).__store = store;
}