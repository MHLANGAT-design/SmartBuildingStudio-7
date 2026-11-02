// src/modules/DaliProgrammingStudio/store/programmingSelectors.ts

import type { RootState } from '@/Application/ConfigureStore';
import type { ProgrammingState } from '@/modules/DaliProgrammingStudio/store/programmingTypes';

// Base selector
const selectProgrammingState = (state: RootState): ProgrammingState => (state as any).daliProgramming;

// Data selectors
export const selectApprovedDesign = (state: RootState) => selectProgrammingState(state).approvedDesign;
export const selectProgrammingPlan = (state: RootState) => selectProgrammingState(state).programmingPlan;
export const selectDeploymentProgress = (state: RootState) => selectProgrammingState(state).deploymentProgress;
export const selectDeploymentResult = (state: RootState) => selectProgrammingState(state).deploymentResult;
export const selectVerificationReport = (state: RootState) => selectProgrammingState(state).verificationReport;
export const selectDiagnosticsReport = (state: RootState) => selectProgrammingState(state).diagnosticsReport;
export const selectCurrentDocument = (state: RootState) => selectProgrammingState(state).currentDocument;

// Status selectors
export const selectJobState = (state: RootState) => selectProgrammingState(state).jobState;
export const selectIsCompiling = (state: RootState) => selectProgrammingState(state).isCompiling;
export const selectIsDeploying = (state: RootState) => selectProgrammingState(state).isDeploying;
export const selectIsVerifying = (state: RootState) => selectProgrammingState(state).isVerifying;

// Error selectors
export const selectError = (state: RootState) => selectProgrammingState(state).error;
export const selectWarnings = (state: RootState) => selectProgrammingState(state).warnings;

// Derived selectors
export const selectHasPlan = (state: RootState) => selectProgrammingPlan(state) !== null;
export const selectCanDeploy = (state: RootState) => {
  const state_ = selectProgrammingState(state);
  return state_.programmingPlan !== null 
    && !state_.isCompiling 
    && !state_.isDeploying
    && state_.jobState !== 'DEPLOYING';
};

export const selectDeploymentPercentage = (state: RootState) => {
  const progress = selectDeploymentProgress(state);
  return progress?.percentage || 0;
};

export const selectIsFullyVerified = (state: RootState) => {
  const report = selectVerificationReport(state);
  return report?.isFullyVerified || false;
};