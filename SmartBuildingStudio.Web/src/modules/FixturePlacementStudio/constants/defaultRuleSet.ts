// src/modules/FixturePlacementStudio/constants/defaultRuleSet.ts
//
// Default rule set loaded when a FixturePlacementStudio session begins.
//
// These rules are the baseline the user sees on first open. They are
// not persisted with the document — the rule set is owned by the
// module, and can be replaced per-project or per-standard without
// touching the document payload.
//
// Only rules whose evaluators exist in ValidationService are included.
// The remaining rule kinds (min-wall-clearance, wall-mount, etc.)
// currently return empty violation lists from their evaluators — they
// will be added here once their logic lands.

import type { RuleSet } from '@/modules/FixturePlacementStudio/models/PlacementRule';

export const DEFAULT_RULE_SET: RuleSet = {
  id: 'default-v1',
  name: 'Default Placement Rules',
  description:
    'Baseline rules applied to every document. Includes minimum ' +
    'spacing, maximum spacing, and minimum fixture clearance.',
  origin: 'default',
  rules: [
    {
      kind: 'min-spacing',
      severity: 'error',
      scope: 'global',
      params: {
        // 0.3 m centre-to-centre minimum between luminaires. Catches
        // fixtures that were placed on top of each other by accident.
        meters: 0.3,
        appliesToKinds: ['luminaire'],
      },
    },
    {
      kind: 'max-spacing',
      severity: 'warning',
      scope: 'global',
      params: {
        // 6 m maximum spacing between adjacent luminaires. Flags any
        // fixture with no neighbour within 6 m — a "lonely" fixture
        // that probably leaves a dark spot.
        meters: 6.0,
        appliesToKinds: ['luminaire'],
      },
    },
    {
      kind: 'min-fixture-clearance',
      severity: 'error',
      scope: 'global',
      params: {
        // 0.1 m minimum between any two fixtures, regardless of kind.
        // Prevents physical overlap of any two fixture footprints.
        meters: 0.1,
      },
    },
  ],
};

export default DEFAULT_RULE_SET;