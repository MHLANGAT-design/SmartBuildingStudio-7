// src/modules/Shared/Zoom/panMode.ts
//
// Module-scoped pan-mode flag. Pan-mode is a UI-level toggle: while
// active, left-drag on a designer canvas pans instead of running the
// canvas's default left-click behavior (marquee select, placement
// commit, etc.).
//
// This is deliberately separate from ZoomableSurface. Pan-mode is
// orthogonal to zoom — it changes how the canvas interprets left
// drags, not what zoom level is. Keeping it in its own store means
// ZoomableSurface stays focused and doesn't have to be re-registered
// every time pan-mode flips.
//
// Any canvas that supports pan-mode reads it with usePanMode() and
// gates its pointer handler on it. GlobalZoomControl writes it.
//
// Same external-store pattern as zoomRegistry: module-level state,
// Set of listeners, useSyncExternalStore for React.

import { useSyncExternalStore } from 'react';

type Listener = () => void;

let _panMode = false;
const _listeners = new Set<Listener>();

function notify() {
  for (const l of _listeners) l();
}

function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return _panMode;
}

export function setPanMode(active: boolean): void {
  if (_panMode === active) return;
  _panMode = active;
  notify();
}

export function togglePanMode(): void {
  setPanMode(!_panMode);
}

export function getPanMode(): boolean {
  return _panMode;
}

/** React hook — re-renders the component whenever pan-mode flips. */
export function usePanMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}