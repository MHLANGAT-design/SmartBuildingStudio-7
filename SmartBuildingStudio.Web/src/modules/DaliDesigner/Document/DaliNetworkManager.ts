// src/modules/DaliDesigner/Document/DaliNetworkManager.ts
import { DaliDocument, createEmptyDaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { DaliDevice, DeviceKind } from "@/modules/DaliDesigner/models/DaliDevice";
import { DaliLine } from "@/modules/DaliDesigner/models/DaliLine";
import { nanoid } from "nanoid";

// ─── Device id prefixes ─────────────────────────────────────────────
//
// Every DaliDevice has an id whose prefix identifies its origin.
// Downstream code (sync, import) relies on these prefixes to decide
// whether a device should be reconciled against the fixture list
// (fixture-backed) or preserved verbatim (library-added).
//
// The prefixes MUST be explicit and distinct. The previous scheme used
// `dev-` + fixture id, relying on fixture ids themselves starting with
// `fx-` to produce a `dev-fx-`-looking result. That worked by accident
// and would misclassify any fixture whose id started with `lib-`.
export const LIBRARY_DEVICE_PREFIX = "dev-lib-";
export const FIXTURE_DEVICE_PREFIX = "dev-fx-";

/**
 * Shape of a fixture as returned by the ProjectExplorer bridge endpoint
 * GET /projects/{projectId}/floorplans/{floorplanId}/fixtures.
 *
 * Matches BackendPayloadMapper.normalizeFixture().
 * x/y are top-level (not nested under position).
 */
export interface SourceFixture {
  id: string;
  x: number;
  y: number;
  kind?: string;
  type?: string;
  productId?: string;
  productName?: string;
  rotation?: number;
  roomId?: string;
  roomName?: string;
  elevation?: number;
  layerId?: string;
  daliGroup?: number;
  label?: string;
  wattage?: number;
}

// ─── Label derivation ───────────────────────────────────────────────

function kindDisplayName(k: DeviceKind, sourceKind: string): string {
  const sk = sourceKind.toLowerCase();
  if (sk === "emergencylight" || sk === "emergency") return "Emergency";
  if (k === "Ballast") return "Luminaire";
  return k;
}

function shortFixtureId(id: string): string {
  const parts = id.split("-");
  const tail = parts[parts.length - 1] ?? id;
  return tail.slice(-6).toUpperCase();
}

function buildDeviceLabel(f: SourceFixture, kind: DeviceKind, sourceKind: string): string {
  const kindName = kindDisplayName(kind, sourceKind);
  const short = shortFixtureId(f.id);

  const base =
    f.label?.trim() ||
    f.productName?.trim() ||
    `${kindName} · ${short}`;

  const withId = base.includes(short) ? base : `${base} · ${short}`;

  return f.roomName ? `${withId} · ${f.roomName}` : withId;
}

// ─── Classification and mapping ────────────────────────────────────

export function classifyFixture(f: SourceFixture): DeviceKind {
  const k = String(f.kind ?? f.type ?? "luminaire").toLowerCase();
  if (k === "sensor") return "Sensor";
  if (k === "switch") return "Switch";
  // Emergency lights still carry a ballast/LED driver — DALI treats them
  // as Ballast for control purposes. The original kind is preserved in
  // metadata.sourceKind so the UI can render them distinctly.
  return "Ballast";
}

export function mapFixtureToDaliDevice(f: SourceFixture): DaliDevice {
  const kind = classifyFixture(f);
  const sourceKind = String(f.kind ?? f.type ?? "luminaire");

  return {
    id: `${FIXTURE_DEVICE_PREFIX}${f.id}`,
    sourceFixtureId: f.id,
    kind,
    label: buildDeviceLabel(f, kind, sourceKind),
    lineId: null,
    address: null,
    groupIds: [],
    metadata: {
      luminaireType: f.productName ?? f.kind ?? f.type,
      wattage: f.wattage,
      position: { x: f.x, y: f.y },
      productId: f.productId,
      roomId: f.roomId,
      roomName: f.roomName,
      sourceKind,
    },
  };
}

// ─── Manager ────────────────────────────────────────────────────────

export const DaliNetworkManager = {
  createEmpty: createEmptyDaliDocument,

  /**
   * Merge the current fixture list into the DALI document.
   *
   * Rules:
   *   - Fixture-backed devices (id starts with FIXTURE_DEVICE_PREFIX)
   *     are kept in sync with the source fixture list:
   *       • new fixtures → new devices
   *       • existing fixtures → DALI state preserved, position refreshed
   *       • removed fixtures → device dropped
   *
   *   - Library-added devices (id starts with LIBRARY_DEVICE_PREFIX)
   *     have no source fixture. They are preserved verbatim. Adding
   *     them to a network is a manual act; the fixture pipeline must
   *     not delete them.
   *
   * Matching between an existing device and a fixture is by
   * `sourceFixtureId`, not by parsing the device id. This means old
   * devices created under the previous `dev-<fixtureId>` scheme still
   * match their fixtures — no migration is required — while new
   * devices are created with the explicit FIXTURE_DEVICE_PREFIX.
   *
   * Order: fixture-backed devices first (in source order), then any
   * library-added devices in their original order.
   */
  importFixtures(doc: DaliDocument, fixtures: SourceFixture[]): DaliDocument {
    const fixtureIds = new Set(fixtures.map((f) => f.id));

    // Split existing devices: fixture-backed vs library-added.
    // The discriminator is the library prefix, NOT "anything that isn't
    // a fixture" — a library device is the only kind that must be
    // preserved without being matched to a fixture.
    const fixtureBacked = new Map<string, DaliDevice>();
    const libraryAdded: DaliDevice[] = [];

    for (const d of doc.devices) {
      if (d.id.startsWith(LIBRARY_DEVICE_PREFIX)) {
        libraryAdded.push(d);
      } else {
        fixtureBacked.set(d.sourceFixtureId, d);
      }
    }

    // Merge/refresh fixture-backed devices.
    for (const f of fixtures) {
      const existing = fixtureBacked.get(f.id);
      const fresh = mapFixtureToDaliDevice(f);

      if (!existing) {
        fixtureBacked.set(f.id, fresh);
      } else {
        fixtureBacked.set(f.id, {
          ...existing,
          label: fresh.label,
          metadata: {
            ...existing.metadata,
            position: fresh.metadata.position,
            productId: fresh.metadata.productId,
            roomId: fresh.metadata.roomId,
            roomName: fresh.metadata.roomName,
            sourceKind: fresh.metadata.sourceKind,
          },
        });
      }
    }

    // Fixture-backed devices whose fixture is gone are dropped —
    // they won't be in `fixtureIds`, so the filter removes them.
    const fixtureDevices = Array.from(fixtureBacked.values()).filter((d) =>
      fixtureIds.has(d.sourceFixtureId)
    );

    return {
      ...doc,
      devices: [...fixtureDevices, ...libraryAdded],
    };
  },

  addLine(doc: DaliDocument, name?: string): { doc: DaliDocument; line: DaliLine } {
    const line: DaliLine = {
      id: `line-${nanoid(6)}`,
      name: name ?? `DALI Line ${doc.lines.length + 1}`,
      maxDevices: 64,
      powerBudgetW: 250,
    };
    return { doc: { ...doc, lines: [...doc.lines, line] }, line };
  },

  /**
   * Remove a DALI line and reconcile any devices that were on it.
   *
   * Deleting a line does three things atomically:
   *   1. removes the line from `doc.lines`
   *   2. unassigns every device whose `lineId` was that line
   *   3. clears each of those devices' `address`
   *
   * Step 3 is required because DALI addresses are per-line. An address
   * that was valid on the deleted line is meaningless once the line is
   * gone, and leaving it behind would let a stale number masquerade as
   * a valid assignment on whatever line the device is next placed on.
   *
   * The device objects themselves are preserved (only the fields that
   * referred to the deleted line are nulled). Library-added devices
   * that were on the deleted line are treated the same way — their
   * `lineId` is cleared, their `address` is cleared, they remain in
   * the document.
   */
  removeLine(doc: DaliDocument, lineId: string): DaliDocument {
    return {
      ...doc,
      lines: doc.lines.filter((l) => l.id !== lineId),
      devices: doc.devices.map((d) =>
        d.lineId === lineId ? { ...d, lineId: null, address: null } : d
      ),
    };
  },
};