// src/modules/DaliDesigner/store/daliThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

import { DaliApi } from "@/modules/DaliDesigner/services/DaliApi";
import { DaliNetworkService } from "@/modules/DaliDesigner/services/DaliNetworkService";
import { DaliDocumentSerializer } from "@/modules/DaliDesigner/Document/DaliDocumentSerializer";
import { createEmptyDaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import {
  DaliNetworkManager,
  mapFixtureToDaliDevice,
  LIBRARY_DEVICE_PREFIX,
} from "@/modules/DaliDesigner/Document/DaliNetworkManager";
import {
  FloorplanLoader,
  FloorplanRenderModel,
} from "@/modules/DaliDesigner/Document/FloorplanLoader";
import { AddressAllocator } from "@/modules/DaliDesigner/Document/AddressAllocator";
import { SceneManager } from "@/modules/DaliDesigner/Document/SceneManager";
import { ValidationService } from "@/modules/DaliDesigner/services/ValidationService";
import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import { nanoid } from "nanoid";
import { DeviceKind } from "@/modules/DaliDesigner/models/DaliDevice";

// =====================================================================
// Network — load / save / save-as
// =====================================================================

export const loadDaliNetwork = createAsyncThunk<
  DaliDocument,
  { projectId: string; floorplanId: string; networkId?: string }
>("dali/load", async ({ projectId, floorplanId, networkId }) => {
  let doc: DaliDocument;

  if (networkId) {
    try {
      const dto = await DaliApi.getDaliNetwork(projectId, networkId);

      if (dto.floorplanId && dto.floorplanId !== floorplanId) {
        console.warn(
          `[loadDaliNetwork] Network ${networkId} belongs to floorplan ` +
          `${dto.floorplanId}, not ${floorplanId}. Starting fresh.`
        );
        doc = createEmptyDaliDocument(projectId, floorplanId);
      } else {
        doc = DaliDocumentSerializer.fromDTO(dto);
      }
    } catch (e) {
      console.warn(
        `[loadDaliNetwork] Failed to load network ${networkId}:`,
        e
      );
      doc = createEmptyDaliDocument(projectId, floorplanId);
    }
  } else {
    doc = createEmptyDaliDocument(projectId, floorplanId);
  }

  const fixtures = await DaliApi.getPlacedFixtures(projectId, floorplanId);
  return DaliNetworkManager.importFixtures(doc, fixtures);
});

export const saveDaliNetwork = createAsyncThunk<
  DaliDocument,
  void,
  { state: RootState }
>("dali/save", async (_, { getState }) => {
  const doc = getState().dali.document;
  const dto = DaliDocumentSerializer.toDTO({
    ...doc,
    revision: doc.revision + 1,
    updatedAt: new Date().toISOString(),
  });
  const saved = await DaliNetworkService.save(dto);
  return DaliDocumentSerializer.fromDTO(saved);
});

export const saveDaliNetworkAs = createAsyncThunk<
  DaliDocument,
  { name: string },
  { state: RootState }
>("dali/saveAs", async ({ name }, { getState }) => {
  const doc = { ...getState().dali.document, id: null, name, revision: 0 };
  const saved = await DaliApi.createDaliNetwork(
    doc.projectId,
    DaliDocumentSerializer.toDTO(doc)
  );
  return DaliDocumentSerializer.fromDTO(saved);
});

// =====================================================================
// Floorplan geometry
// =====================================================================

export const loadFloorplan = createAsyncThunk<
  FloorplanRenderModel,
  { floorplanId: string },
  { state: RootState }
>("dali/loadFloorplan", async ({ floorplanId }, { rejectWithValue }) => {
  const outcome = await FloorplanLoader.load(floorplanId);
  if (!outcome.ok) {
    return rejectWithValue(outcome.error);
  }
  return outcome.model;
});

// =====================================================================
// Document mutations — lines, devices, addressing
// =====================================================================

export const addDaliLine = createAsyncThunk<
  DaliDocument,
  void,
  { state: RootState }
>("dali/addLine", async (_, { getState }) => {
  const doc = getState().dali.document;
  return DaliNetworkManager.addLine(doc).doc;
});

/**
 * Remove a DALI line.
 *
 * Delegates to `DaliNetworkManager.removeLine`, which removes the line,
 * unassigns every device that referenced it, and clears those devices'
 * addresses (addresses are per-line in DALI, so an address that was
 * valid on the deleted line is meaningless once the line is gone).
 *
 * Rejects if the document is missing or the line id is unknown — the
 * latter catches a double-dispatch (two clicks on the delete button
 * before React re-renders the row away) so the second dispatch
 * surfaces as a rejected action rather than silently no-opping.
 */
export const removeDaliLine = createAsyncThunk<
  DaliDocument,
  string,
  { state: RootState }
>("dali/removeLine", async (lineId, { getState, rejectWithValue }) => {
  const doc = getState().dali.document;
  if (!doc) return rejectWithValue("No DALI document loaded");

  const exists = doc.lines.some((l) => l.id === lineId);
  if (!exists) return rejectWithValue(`Line ${lineId} not found`);

  return DaliNetworkManager.removeLine(doc, lineId);
});

/**
 * Add a device that originates from the product catalog (rather than
 * from a floorplan fixture).
 *
 * Library devices are tagged with LIBRARY_DEVICE_PREFIX, which
 * `syncDevicesWithFixtures` and `DaliNetworkManager.importFixtures`
 * use to distinguish them from fixture-sourced devices (they skip
 * library devices during reconciliation so a catalog-added device is
 * never removed just because no matching floorplan fixture exists).
 *
 * Catalog identity is preserved in `metadata` so the DALI device can:
 *   - resolve photometric data later (via `metadata.productId`, using
 *     the same endpoint FixturePlacementStudio consumes),
 *   - display the original physical product category in the inspector
 *     (`metadata.sourceKind` — e.g. "Luminaire" even though the DALI
 *     behavioral kind is "Ballast").
 *
 * `sourceFixtureId` is set to the empty string: a library device has
 * no fixture origin, and a self-reference (deviceId) would mislead any
 * future consumer doing `fixtureById.get(sourceFixtureId)`. The
 * LIBRARY_DEVICE_PREFIX remains the authoritative "is a library
 * device" check.
 */
export const addDeviceFromLibrary = createAsyncThunk<
  DaliDocument,
  {
    kind: DeviceKind;
    model: string;
    productId?: string;
    productCode?: string;
    /** Original backend ProductType string, preserved for the inspector. */
    sourceKind?: string;
    wattage?: number;
  },
  { state: RootState }
>(
  "dali/addDevice",
  async (
    { kind, model, productId, productCode, sourceKind, wattage },
    { getState }
  ) => {
    const doc = getState().dali.document;
    const deviceId = `${LIBRARY_DEVICE_PREFIX}${nanoid(6)}`;
    const device: DaliDevice = {
      id: deviceId,
      sourceFixtureId: "",
      kind,
      label: model,
      lineId: null,
      address: null,
      groupIds: [],
      metadata: {
        productId,
        sourceKind,
        luminaireType: productCode,
        wattage,
      },
    };
    return { ...doc, devices: [...doc.devices, device] };
  }
);

export const setDeviceAddress = createAsyncThunk<
  DaliDocument,
  { deviceId: string; address: number },
  { state: RootState }
>("dali/setAddress", async ({ deviceId, address }, { getState }) => {
  const doc = getState().dali.document;
  return {
    ...doc,
    devices: doc.devices.map((d) =>
      d.id === deviceId ? { ...d, address } : d
    ),
  };
});

/**
 * Assign devices to a DALI line.
 *
 * Passing `lineId: null` unassigns the device from its current line.
 * Reassigning a device to a *different* line clears its address,
 * because DALI addresses are per-line — an address that was valid on
 * the old line is meaningless on the new one. `autoAddress` (or
 * `setDeviceAddress`) is required to give it a fresh address.
 *
 * Accepts an array of device ids so the same thunk can back both
 * single-device assignment (from the inspector dropdown) and
 * bulk assignment (from a future multi-select UI).
 */
export const assignDeviceToLine = createAsyncThunk<
  DaliDocument,
  { deviceIds: string[]; lineId: string | null },
  { state: RootState }
>(
  "dali/assignToLine",
  async ({ deviceIds, lineId }, { getState, rejectWithValue }) => {
    const doc = getState().dali.document;
    if (!doc) return rejectWithValue("No DALI document loaded");

    if (lineId !== null) {
      const line = doc.lines.find((l) => l.id === lineId);
      if (!line) return rejectWithValue(`Line ${lineId} not found`);
    }

    const targetSet = new Set(deviceIds);

    return {
      ...doc,
      devices: doc.devices.map((d) => {
        if (!targetSet.has(d.id)) return d;
        if (d.lineId !== lineId) {
          return { ...d, lineId, address: null };
        }
        return { ...d, lineId };
      }),
    };
  }
);

// =====================================================================
// Sync — reconcile the DALI device list with the source fixture list
// =====================================================================

export const syncDevicesWithFixtures = createAsyncThunk<
  DaliDocument,
  void,
  { state: RootState }
>("dali/sync", async (_, { getState }) => {
  const doc = getState().dali.document;

  const fixtures = await DaliApi.getPlacedFixtures(
    doc.projectId,
    doc.floorplanId
  );
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));

  const updated: DaliDevice[] = [];
  const matchedFixtureIds = new Set<string>();

  for (const d of doc.devices) {
    if (d.id.startsWith(LIBRARY_DEVICE_PREFIX)) {
      updated.push(d);
      continue;
    }

    const fixture = fixtureById.get(d.sourceFixtureId);

    if (!fixture) {
      continue;
    }

    matchedFixtureIds.add(fixture.id);
    const fresh = mapFixtureToDaliDevice(fixture);

    updated.push({
      ...d,
      label: fresh.label,
      metadata: {
        ...d.metadata,
        position: fresh.metadata.position,
        productId: fresh.metadata.productId,
        roomId: fresh.metadata.roomId,
        roomName: fresh.metadata.roomName,
        sourceKind: fresh.metadata.sourceKind,
      },
    });
  }

  for (const f of fixtures) {
    if (matchedFixtureIds.has(f.id)) continue;
    updated.push(mapFixtureToDaliDevice(f));
  }

  const liveIds = new Set(updated.map((d) => d.id));

  const groups = doc.groups.map((g) => ({
    ...g,
    ...(Array.isArray((g as any).deviceIds)
      ? {
          deviceIds: (g as any).deviceIds.filter((id: string) =>
            liveIds.has(id)
          ),
        }
      : {}),
  }));

  const lines = doc.lines.map((l) => ({
    ...l,
    ...(Array.isArray((l as any).deviceIds)
      ? {
          deviceIds: (l as any).deviceIds.filter((id: string) =>
            liveIds.has(id)
          ),
        }
      : {}),
  }));

  const scenes = doc.scenes.map((s) => {
    const levels: Record<string, number> = {};
    for (const [deviceId, level] of Object.entries(s.levels)) {
      if (liveIds.has(deviceId)) levels[deviceId] = level;
    }
    return { ...s, levels };
  });

  const groupIdsSet = new Set(groups.map((g) => g.id));
  const lineIdsSet = new Set(lines.map((l) => l.id));

  const finalDevices = updated.map((d) => ({
    ...d,
    groupIds: d.groupIds.filter((gid) => groupIdsSet.has(gid)),
    lineId:
      d.lineId && lineIdsSet.has(d.lineId) ? d.lineId : null,
  }));

  return {
    ...doc,
    devices: finalDevices,
    groups,
    lines,
    scenes,
  };
});

// =====================================================================
// Auto address
// =====================================================================

export const autoAddress = createAsyncThunk<
  DaliDocument,
  void,
  { state: RootState }
>("dali/autoAddress", async (_, { getState }) => {
  const doc = getState().dali.document;
  return { ...doc, devices: AddressAllocator.autoAddress(doc.devices) };
});

// =====================================================================
// Scenes — per-device level assignment
// =====================================================================

export const setSceneLevel = createAsyncThunk<
  DaliDocument,
  { sceneId: string; deviceId: string; level: number },
  { state: RootState }
>("dali/setSceneLevel", async ({ sceneId, deviceId, level }, { getState }) => {
  const doc = getState().dali.document;
  return SceneManager.setLevel(doc, sceneId, deviceId, level);
});

export const setSceneLevels = createAsyncThunk<
  DaliDocument,
  { sceneId: string; levels: Record<string, number> },
  { state: RootState }
>("dali/setSceneLevels", async ({ sceneId, levels }, { getState }) => {
  const doc = getState().dali.document;
  let next = doc;
  for (const [deviceId, level] of Object.entries(levels)) {
    next = SceneManager.setLevel(next, sceneId, deviceId, level);
  }
  return next;
});

// =====================================================================
// Validation
// =====================================================================

export const validateNetwork = createAsyncThunk<
  ReturnType<typeof ValidationService.validate>,
  void,
  { state: RootState }
>("dali/validate", async (_, { getState }) => {
  return ValidationService.validate(getState().dali.document);
});