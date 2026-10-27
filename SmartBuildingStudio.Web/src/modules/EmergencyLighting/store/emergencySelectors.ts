// src/modules/EmergencyLighting/store/emergencySelectors.ts

import { RootState } from '@/Application/ConfigureStore';

export const selectEmergencyState = (state: RootState) => state.emergency;
export const selectEmergencyDocument = (state: RootState) => state.emergency.document;
export const selectEmergencyIssues = (state: RootState) => state.emergency.document?.complianceIssues || [];
export const selectExitRoutes = (state: RootState) => state.emergency.document?.exitRoutes || [];
export const selectLayerVisibility = (state: RootState) => state.emergency.layerVisibility;
export const selectActivePanel = (state: RootState) => state.emergency.ui.activePanel;
export const selectIsLoading = (state: RootState) => state.emergency.status === 'loading';