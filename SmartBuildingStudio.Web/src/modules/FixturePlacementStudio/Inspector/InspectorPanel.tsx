// src/modules/FixturePlacementStudio/Inspector/InspectorPanel.tsx
//
// Dispatches between fixture and room inspectors based on what's
// selected. Whichever has priority shows; when nothing is selected,
// the fixture inspector's empty state renders.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSelectedRoomId } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import FixtureInspector from '@/modules/FixturePlacementStudio/Inspector/FixtureInspector';
import RoomInspector from '@/modules/FixturePlacementStudio/Inspector/RoomInspector';

export const InspectorPanel: React.FC = () => {
  const selectedRoomId = useAppSelector(selectSelectedRoomId);

  if (selectedRoomId) {
    return <RoomInspector />;
  }
  return <FixtureInspector />;
};

export default InspectorPanel;