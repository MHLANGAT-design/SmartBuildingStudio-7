import React, { useCallback } from "react";
import { Play, Square } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveScene } from "@/modules/DaliDesigner/store/daliSlice";
import {
  selectScenes,
  selectSelection,
} from "@/modules/DaliDesigner/store/daliSelectors";

export function TestSceneButton() {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector(selectScenes);
  const selection = useAppSelector(selectSelection);

  const targetSceneId =
    selection.sceneId ?? selection.activeSceneId ?? scenes[0]?.id ?? null;
  const targetScene = scenes.find((s) => s.id === targetSceneId) ?? null;
  const isTesting =
    targetSceneId !== null && selection.activeSceneId === targetSceneId;

  const handleClick = useCallback(() => {
    if (!targetScene) return;
    dispatch(setActiveScene(isTesting ? undefined : targetScene.id));
  }, [dispatch, targetScene, isTesting]);

  const memberCount = targetScene
    ? Object.values(targetScene.levels).filter((l) => l > 0).length
    : 0;

  const disabled = !targetScene;
  const tooltip = !targetScene
    ? "No scene to test"
    : memberCount === 0
    ? `"${targetScene.name}" has no device levels set`
    : isTesting
    ? `Stop testing "${targetScene.name}"`
    : `Test "${targetScene.name}" (${memberCount} devices)`;

  return (
    <button
      className="tb-btn"
      onClick={handleClick}
      disabled={disabled}
      title={tooltip}
    >
      {isTesting ? <Square size={14} /> : <Play size={14} />}
      <span className="tb-label">{isTesting ? "Stop Test" : "Test Scene"}</span>
    </button>
  );
}

export default TestSceneButton;