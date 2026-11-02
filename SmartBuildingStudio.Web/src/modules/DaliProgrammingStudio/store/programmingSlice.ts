// src/modules/DaliProgrammingStudio/store/programmingSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProgrammingState } from '@/modules/DaliProgrammingStudio/store/programmingTypes';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';
import type { CompilationError } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';
import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import { PROGRAMMING_JOB_STATES } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

const initialState: ProgrammingState = {
  currentDocument: null,
  approvedDesign: null,
  programmingPlan: null,
  pastPlans: [],
  futurePlans: [],
  deploymentProgress: null,
  deploymentResult: null,
  verificationReport: null,
  diagnosticsReport: null,
  jobState: PROGRAMMING_JOB_STATES.DRAFT,
  isCompiling: false,
  isDeploying: false,
  isVerifying: false,
  error: null,
  compileErrors: [],
  warnings: [],
};

export const programmingSlice = createSlice({
  name: 'daliProgramming',
  initialState,
  reducers: {
    setApprovedDesign: (state, action: PayloadAction<ApprovedDaliDesign>) => {
      state.approvedDesign = action.payload;
      state.jobState = PROGRAMMING_JOB_STATES.DESIGN_LOADED;
      state.error = null;
      state.compileErrors = [];
      state.pastPlans = [];
      state.futurePlans = [];
    },

    setCurrentDocument: (state, action: PayloadAction<ProgrammingDocument | null>) => {
      state.currentDocument = action.payload;
      if (action.payload) {
        state.jobState = action.payload.state;
      }
    },

    setProgrammingPlan: (state, action: PayloadAction<ProgrammingPlan>) => {
      if (state.programmingPlan) {
        state.pastPlans.push(state.programmingPlan);
        state.futurePlans = [];
      }
      state.programmingPlan = action.payload;
      state.jobState = PROGRAMMING_JOB_STATES.COMPILED;
    },

    appendSequencesToPlan: (state, action: PayloadAction<DaliCommandSequence[]>) => {
      if (!state.programmingPlan) return;
      
      const existingIds = new Set(state.programmingPlan.sequences.map(s => s.id));
      const newSequences = action.payload.filter(s => !existingIds.has(s.id));
      
      if (newSequences.length === 0) return;

      const previousPlan = JSON.parse(JSON.stringify(state.programmingPlan));
      state.pastPlans.push(previousPlan);
      state.futurePlans = [];

      state.programmingPlan.sequences.push(...newSequences);
      state.programmingPlan.totalCommands += newSequences.reduce((sum, s) => sum + s.commands.length, 0);
    },

    undo: (state) => {
      if (state.pastPlans.length === 0 || !state.programmingPlan) return;
      
      const currentPlanClone = JSON.parse(JSON.stringify(state.programmingPlan));
      state.futurePlans.push(currentPlanClone);
      
      const previousPlan = state.pastPlans.pop()!;
      state.programmingPlan = previousPlan;
    },

    redo: (state) => {
      if (state.futurePlans.length === 0 || !state.programmingPlan) return;
      
      const currentPlanClone = JSON.parse(JSON.stringify(state.programmingPlan));
      state.pastPlans.push(currentPlanClone);
      
      const nextPlan = state.futurePlans.pop()!;
      state.programmingPlan = nextPlan;
    },

    setCompilingStatus: (state, action: PayloadAction<boolean>) => {
      state.isCompiling = action.payload;
      if (action.payload) state.jobState = PROGRAMMING_JOB_STATES.COMPILING;
    },

    setDeployingStatus: (state, action: PayloadAction<boolean>) => {
      state.isDeploying = action.payload;
      if (action.payload) state.jobState = PROGRAMMING_JOB_STATES.DEPLOYING;
    },

    setVerifyingStatus: (state, action: PayloadAction<boolean>) => {
      state.isVerifying = action.payload;
    },

    setDeploymentProgress: (state, action: PayloadAction<DeploymentProgress>) => {
      state.deploymentProgress = action.payload;
    },

    setDeploymentResult: (state, action: PayloadAction<DeploymentResult>) => {
      state.deploymentResult = action.payload;
      state.jobState = action.payload.success 
        ? PROGRAMMING_JOB_STATES.COMPLETED 
        : PROGRAMMING_JOB_STATES.FAILED;
    },

    setVerificationReport: (state, action: PayloadAction<VerificationReport>) => {
      state.verificationReport = action.payload;
    },

    setDiagnosticsReport: (state, action: PayloadAction<DiagnosticsReport>) => {
      state.diagnosticsReport = action.payload;
    },

    setJobState: (state, action: PayloadAction<typeof PROGRAMMING_JOB_STATES[keyof typeof PROGRAMMING_JOB_STATES]>) => {
      state.jobState = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setCompileErrors: (state, action: PayloadAction<CompilationError[]>) => {
      state.compileErrors = action.payload;
      state.error = action.payload.length > 0 ? 'Compilation Failed' : null;
    },

    addWarning: (state, action: PayloadAction<string>) => {
      state.warnings.push(action.payload);
    },

    clearWarnings: (state) => {
      state.warnings = [];
    },

    resetProgrammingState: () => initialState,
  },
});

// CRITICAL: ALL ACTIONS MUST BE EXPORTED HERE
export const {
  setApprovedDesign,
  setCurrentDocument,
  setProgrammingPlan,
  appendSequencesToPlan,
  undo,
  redo,
  setCompilingStatus,
  setDeployingStatus,
  setVerifyingStatus,
  setDeploymentProgress,
  setDeploymentResult,
  setVerificationReport,
  setDiagnosticsReport,
  setJobState,
  setError,
  setCompileErrors,
  addWarning,
  clearWarnings,
  resetProgrammingState,
} = programmingSlice.actions;

export default programmingSlice.reducer;