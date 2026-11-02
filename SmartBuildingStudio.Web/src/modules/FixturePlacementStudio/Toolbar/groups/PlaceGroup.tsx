// src/modules/FixturePlacementStudio/Toolbar/groups/PlaceGroup.tsx
//
// Placement operations: Add Fixture, Align, Distribute.
// Align and Distribute require a selection of 2+ and 3+ fixtures
// respectively — the buttons gate themselves on selection count and
// read-only state, so no additional logic is needed here.

import React from 'react';
import { AddFixtureButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/AddFixtureButton';
import { AlignFixturesButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/AlignFixturesButton';
import { DistributeFixturesButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/DistributeFixturesButton';

export const PlaceGroup: React.FC = () => {
  return (
    <div style={group}>
      <AddFixtureButton />
      <span style={divider}>|</span>
      <AlignFixturesButton />
      <DistributeFixturesButton />
    </div>
  );
};

const group: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  rowGap: 4,
};

const divider: React.CSSProperties = {
  color: '#334155',
  fontSize: 11,
  userSelect: 'none',
  margin: '0 2px',
};

export default PlaceGroup;