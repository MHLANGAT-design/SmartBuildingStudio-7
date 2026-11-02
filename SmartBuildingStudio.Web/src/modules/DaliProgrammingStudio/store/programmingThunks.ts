// src/modules/DaliProgrammingStudio/store/programmingThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';

import { DaliDesignIntegrationService } from '@/modules/DaliProgrammingStudio/Services/DaliDesignIntegrationService';
import { ProgrammingService } from '@/modules/DaliProgrammingStudio/Services/ProgrammingService';
import { VerificationService } from '@/modules/DaliProgrammingStudio/Services/VerificationService';

import {
  setCompilingStatus,
  setDeployingStatus,
  setVerifyingStatus,
  setApprovedDesign,
  setProgrammingPlan,
  setDeploymentProgress,
  setDeploymentResult,
  setVerificationReport,
  setError,
  setCompileErrors,
} from '@/modules/DaliProgrammingStudio/store/programmingSlice';

export const loadApprovedDesign = createAsyncThunk<
  ApprovedDaliDesign,
  { projectId: string },
  { rejectValue: string }
>(
  'daliProgramming/loadApprovedDesign',
  async ({ projectId }, { dispatch, rejectWithValue }) => {
    try {
      const service = new DaliDesignIntegrationService();
      const design = await (service as any).fetchApprovedDesign(projectId); 
      dispatch(setApprovedDesign(design));
      return design;
    } catch (e: any) {
      dispatch(setError(e.message || 'Failed to load design'));
      return rejectWithValue(e.message);
    }
  }
);

export const compileDesign = createAsyncThunk<
  ProgrammingPlan | null,
  { service: ProgrammingService },
  { state: RootState; rejectValue: string }
>(
  'daliProgramming/compileDesign',
  async ({ service }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as any;
    const design = state.daliProgramming.approvedDesign;
    
    if (!design) {
      return rejectWithValue('No approved design loaded');
    }

    dispatch(setCompilingStatus(true));
    dispatch(setCompileErrors([])); 
    dispatch(setError(null));       

    try {
      const { plan, errors } = service.compile(design);
      
      if (!plan) {
        dispatch(setCompileErrors(errors)); 
        return rejectWithValue('Compilation failed');
      }
      dispatch(setProgrammingPlan(plan));
      return plan;
    } catch (e: any) {
      dispatch(setError(e.message || 'Unknown compilation error'));
      return rejectWithValue(e.message || 'Unknown compilation error');
    } finally {
      dispatch(setCompilingStatus(false));
    }
  }
);

export const deployPlan = createAsyncThunk<
  DeploymentResult,
  { service: ProgrammingService; plan: ProgrammingPlan; gatewayId: string; lineId: string },
  { rejectValue: string }
>(
  'daliProgramming/deployPlan',
  async ({ service, plan, gatewayId, lineId }, { dispatch, rejectWithValue }) => {
    dispatch(setDeployingStatus(true));
    try {
      const onProgress = (progress: DeploymentProgress) => {
        dispatch(setDeploymentProgress(progress));
      };

      const result = await service.deploy(`job_${Date.now()}`, plan, gatewayId, lineId, onProgress);
      dispatch(setDeploymentResult(result));
      return result;
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setDeployingStatus(false));
    }
  }
);

export const verifyDeployment = createAsyncThunk<
  VerificationReport,
  { service: VerificationService; deploymentId: string; devices: any[] },
  { rejectValue: string }
>(
  'daliProgramming/verifyDeployment',
  async ({ service, deploymentId, devices }, { dispatch, rejectWithValue }) => {
    dispatch(setVerifyingStatus(true));
    try {
      const report = await service.verifyDeployment(deploymentId, devices);
      dispatch(setVerificationReport(report));
      return report;
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setVerifyingStatus(false));
    }
  }
);