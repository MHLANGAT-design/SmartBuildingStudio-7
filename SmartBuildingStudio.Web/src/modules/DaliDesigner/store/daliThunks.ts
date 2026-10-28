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
import { FloorplanLoader, FloorplanRenderModel } from "@/modules/DaliDesigner/Document/FloorplanLoader";
import { AddressAllocator } from "@/modules/DaliDesigner/Document/AddressAllocator";
import { SceneManager } from "@/modules/DaliDesigner/Document/SceneManager";
import { ValidationService } from "@/modules/DaliDesigner/services/ValidationService";
import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import { nanoid } from "nanoid";
import { DeviceKind } from "@/modules/DaliDesigner/models/DaliDevice";
import {
  bumpDocumentVersion,
  recordDocumentLoaded,
} from "@/modules/Shared/DocumentVersion/documentVersionSlice";
import { selectCurrentDocumentVersion } from "@/modules/Shared/DocumentVersion/selectDocumentFresh";

export const loadDaliNetwork = createAsyncThunk<
  DaliDocument,
  { projectId: string; floorplanId: string; networkId?: string }
>("dali/load", async ({ projectId, floorplanId, networkId }, { getState, dispatch }) => {
  const versionAtLoad = selectCurrentDocumentVersion(getState());

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
      console.warn(`[loadDaliNetwork] Failed to load network ${networkId}:`, e);
      doc = createEmptyDaliDocument(projectId, floorplanId);
    }
  } else {
    doc = createEmptyDaliDocument(projectId, floorplanId);
  }

  const fixtures = await DaliApi.getPlacedFixtures(projectId, floorplanId);
  const result = DaliNetworkManager.importFixtures(doc, fixtures);

  // The floorplan is the shared document identifier. Record the version
  // under that key so other modules checking freshness for the same
  // document see the same record.
  dispatch(recordDocumentLoaded({ documentId: floorplanId, version: versionAtLoad }));

  return result;
});

export const saveDaliNetwork = createAsyncThunk<
  DaliDocument,
  void,
  { state: RootState }
>("dali/save", async (_, { getState, dispatch }) => {
  const doc = getState().dali.document;
  const dto = DaliDocumentSerializer.toDTO({
    ...doc,
    revision: doc.revision + 1,
    updatedAt: new Date().toISOString(),
  });
  const saved = await DaliNetworkService.save(dto);
  dispatch(bumpDocumentVersion());
  return DaliDocumentSerializer.fromDTO(saved);
});

export const saveDaliNetworkAs = createAsyncThunk<
  DaliDocument,
  { name: string },
  { state: RootState }
>("dali/saveAs", async ({ name }, { getState, dispatch }) => {
  const doc = { ...getState().dali.document, id: null, name, revision: 0 };
  const saved = await DaliApi.createDaliNetwork(
    doc.projectId,
    DaliDocumentSerializer.toDTO(doc)
  );
  dispatch(bumpDocumentVersion());
  return DaliDocumentSerializer.fromDTO(saved);
});

export const loadFloorplan = createAsyncThunk<
  FloorplanRenderModel,
  { floorplanId: string },
  { state: RootState }
>("dali/loadFloorplan", async ({ floorplanId }, { getState, dispatch, rejectWithValue }) => {
  const versionAtLoad = selectCurrentDocumentVersion(getState());

  const outcome = await FloorplanLoader.load(floorplanId, false);
  if (!outcome.ok) return rejectWithValue(outcome.error);

  dispatch(recordDocumentLoaded({ documentId: floorplanId, version: versionAtLoad }));
  return outcome.model;
});

export const loadRawGeometry = createAsyncThunk<
  any[],
  void,
  { state: RootState }
>("dali/loadRawGeometry", async (_, { getState, rejectWithValue }) => {
  const rawPayload = getState().dali.floorplan.model?._rawPayload;
  if (!rawPayload) return rejectWithValue("No raw payload available");
  try {
    return FloorplanLoader.extractRawGeometry(rawPayload);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const addDaliLine = createAsyncThunk<DaliDocument, void, { state: RootState }>(
  "dali/addLine",
  async (_, { getState }) => {
    const doc = getState().dali.document;
    return DaliNetworkManager.addLine(doc).doc;
  }
);

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

export const addDeviceFromLibrary = createAsyncThunk<
  DaliDocument,
  {
    kind: DeviceKind;
    model: string;
    productId?: string;
    productCode?: string;
    sourceKind?: string;
    wattage?: number;
  },
  { state: RootState }
>(
  "dali/addDevice",
  async ({ kind, model, productId, productCode, sourceKind, wattage }, { getState }) => {
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
      metadata: { productId, sourceKind, luminaireType: productCode, wattage },
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
    devices: doc.devices.map((d) => (d.id === deviceId ? { ...d, address } : d)),
  };
});

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
        if (d.lineId !== lineId) return { ...d, lineId, address: null };
        return { ...d, lineId };
      }),
    };
  }
);

export const syncDevicesWithFixtures = createAsyncThunk<
  DaliDocument,
  void,
  { state: RootState }
>("dali/sync", async (_, { getState }) => {
  const doc = getState().dali.document;
  const fixtures = await DaliApi.getPlacedFixtures(doc.projectId, doc.floorplanId);
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));
  const updated: DaliDevice[] = [];
  const matchedFixtureIds = new Set<string>();

  for (const d of doc.devices) {
    if (d.id.startsWith(LIBRARY_DEVICE_PREFIX)) {
      updated.push(d);
      continue;
    }
    const fixture = fixtureById.get(d.sourceFixtureId);
    if (!fixture) continue;
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
      ? { deviceIds: (g as any).deviceIds.filter((id: string) => liveIds.has(id)) }
      : {}),
  }));

  const lines = doc.lines.map((l) => ({
    ...l,
    ...(Array.isArray((l as any).deviceIds)
      ? { deviceIds: (l as any).deviceIds.filter((id: string) => liveIds.has(id)) }
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
    lineId: d.lineId && lineIdsSet.has(d.lineId) ? d.lineId : null,
  }));

  return { ...doc, devices: finalDevices, groups, lines, scenes };
});

export const autoAddress = createAsyncThunk<DaliDocument, void, { state: RootState }>(
  "dali/autoAddress",
  async (_, { getState }) => {
    const doc = getState().dali.document;
    return { ...doc, devices: AddressAllocator.autoAddress(doc.devices) };
  }
);

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

export const validateNetwork = createAsyncThunk<
  ReturnType<typeof ValidationService.validate>,
  void,
  { state: RootState }
>("dali/validate", async (_, { getState }) => {
  return ValidationService.validate(getState().dali.document);
});