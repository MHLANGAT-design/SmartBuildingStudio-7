// src/modules/Commissioning/Toolbar/groups/SessionGroup.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '@/Application/ConfigureStore';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';
import { clearCommissioningContext } from '@/modules/Commissioning/store/commissioningSlice';

import { StartCommissioningButton } from '@/modules/Commissioning/Toolbar/buttons/StartCommissioningButton';
import { StopCommissioningButton } from '@/modules/Commissioning/Toolbar/buttons/StopCommissioningButton';
import { PauseCommissioningButton } from '@/modules/Commissioning/Toolbar/buttons/PauseCommissioningButton';
import { ResetCommissioningButton } from '@/modules/Commissioning/Toolbar/buttons/ResetCommissioningButton';
import { SaveCommissioningStateButton } from '@/modules/Commissioning/Toolbar/buttons/SaveCommissioningStateButton';

export const SessionGroup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projectId, floorplanId } = useParams<{ projectId?: string; floorplanId?: string }>();
  const { session, startSession, resetSession } = useCommissioning();

  const handleStart = () => {
    if (!projectId || !floorplanId) {
      alert('Cannot start session: Missing project or floorplan context.');
      return;
    }
    
    // Clear any existing session first, then start a fresh one
    dispatch(clearCommissioningContext());
    startSession(projectId, floorplanId).catch(console.error);
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {/* Start button: Active when no session exists, or if you want to force restart */}
      <StartCommissioningButton 
        onClick={handleStart} 
        disabled={!!session} 
      />
      
      {/* Stop button: Clears the session entirely */}
      <StopCommissioningButton onClick={resetSession} />
      
      <PauseCommissioningButton onClick={() => { /* TODO: pause wiring */ }} />
      
      <ResetCommissioningButton onClick={resetSession} />
      
      <SaveCommissioningStateButton />
    </div>
  );
};