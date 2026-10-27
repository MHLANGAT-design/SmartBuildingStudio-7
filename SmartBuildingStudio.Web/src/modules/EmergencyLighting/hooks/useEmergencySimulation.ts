// src/modules/EmergencyLighting/hooks/useEmergencySimulation.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { runEmergencySimulation, loadRawGeometry } from '@/modules/EmergencyLighting/store/emergencyThunks';

export function useEmergencySimulation() {
  const dispatch = useAppDispatch();

  const status = useAppSelector((s: any) => s.emergency.simulation.status);
  const issues = useAppSelector((s: any) => s.emergency.simulation.issues);
  const lastRunAt = useAppSelector((s: any) => s.emergency.simulation.lastRunAt);
  const error = useAppSelector((s: any) => s.emergency.simulation.error);

  const runSimulation = useCallback(() => {
    dispatch(runEmergencySimulation());
  }, [dispatch]);

  const errorCount = issues.filter((i: any) => i.severity === 'error').length;
  const warningCount = issues.filter((i: any) => i.severity === 'warning').length;
  const infoCount = issues.filter((i: any) => i.severity === 'info').length;
  const passed = status === 'complete' && errorCount === 0;

  return {
    status,
    issues,
    lastRunAt,
    error,
    errorCount,
    warningCount,
    infoCount,
    passed,
    runSimulation,
  };
}