// src/modules/EmergencyLighting/hooks/useEmergencyUnsavedChanges.ts

import { useEffect } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

export const useEmergencyUnsavedChanges = () => {
  const isDirty = useAppSelector((s: any) => s.emergency.routesSave.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      // Standard way to trigger the browser's native "leave site?" dialog
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
};