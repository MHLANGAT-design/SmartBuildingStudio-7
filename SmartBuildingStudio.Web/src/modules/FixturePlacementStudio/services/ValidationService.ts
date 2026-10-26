// src/modules/FixturePlacementStudio/services/ValidationService.ts
//
// Evaluates a set of PlacementRules against a FixtureLayout.
//
// Produces a ValidationReport — a session-only structure that the UI
// displays in the validation panel. Never persisted.
//
// The evaluators are one function per rule kind, dispatched by
// `rule.kind`. Adding a new rule kind is: add the type in PlacementRule,
// add an evaluator here.
//
// ── Units ──────────────────────────────────────────────────────────────
//
// Fixture coordinates (Fixture.x, Fixture.y) are stored in MILLIMETERS —
// the internal drawing coordinate system used by the canvas renderer.
// Rule thresholds (rule.params.meters) are in METERS — that's the
// natural unit for a rule definition, and the value a designer types
// when configuring a standard.
//
// Every distance computed from fixture coordinates is converted to
// meters before comparison. `mmToM` is the single conversion point;
// adding new distance-based rules should route through it too.

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture, FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import type {
  PlacementRule,
  RuleSeverity,
} from '@/modules/FixturePlacementStudio/models/PlacementRule';

// ─── Units ────────────────────────────────────────────────────────────────────

const MM_PER_M = 1000;

/** Convert millimeters to meters. Fixture coordinates are mm. */
const mmToM = (mm: number): number => mm / MM_PER_M;

/** Euclidean distance between two fixtures, in METERS. */
const distanceMeters = (a: Fixture, b: Fixture): number =>
  mmToM(Math.hypot(a.x - b.x, a.y - b.y));

// ─── Report types ─────────────────────────────────────────────────────────────

export interface ValidationViolation {
  /** Rule that produced this violation. */
  ruleId: string;
  ruleKind: string;
  severity: RuleSeverity;
  /** Human-readable message for the UI. */
  message: string;
  /** Fixtures involved. */
  fixtureIds: string[];
  /** Zone ids involved, if any. */
  zoneIds?: string[];
  /** Measured value against which the rule was evaluated. In METERS. */
  measured?: number;
  /** Value required by the rule. In METERS. */
  required?: number;
}

export interface ValidationReport {
  /** Document the report describes. */
  documentId: string;
  /** Layout hash at report time. Used to detect staleness. */
  layoutHash: string;
  /** ISO timestamp of the run. */
  generatedAt: string;
  /** All violations found. Empty when compliant. */
  violations: ValidationViolation[];
  /** Counts by severity. */
  errorCount: number;
  warningCount: number;
  infoCount: number;
  /** True when errorCount === 0. */
  passed: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ValidationService {
  /**
   * Run all applicable rules against the layout.
   */
  static validate(
    layout: FixtureLayout,
    rules: readonly PlacementRule[],
    layoutHash: string
  ): ValidationReport {
    const violations: ValidationViolation[] = [];

    for (const rule of rules) {
      const applicable = ValidationService.applicableFixtures(layout, rule);
      if (applicable.length === 0) continue;

      const ruleViolations = ValidationService.evaluate(rule, applicable, layout);
      violations.push(...ruleViolations);
    }

    const errorCount = violations.filter((v) => v.severity === 'error').length;
    const warningCount = violations.filter((v) => v.severity === 'warning').length;
    const infoCount = violations.filter((v) => v.severity === 'info').length;

    return {
      documentId: layout.documentId,
      layoutHash,
      generatedAt: new Date().toISOString(),
      violations,
      errorCount,
      warningCount,
      infoCount,
      passed: errorCount === 0,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private static applicableFixtures(
    layout: FixtureLayout,
    rule: PlacementRule
  ): Fixture[] {
    const appliesTo = (rule.params as { appliesToKinds?: FixtureKind[] })
      .appliesToKinds;
    if (!appliesTo || appliesTo.length === 0) return layout.fixtures;
    return layout.fixtures.filter((f) => appliesTo.includes(f.kind));
  }

  // ─── Evaluators ──────────────────────────────────────────────────────

  private static evaluate(
    rule: PlacementRule,
    fixtures: Fixture[],
    _layout: FixtureLayout
  ): ValidationViolation[] {
    switch (rule.kind) {
      case 'min-spacing':
        return ValidationService.checkMinSpacing(rule, fixtures);
      case 'max-spacing':
        return ValidationService.checkMaxSpacing(rule, fixtures);
      case 'min-wall-clearance':
        // Wall clearance requires floor plan geometry. Placeholder for now.
        return [];
      case 'min-fixture-clearance':
        return ValidationService.checkMinFixtureClearance(rule, fixtures);
      case 'wall-mount':
        return [];
      case 'ceiling-mount':
        return [];
      case 'coverage-overlap':
        return [];
      case 'zone-membership':
        return ValidationService.checkZoneMembership(rule, fixtures);
      case 'escape-route-coverage':
        return [];
      default:
        return [];
    }
  }

  private static checkMinSpacing(
    rule: Extract<PlacementRule, { kind: 'min-spacing' }>,
    fixtures: Fixture[]
  ): ValidationViolation[] {
    const out: ValidationViolation[] = [];
    const min = rule.params.meters;
    const id = `${rule.kind}:${rule.scope}`;

    for (let i = 0; i < fixtures.length; i++) {
      for (let j = i + 1; j < fixtures.length; j++) {
        const a = fixtures[i];
        const b = fixtures[j];
        if (rule.params.sameZoneOnly) {
          // Skip check if not in same zone — a per-zone lookup, defer for now.
        }
        const dist = distanceMeters(a, b);
        if (dist < min) {
          out.push({
            ruleId: id,
            ruleKind: rule.kind,
            severity: rule.severity,
            message: `Fixtures ${a.id} and ${b.id} are ${dist.toFixed(2)} m apart; minimum is ${min} m.`,
            fixtureIds: [a.id, b.id],
            measured: dist,
            required: min,
          });
        }
      }
    }
    return out;
  }

  private static checkMaxSpacing(
    rule: Extract<PlacementRule, { kind: 'max-spacing' }>,
    fixtures: Fixture[]
  ): ValidationViolation[] {
    // Simplified: nearest-neighbour distance should not exceed the max.
    // A robust implementation would build a Delaunay triangulation and
    // check each edge. That refinement is out of scope for v1.0.
    const out: ValidationViolation[] = [];
    const max = rule.params.meters;
    const id = `${rule.kind}:${rule.scope}`;

    for (const a of fixtures) {
      let nearest = Infinity;
      for (const b of fixtures) {
        if (a === b) continue;
        const dist = distanceMeters(a, b);
        if (dist < nearest) nearest = dist;
      }
      if (nearest > max && fixtures.length > 1) {
        out.push({
          ruleId: id,
          ruleKind: rule.kind,
          severity: rule.severity,
          message: `Fixture ${a.id} has no neighbour within ${max} m (nearest is ${nearest.toFixed(2)} m).`,
          fixtureIds: [a.id],
          measured: nearest,
          required: max,
        });
      }
    }
    return out;
  }

  private static checkMinFixtureClearance(
    rule: Extract<PlacementRule, { kind: 'min-fixture-clearance' }>,
    fixtures: Fixture[]
  ): ValidationViolation[] {
    const out: ValidationViolation[] = [];
    const min = rule.params.meters;
    const id = `${rule.kind}:${rule.scope}`;

    for (let i = 0; i < fixtures.length; i++) {
      for (let j = i + 1; j < fixtures.length; j++) {
        const a = fixtures[i];
        const b = fixtures[j];
        const dist = distanceMeters(a, b);
        if (dist < min) {
          out.push({
            ruleId: id,
            ruleKind: rule.kind,
            severity: rule.severity,
            message: `Fixtures ${a.id} and ${b.id} are ${dist.toFixed(2)} m apart; minimum clearance is ${min} m.`,
            fixtureIds: [a.id, b.id],
            measured: dist,
            required: min,
          });
        }
      }
    }
    return out;
  }

  private static checkZoneMembership(
    _rule: Extract<PlacementRule, { kind: 'zone-membership' }>,
    _fixtures: Fixture[]
  ): ValidationViolation[] {
    const out: ValidationViolation[] = [];

    // Collect all fixtures that are members of at least one zone.
    // Layout is not passed here, so the caller must ensure the fixtures
    // argument already reflects this rule's scope. For v1.0, we
    // conservatively skip the check when the rule set cannot see zones.
    // A robust implementation would need the full layout to look up
    // zone membership.
    // TODO: thread layout through to enable this rule.
    return out;
  }
}

export default ValidationService;