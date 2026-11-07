// src/modules/Commissioning/Dialogs/SceneTestingDialog.tsx

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Footer,
  Field,
  inputStyle,
  errorStyle,
} from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useSceneTesting } from '@/modules/Commissioning/hooks/useSceneTesting';
import { useFloorplanDaliLines } from '@/modules/Commissioning/hooks/useFloorplanDaliLines';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SceneTestingDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { runSceneTests, isTesting } = useSceneTesting();
  const { scenes: scenesFromHook, isLoading: scenesLoading, error: scenesError } =
    useFloorplanDaliLines();

  const scenes = scenesFromHook ?? [];

  // ─── DIAGNOSTIC: what the dialog sees ───
  console.log(
    '[SceneTestingDialog] scenes:',
    scenes,
    '| loading:', scenesLoading,
    '| error:', scenesError,
    '| isOpen:', isOpen,
  );
  // ────────────────────────────────────────

  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleScene = (sceneId: string) => {
    setSelectedSceneIds((current) =>
      current.includes(sceneId)
        ? current.filter((id) => id !== sceneId)
        : [...current, sceneId],
    );
  };

  const canRun = selectedSceneIds.length > 0 && !isTesting;
  const displayedError = error ?? scenesError ?? null;

  const handleRun = async () => {
    // ─── DIAGNOSTIC ───
    console.log(
      '[SceneTestingDialog] handleRun — selectedSceneIds:',
      selectedSceneIds,
    );
    // ──────────────────

    if (selectedSceneIds.length === 0) {
      setError('Select at least one scene to test.');
      return;
    }
    try {
      setError(null);
      await runSceneTests(selectedSceneIds);
      onClose();
    } catch (e: any) {
      console.error('[SceneTestingDialog] runSceneTests threw:', e);
      setError(e?.message ?? 'Scene test failed.');
    }
  };

  return (
    <Modal onClose={onClose} title="Run Scene Tests">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        Select scenes to execute and validate.
      </div>

      {displayedError && <div style={errorStyle}>{displayedError}</div>}

      <Field label="Scenes">
        {scenes.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>
            {scenesLoading ? 'Loading scenes…' : 'No scenes in this floorplan.'}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #1F2937',
              borderRadius: 4,
              padding: 6,
            }}
          >
            {scenes.map((s) => {
              const checked = selectedSceneIds.includes(s.sceneId);
              return (
                <label
                  key={s.sceneId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: checked ? '#E5E7EB' : '#94A3B8',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleScene(s.sceneId)}
                    style={{ cursor: 'pointer', accentColor: '#38BDF8' }}
                  />
                  <span>
                    {s.name}
                    {s.name !== s.sceneId && (
                      <span style={{ color: '#64748B', marginLeft: 6 }}>
                        — {s.sceneId}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </Field>

      <Footer
        onCancel={onClose}
        onConfirm={handleRun}
        confirmLabel={isTesting ? 'Testing…' : 'Run Tests'}
        confirmDisabled={!canRun}
      />
    </Modal>
  );
};