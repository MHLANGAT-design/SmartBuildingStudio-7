// src/modules/FixturePlacementStudio/models/PlacementRule.ts
//
// A placement rule constrains how and where a fixture may be placed.
// Rules are evaluated during placement (soft, real-time feedback) and
// during validation (hard, sign-off gate). They are NOT persisted with
// the document — the rule set is owned by FixturePlacementStudio and
// may vary by project, standard, or client. If a specific rule needs to
// be recorded as having been applied, that's an entry in the validation
// report, not a rule definition on the document.
//
// Design notes:
//   - Rules are declarative data, not code. The evaluation engine lives
//     in utils/placementValidation.ts. Keeping rules as plain data means
//     they can be serialized to project settings, loaded from the
//     catalog, or overridden per-project without shipping code.
//   - A rule has a `severity`: 'error' blocks sign-off; 'warning'
//     annotates; 'info' surfaces but does not fail. Validation uses
//     severity to decide whether to fail the whole layout.

import type { FixtureKind } from './Fixture';

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RuleScope =
  /** Applies to every fixture. */
  | 'global'
  /** Applies to a specific kind (luminaire, sensor, emergencyLight). */
  | 'kind'
  /** Applies within a specific zone. */
  | 'zone'
  /** Applies within a specific room. */
  | 'room'
  /** Applies within a specific product (catalog-scoped). */
  | 'product';

// ─── Rule kinds ───────────────────────────────────────────────────────────────

/**
 * Every rule kind is a discriminated branch. The `params` field on each
 * variant carries the rule-specific configuration. Adding a new rule kind
 * means: add a variant here, add an evaluator in placementValidation.ts.
 */
export type PlacementRule =
  | MinSpacingRule
  | MaxSpacingRule
  | MinWallClearanceRule
  | MinFixtureClearanceRule
  | WallMountRule
  | CeilingMountRule
  | CoverageOverlapRule
  | ZoneMembershipRule
  | EscapeRouteCoverageRule;

// ─── Rule variants ────────────────────────────────────────────────────────────

export interface MinSpacingRule {
  kind: 'min-spacing';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Minimum center-to-center distance between fixtures of the same kind, in meters. */
    meters: number;
    /** Only enforce between fixtures of these kinds. Empty = all kinds. */
    appliesToKinds?: FixtureKind[];
    /** Only enforce within the same zone. */
    sameZoneOnly?: boolean;
  };
}

export interface MaxSpacingRule {
  kind: 'max-spacing';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Maximum center-to-center distance between adjacent fixtures, in meters. */
    meters: number;
    appliesToKinds?: FixtureKind[];
    /** Direction of the spacing check. */
    axis?: 'x' | 'y' | 'any';
  };
}

export interface MinWallClearanceRule {
  kind: 'min-wall-clearance';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Minimum distance from any fixture to the nearest wall, in meters. */
    meters: number;
    appliesToKinds?: FixtureKind[];
  };
}

export interface MinFixtureClearanceRule {
  kind: 'min-fixture-clearance';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Minimum distance between any two fixtures, regardless of kind, in meters. */
    meters: number;
    /** Exempt pairs that share a zone, e.g. a luminaire and its dedicated sensor. */
    exemptSameZone?: boolean;
  };
}

export interface WallMountRule {
  kind: 'wall-mount';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Fixture kind this applies to (typically 'sensor' or 'emergencyLight'). */
    appliesToKind: FixtureKind;
    /** Maximum allowed distance from a wall to be considered wall-mounted. */
    maxDistanceToWallMeters: number;
  };
}

export interface CeilingMountRule {
  kind: 'ceiling-mount';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    appliesToKind: FixtureKind;
    /** Minimum elevation in meters considered "ceiling". */
    minElevationMeters: number;
  };
}

export interface CoverageOverlapRule {
  kind: 'coverage-overlap';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Minimum overlap ratio between adjacent fixtures' coverage circles (0..1). */
    minOverlapRatio: number;
    appliesToKinds?: FixtureKind[];
  };
}

export interface ZoneMembershipRule {
  kind: 'zone-membership';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Every fixture of these kinds must belong to at least one zone. */
    appliesToKinds: FixtureKind[];
  };
}

export interface EscapeRouteCoverageRule {
  kind: 'escape-route-coverage';
  severity: RuleSeverity;
  scope: RuleScope;
  params: {
    /** Minimum lux along escape routes. */
    minLux: number;
    /** Minimum autonomy in minutes for fixtures on the route. */
    minAutonomyMinutes: number;
  };
}

// ─── Rule set ─────────────────────────────────────────────────────────────────

/**
 * A named, ordered collection of rules. Projects typically load one rule
 * set at a time; the UI may allow toggling individual rules on and off,
 * which is represented by filtering the set before evaluation.
 */
export interface RuleSet {
  id: string;
  name: string;
  description?: string;
  rules: PlacementRule[];
  /** Source of the rule set — 'default', 'project', 'standard', 'custom'. */
  origin?: 'default' | 'project' | 'standard' | 'custom';
  /** Standards this rule set implements, e.g. ['EN 12464-1', 'BS 5266-1']. */
  standards?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function ruleId(rule: PlacementRule): string {
  // Deterministic id derived from kind + scope + serialized params. Stable
  // across reloads so UI toggles and suppression lists survive a refresh.
  const params = JSON.stringify(rule.params);
  return `${rule.kind}:${rule.scope}:${params}`;
}

export function filterRulesByKind(
  rules: readonly PlacementRule[],
  kind: FixtureKind
): PlacementRule[] {
  return rules.filter((rule) => {
    const appliesTo = (rule.params as { appliesToKinds?: FixtureKind[] }).appliesToKinds;
    if (!appliesTo || appliesTo.length === 0) return true;
    return appliesTo.includes(kind);
  });
}

export default PlacementRule;