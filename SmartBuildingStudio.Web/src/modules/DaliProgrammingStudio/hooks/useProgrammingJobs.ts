// src/modules/DaliProgrammingStudio/hooks/useProgrammingJobs.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectCurrentDocument, 
  selectJobState,
  selectError 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { setCurrentDocument, resetProgrammingState } from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { ProgrammingDocumentManager } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocumentManager';

export function useProgrammingJobs(docManager: ProgrammingDocumentManager) {
  const dispatch = useAppDispatch();
  const currentDoc = useAppSelector(selectCurrentDocument);
  const jobState = useAppSelector(selectJobState);
  const error = useAppSelector(selectError);

  const createJob = useCallback((projectId: string, jobName: string, userId: string) => {
    const doc = docManager.createNewDocument(projectId, jobName, userId);
    dispatch(setCurrentDocument(doc));
    return doc;
  }, [dispatch, docManager]);

  const saveJob = useCallback((userId: string, comment?: string) => {
    const json = docManager.save(userId, comment);
    return json;
  }, [docManager]);

  const loadJob = useCallback((jsonString: string) => {
    const doc = docManager.loadFromJson(jsonString);
    dispatch(setCurrentDocument(doc));
    return doc;
  }, [dispatch, docManager]);

  const resetJob = useCallback(() => {
    dispatch(resetProgrammingState());
  }, [dispatch]);

  return {
    currentDoc,
    jobState,
    error,
    createJob,
    saveJob,
    loadJob,
    resetJob,
    hasJob: currentDoc !== null,
    jobName: currentDoc?.jobName ?? '',
  };
}