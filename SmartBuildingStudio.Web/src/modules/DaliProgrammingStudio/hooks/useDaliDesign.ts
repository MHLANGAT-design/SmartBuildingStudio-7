// src/modules/DaliProgrammingStudio/hooks/useDaliDesign.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectApprovedDesign, 
  selectIsCompiling,
  selectError 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { setApprovedDesign, setError } from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { DaliDesignIntegrationService } from '@/modules/DaliProgrammingStudio/Services/DaliDesignIntegrationService';

export function useDaliDesign() {
  const dispatch = useAppDispatch();
  const design = useAppSelector(selectApprovedDesign);
  const isCompiling = useAppSelector(selectIsCompiling);
  const error = useAppSelector(selectError);

  const loadDesign = useCallback(() => {
    try {
      const service = new DaliDesignIntegrationService();
      // Reach the Redux store from the global window handle
      const rootState = (window as any).__store.getState();
      const approved = service.fetchApprovedDesign(rootState);
      dispatch(setApprovedDesign(approved));
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