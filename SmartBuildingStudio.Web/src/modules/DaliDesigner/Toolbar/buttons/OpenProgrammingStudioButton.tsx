// src/modules/DaliDesigner/Toolbar/buttons/OpenProgrammingStudioButton.tsx

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/Application/ConfigureStore';
import { resetProgrammingState } from '@/modules/DaliProgrammingStudio/store/programmingSlice';

export const OpenProgrammingStudioButton: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projectId, floorplanId, networkId } = useParams<{
    projectId: string;
    floorplanId: string;
    networkId?: string;
  }>();

  if (!projectId || !floorplanId) return null;

  const handleClick = () => {
    // Clear the programming state to force a fresh fetch on the destination page
    dispatch(resetProgrammingState());

    const url = networkId
      ? `/projects/${projectId}/floorplans/${floorplanId}/programming/${networkId}`
      : `/projects/${projectId}/floorplans/${floorplanId}/programming`;
      
    navigate(url);
  };

  return (
    <button
      onClick={handleClick}
      title="Open the Programming & Configuration module for this design"
      style={{
        padding: '4px 10px',
        background: '#1D4ED8',
        color: '#FFF',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 'bold',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      → Programming Studio
    </button>
  );
};