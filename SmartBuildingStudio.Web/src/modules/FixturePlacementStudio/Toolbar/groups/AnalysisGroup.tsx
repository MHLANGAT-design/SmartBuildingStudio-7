// src/modules/FixturePlacementStudio/Toolbar/groups/AnalysisGroup.tsx
//
// Analysis operations: Calculate Lux, Validate.
//
// The heatmap toggle moved to ViewGroup when the canvas layer system
// landed — the heatmap is a visual layer, and all layer toggles now
// live together in one place. Having a separate Heatmap button here
// duplicated the View toggle and caused the two to fight each other.

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { CalculateLuxButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/CalculateLuxButton';
import { ValidateLayoutButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/ValidateLayoutButton';
import { ValidationReportDialog } from '@/modules/FixturePlacementStudio/Dialogs/ValidationReportDialog';
import { selectValidationReport } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

export const AnalysisGroup: React.FC = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const report = useAppSelector(selectValidationReport);

  return (
    <div style={group}>
      <CalculateLuxButton />
      <ValidateLayoutButton onValidated={() => setReportOpen(true)} />
      <ValidationReportDialog
        open={reportOpen}
        report={report}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
};

const group: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export default AnalysisGroup;