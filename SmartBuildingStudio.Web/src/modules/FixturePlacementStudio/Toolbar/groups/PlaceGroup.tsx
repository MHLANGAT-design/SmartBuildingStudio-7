// src/modules/FixturePlacementStudio/Toolbar/groups/PlaceGroup.tsx
//
// Placement operations. Currently just the Add Fixture button, which
// opens a dialog with a kind picker and a filtered product list.
//
// Alignment, distribution, and snap-to-grid buttons will live here
// when they're implemented.

import React from 'react';
import { AddFixtureButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/AddFixtureButton';

export const PlaceGroup: React.FC = () => {
  return (
    <div style={group}>
      <AddFixtureButton />
    </div>
  );
};

const group: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export default PlaceGroup;