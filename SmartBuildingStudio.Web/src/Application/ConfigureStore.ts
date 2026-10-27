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
import { fixtureHistoryMiddleware } from "@/modules/FixturePlacementStudio/store/fixtureHistoryMiddleware";

import { ApplicationServices } from "@/Application/ApplicationServices";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ProjectExplorerApi } from "@/modules/ProjectExplorer/Services/ProjectExplorerApi";

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
};

export const store = configureStore({
  reducer: {
    floorPlan: FloorPlanReducer,
    dashboard: DashboardReducer,
    projectExplorer: ProjectExplorerReducer,
    fixture: FixtureReducer,
    dali: daliReducer,
    emergency: emergencyReducer,
  },
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