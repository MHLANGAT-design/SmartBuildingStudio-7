// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasKeyboard.ts
//
// Global keyboard handlers scoped to the canvas: Space-pan, Delete /
// Backspace, tool-local onKeyDown, and Escape to clear multi-selection.
// All handlers ignore keystrokes typed into inputs / textareas /
// contentEditable elements, matching the original component.

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { clearMultiSelection } from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import { deleteSelection } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/deleteSelection';

/** Returns true when focus is in a text-entry field, so we should skip. */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable === true
  );
}

interface UseCanvasKeyboardArgs {
  isReadOnly: boolean;
  /** Active tool id, used to consult the tool / ToolManager for onKeyDown. */
  currentTool: string;
  /** Returns the per-canvas tool instance for the active tool, or null. */
  getActiveToolInstance: () => any;
  /** Shared ToolManager (owns split-wall, future tools). */
  toolManager: any;
  /** True when the ToolManager knows about the active tool id. */
  toolManagerKnowsTool: (toolId: string) => boolean;
  /** Space-down → set true; used by pointer handlers to enter pan mode. */
  setIsSpaceDown: (v: boolean) => void;
  /** Space-release / blur cancellation for an in-progress pan. */
  handleMouseUpOrLeave: (e?: any) => void;
  /** Clears the canvas's local hovered id, e.g. on tool change. */
  isSpacePanningRef: React.MutableRefObject<boolean>;
}

/**
 * Installs three window-level keyboard listeners:
 *   1. Space (pan modifier)
 *   2. Delete / Backspace (delete selection)
 *   3. Everything else + Escape (delegate to active tool, then clear multi)
 *
 * All three are cleaned up on unmount.
 */
export function useCanvasKeyboard({
  isReadOnly,
  currentTool,
  getActiveToolInstance,
  toolManager,
  toolManagerKnowsTool,
  setIsSpaceDown,
  handleMouseUpOrLeave,
  isSpacePanningRef,
}: UseCanvasKeyboardArgs): void {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((s: any) => s.floorPlan || {});

  // ── 1. Space-pan modifier ───────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      setIsSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      setIsSpaceDown(false);
      if (isSpacePanningRef.current) {
        isSpacePanningRef.current = false;
        handleMouseUpOrLeave();
      }
    };
    const onBlur = () => {
      setIsSpaceDown(false);
      if (isSpacePanningRef.current) {
        isSpacePanningRef.current = false;
        handleMouseUpOrLeave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [setIsSpaceDown, handleMouseUpOrLeave, isSpacePanningRef]);

  // ── 2. Delete / Backspace ──────────────────────────────────────────
  useEffect(() => {
    if (isReadOnly) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (isTypingTarget(document.activeElement)) return;

      const removed = deleteSelection({ state: floorPlanState, dispatch });
      if (removed) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isReadOnly, floorPlanState, dispatch]);

  // ── 3. Tool onKeyDown + Escape ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;

      const tool = getActiveToolInstance();
      if (tool && typeof tool.onKeyDown === 'function') {
        try {
          const consumed = tool.onKeyDown(e);
          if (consumed === true) {
            e.preventDefault();
            return;
          }
        } catch { /* tool swallowed the error */ }
      } else if (
        toolManagerKnowsTool(currentTool) &&
        toolManager &&
        typeof toolManager.onKeyDown === 'function'
      ) {
        try {
          const consumed = toolManager.onKeyDown(currentTool, e);
          if (consumed === true) {
            e.preventDefault();
            return;
          }
        } catch { /* swallow */ }
      }

      if (e.key !== 'Escape') return;
      const ms: string[] = Array.isArray(floorPlanState?.multiSelection)
        ? floorPlanState.multiSelection
        : [];
      if (ms.length === 0) return;
      dispatch(clearMultiSelection());
      window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    currentTool,
    getActiveToolInstance,
    toolManager,
    toolManagerKnowsTool,
    floorPlanState,
    dispatch,
  ]);
}