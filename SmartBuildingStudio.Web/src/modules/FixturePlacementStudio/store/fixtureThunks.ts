// src/modules/FixturePlacementStudio/store/fixtureThunks.ts

import type { AppDispatch, RootState } from '@/Application/ConfigureStore';
import { nanoid } from 'nanoid';
import { FixtureDocumentManager } from '@/modules/FixturePlacementStudio/Document/FixtureDocumentManager';
import type { ActivationContext } from '@/modules/FixturePlacementStudio/Document/FixtureDocumentManager';
import { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';
import { FixtureHistory } from '@/modules/FixturePlacementStudio/Document/FixtureHistory';
import {
  beginLoad,
  loadSucceeded,
  loadFailed,
  beginSave,
  saveSucceeded,
  saveConflict,
  saveFailed,
  beginCalculation,
  calculationSucceeded,
  calculationFailed,
  beginValidation,
  validationSucceeded,
  validationFailed,
  setRuleSet,
  mergeFixtures,
} from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { DEFAULT_RULE_SET } from '@/modules/FixturePlacementStudio/constants/defaultRuleSet';
import { PhotometricService, extractWallSegments } from '@/modules/FixturePlacementStudio/services/PhotometricService';
import { LuxCalculationService } from '@/modules/FixturePlacementStudio/services/LuxCalculationService';
import { ValidationService } from '@/modules/FixturePlacementStudio/services/ValidationService';
import {
  selectPhotometricService,
  selectLayout,
  selectRuleSet,
  selectValidationLayoutHash,
  selectDocumentId,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import type { CalculationKind, CalculationScope } from '@/modules/FixturePlacementStudio/models/LightingCalculation';
import {
  deserializeFixture,
  type Fixture,
} from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import {
  bumpDocumentVersion,
  recordDocumentLoaded,
} from '@/modules/Shared/DocumentVersion/documentVersionSlice';
import { selectCurrentDocumentVersion } from '@/modules/Shared/DocumentVersion/selectDocumentFresh';

// ─── Load ─────────────────────────────────────────────────────────────────────

export function loadDocumentThunk(context: ActivationContext) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const versionAtLoad = selectCurrentDocumentVersion(getState());

    dispatch(beginLoad({ activationContext: context }));

    const outcome = await FixtureDocumentManager.load(context);
    if (!outcome.ok) {
      dispatch(loadFailed({ error: outcome.error }));
      return;
    }

    const fixtureDocument = outcome.fixtureDocument;
    const layout = fixtureDocument.getLayout();

    const history = new FixtureHistory({
      fixtures: layout.fixtures,
      zones: layout.zones,
      label: 'Initial load',
    });
    SessionRegistry.register(context.documentId, {
      fixtureDocument,
      history,
    });

    dispatch(
      loadSucceeded({
        documentId: context.documentId,
        layout,
      })
    );

    dispatch(setRuleSet({ ruleSet: DEFAULT_RULE_SET }));

    dispatch(
      recordDocumentLoaded({ documentId: context.documentId, version: versionAtLoad })
    );
  };
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export function saveDocumentThunk() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const documentId = state.fixture.documentId;
    if (!documentId) {
      dispatch(saveFailed({ error: 'No document loaded.' }));
      return;
    }

    const session = SessionRegistry.get(documentId);
    if (!session) {
      dispatch(saveFailed({ error: 'Session not found for document.' }));
      return;
    }

    dispatch(beginSave());

    const layout = selectLayout(state);
    if (layout) {
      session.fixtureDocument.setLayout(layout);
    }

    const outcome = await FixtureDocumentManager.save(session.fixtureDocument);

    if (outcome.ok) {
      dispatch(saveSucceeded({ revision: outcome.revision }));
      const freshLayout = session.fixtureDocument.getLayout();
      session.history.reset({
        fixtures: freshLayout.fixtures,
        zones: freshLayout.zones,
        label: 'Post-save',
      });
      dispatch(bumpDocumentVersion());
      return;
    }

    if (outcome.conflict) {
      dispatch(
        saveConflict({
          serverRevision: outcome.serverRevision,
          clientRevision: outcome.clientRevision,
        })
      );
      return;
    }

    dispatch(saveFailed({ error: outcome.error }));
  };
}

// ─── Calculations ────────────────────────────────────────────────────────────

export function runCalculationThunk(args: {
  kind: CalculationKind;
  scope?: CalculationScope;
  resolutionMeters?: number;
  heightMeters?: number;
  targetLux?: number;
}) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const layout = selectLayout(state);
    if (!layout) {
      dispatch(calculationFailed({ kind: args.kind, error: 'No layout loaded.' }));
      return;
    }

    dispatch(beginCalculation({ kind: args.kind, scope: args.scope }));

    const documentId = selectDocumentId(state);
    let walls: ReturnType<typeof extractWallSegments> = [];
    if (documentId) {
      const session = SessionRegistry.get(documentId);
      const doc = session?.fixtureDocument?.getDrawingDocument?.();
      if (doc) {
        const elements = doc.getElements();
        walls = extractWallSegments(elements as any[]);
      }
    }

    const photometric: PhotometricService = selectPhotometricService(state);
    const calculator = new LuxCalculationService(photometric);

    try {
      const calc = await calculator.run(layout, args.kind, args.scope, {
        resolutionMeters: args.resolutionMeters,
        heightMeters: args.heightMeters,
        targetLux: args.targetLux,
        walls,
      });

      if (calc.status === 'complete') {
        dispatch(calculationSucceeded({ calculation: calc }));
      } else {
        dispatch(
          calculationFailed({
            kind: args.kind,
            error: calc.error ?? 'Unknown calculation failure.',
          })
        );
      }
    } catch (error: any) {
      dispatch(
        calculationFailed({
          kind: args.kind,
          error: error?.message ?? 'Unknown calculation error.',
        })
      );
    }
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function runValidationThunk() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const layout = selectLayout(state);
    const ruleSet = selectRuleSet(state);

    if (!layout) {
      dispatch(validationFailed({ error: 'No layout loaded.' }));
      return;
    }
    if (!ruleSet) {
      dispatch(validationFailed({ error: 'No rule set loaded.' }));
      return;
    }

    dispatch(beginValidation());

    try {
      const layoutHash = selectValidationLayoutHash(state);
      const report = ValidationService.validate(layout, ruleSet.rules, layoutHash);
      dispatch(validationSucceeded({ report }));
    } catch (error: any) {
      dispatch(
        validationFailed({
          error: error?.message ?? 'Unknown validation error.',
        })
      );
    }
  };
}

// ─── Import ──────────────────────────────────────────────────────────────────

export function importFixturesThunk(payload: unknown) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const layout = selectLayout(state);
    if (!layout) {
      throw new Error('No layout loaded — cannot import.');
    }

    const parsed = parseImportPayload(payload, layout.documentId);

    const idMap = new Map<string, string>();
    const newFixtures = parsed.fixtures.map((f) => {
      const newId = `fx-imp-${nanoid(10)}`;
      idMap.set(f.id, newId);
      return { ...f, id: newId, documentId: layout.documentId };
    });

    const newZones = parsed.zones.map((z) => ({
      ...z,
      id: `zone-imp-${nanoid(10)}`,
      documentId: layout.documentId,
      memberFixtureIds: z.memberFixtureIds
        .map((oldId) => idMap.get(oldId))
        .filter((id): id is string => typeof id === 'string'),
    }));

    dispatch(mergeFixtures({ fixtures: newFixtures, zones: newZones }));

    return {
      importedFixtures: newFixtures.length,
      importedZones: newZones.length,
      sourceDocumentId: parsed.documentId,
    };
  };
}

// ─── Import parsing ──────────────────────────────────────────────────────────

interface ParsedImport {
  documentId: string;
  fixtures: Fixture[];
  zones: Zone[];
}

function parseImportPayload(raw: unknown, layoutDocumentId: string): ParsedImport {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Import file is not a JSON object.');
  }
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.fixtures)) {
    throw new Error('Import file has no "fixtures" array.');
  }

  const fixtures = obj.fixtures
    .map((f) => deserializeFixture(f))
    .filter((f): f is Fixture => f !== null);

  const zones: Zone[] = Array.isArray(obj.zones)
    ? (obj.zones as any[]).map((z): Zone => ({
        id: String(z?.id ?? `zone-${nanoid(6)}`),
        name: String(z?.name ?? 'Imported Zone'),
        documentId: String(z?.documentId ?? layoutDocumentId),
        kind: z?.kind ?? 'control',
        mode: z?.mode ?? 'auto',
        memberFixtureIds: Array.isArray(z?.memberFixtureIds)
          ? z.memberFixtureIds.map((id: any) => String(id))
          : [],
        roomIds: Array.isArray(z?.roomIds) ? z.roomIds : [],
        targetLux: typeof z?.targetLux === 'number' ? z.targetLux : undefined,
      }))
    : [];

  return {
    documentId: String(obj.documentId ?? ''),
    fixtures,
    zones,
  };
}