// src/modules/DaliProgrammingStudio/hooks/useDaliDesign.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectApprovedDesign, 
  selectIsCompiling,
  selectError 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { 
  setApprovedDesign, 
  setError,
  setCurrentDocument,
} from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { DaliDesignIntegrationService } from '@/modules/DaliProgrammingStudio/Services/DaliDesignIntegrationService';
import { PROGRAMMING_JOB_STATES } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export function useDaliDesign() {
  const dispatch = useAppDispatch();
  const design = useAppSelector(selectApprovedDesign);
  const isCompiling = useAppSelector(selectIsCompiling);
  const error = useAppSelector(selectError);

  const loadDesign = useCallback(() => {
    try {
      const service = new DaliDesignIntegrationService();
      const rootState = (window as any).store.getState();
      const approved = service.fetchApprovedDesign(rootState);
      
      dispatch(setApprovedDesign(approved));

      // Also create an active programming job document so the Jobs panel
      // (ProgrammingJobExplorer, ProgrammingJobsPanel, JobDetailsPanel)
      // has data to display. Without this, selectCurrentDocument returns
      // null and the panel shows "No active job".
      const jobDoc = {
        documentId: `doc_${Date.now()}`,
        projectId: approved.topology.projectId,
        jobName: `Job · ${new Date().toLocaleString()}`,
        state: PROGRAMMING_JOB_STATES.DESIGN_LOADED,
        approvedDesign: approved,
        programmingPlan: null,
        deploymentResult: null,
        verificationReport: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
        revisionId: `rev_${Date.now()}`,
      };
      dispatch(setCurrentDocument(jobDoc as any));

      return approved;
    } catch (e: any) {
      dispatch(setError(e.message || 'Failed to load design'));
      throw e;
    }
  }, [dispatch]);

  return {
    design,
    isLoading: isCompiling,
    error,
    loadDesign,
    hasDesign: design !== null,
    deviceCount: design?.devices.length ?? 0,
    lineCount: design?.topology.lines.length ?? 0,
  };
}