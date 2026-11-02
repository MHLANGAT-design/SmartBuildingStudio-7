// src/modules/FixturePlacementStudio/utils/boundaries/drawnElementBoundary.ts
//
// Boundary tests for elements created by FixturePlacementStudio's own
// tools (DoorTool, WindowTool) rather than imported from a DXF.
//
// WHY THIS IS SEPARATE FROM doorBoundary.ts / windowBoundary.ts
// ──────────────────────────────────────────────────────────────
// The DXF boundary rules are carefully tuned to match how DWG/DXF
// importers place doors and windows — different anchor conventions,
// different tolerances, different failure modes. Changing them once
// already broke corridor-door detection. This module is a parallel
// set of rules that ONLY applies to composites whose id starts with
// `DOOR_` or `WINDOW_` (the prefixes emitted by the tools), so the
// DXF path never has to be touched.
//
// DRAWN DOOR GEOMETRY
// ────────────────────
// The DoorTool places four points:
//   P1 = hingeA  (back face of wall, outside the room the door opens into)
//   P2 = hingeB  (front face of wall, on the room the door opens into)
//   P3 = lockB   (front face, lock end)
//   P4 = lockA   (back face, lock end)
// The leaf swings from P2 into the room. The composite `primitives` are:
//   [0] P1→P2  (jamb A, crosses the polygon boundary — 230mm outside → 0)
//   [1] P3→P4  (jamb B, same)
//   [2] P2→P3  (straight edge along front face — may not touch polygon)
//   [3] P2→leafPoint  (leaf line, inside the room the door opens into)
//   [4] arc           (inside the room)
// The jamb A/B fragments physically cross the room polygon edge, which
// is the strongest signal that the door is on this room's boundary.
//
// DRAWN WINDOW GEOMETRY
// ──────────────────────
// The WindowTool places a rectangular frame straddling the wall —
// its start/end points and midline lie on the wall, and the frame
// spans across both wall faces. Its fragments cross the polygon
// boundary just like the door jambs do.
//
// STRATEGY
// ────────
//  1. If ANY fragment crosses the polygon edge → belongs (strongest).
//  2. If any endpoint is inside → belongs (fallback).
//  3. Otherwise → doesn't belong.
// No tolerance-widening based on wall thickness — that was what
// caught corridor doors. Fragments crossing the polygon is a physical
// signal, not a numeric threshold.

import type { Point, RawElement } from '../mergeElements';
import {
  pointInPolygon,
  distanceToPerimeter,
  fragmentIntersectsPolygon,
} from './geometry';

/** Max distance from a jamb endpoint to the polygon edge for the
 *  secondary "near the wall" check. Kept small so corridor doors
 *  don't slip in via wall-face proximity. */
const NEAR_WALL_MM = 50;

function isDrawnDoor(el: RawElement): boolean {
  return /^DOOR_/.test(String(el.compositeId ?? ''));
}

function isDrawnWindow(el: RawElement): boolean {
  return /^WINDOW_/.test(String(el.compositeId ?? ''));
}

export function isDrawnComposite(el: RawElement): boolean {
  return isDrawnDoor(el) || isDrawnWindow(el);
}

// ── Drawn door ────────────────────────────────────────────────────────

export function drawnDoorBelongsToRoom(
  doorFragments: RawElement[],
  poly: Point[],
): boolean {
  if (doorFragments.length === 0 || poly.length < 3) return false;

  // 1. Strongest signal: a jamb fragment crosses the polygon edge.
  //    The jamb goes from the back face (outside the room) to the
  //    front face (at the polygon edge). Any real boundary door
  //    produces this crossing; a corridor-placed door does not
  //    (its jambs are entirely outside every room polygon).
  for (const frag of doorFragments) {
    if (fragmentIntersectsPolygon(frag, poly, 0)) return true;
  }

  // 2. Fallback: any endpoint of any fragment lies strictly inside
  //    the polygon. Covers cases where the polygon is drawn slightly
  //    off the wall inner face and the jamb endpoints land inside.
  for (const frag of doorFragments) {
    for (const p of frag.points) {
      if (pointInPolygon(p, poly)) return true;
    }
  }

  // 3. Fallback 2: any jamb endpoint is within NEAR_WALL_MM of the
  //    polygon edge AND on the room side (inside or on boundary).
  //    Small enough that corridor doors on the outside face of the
  //    room wall stay excluded.
  for (const frag of doorFragments) {
    for (const p of frag.points) {
      if (distanceToPerimeter(p, poly) <= NEAR_WALL_MM) return true;
    }
  }

  return false;
}

// ── Drawn window ──────────────────────────────────────────────────────

export function drawnWindowIntersectsPolygon(
  el: RawElement,
  poly: Point[],
): boolean {
  if (!el || poly.length < 3) return false;

  // Same logic: a drawn window's frame fragments cross the polygon.
  if (fragmentIntersectsPolygon(el, poly, 0)) return true;

  for (const p of el.points) {
    if (pointInPolygon(p, poly)) return true;
  }

  for (const p of el.points) {
    if (distanceToPerimeter(p, poly) <= NEAR_WALL_MM) return true;
  }

  return false;
}