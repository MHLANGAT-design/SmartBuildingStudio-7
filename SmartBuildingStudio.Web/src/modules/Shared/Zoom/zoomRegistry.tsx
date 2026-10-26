// src/modules/Shared/Zoom/zoomRegistry.tsx
import { useSyncExternalStore, useEffect } from "react";
import type { ZoomableSurface } from "./zoomSurface";

type Listener = () => void;

const _surfaces: ZoomableSurface[] = [];
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

function getActive(): ZoomableSurface | null {
  return _surfaces.length > 0 ? _surfaces[_surfaces.length - 1] : null;
}

function register(surface: ZoomableSurface): () => void {
  _surfaces.push(surface);
  notify();
  return () => {
    const i = _surfaces.indexOf(surface);
    if (i >= 0) _surfaces.splice(i, 1);
    notify();
  };
}

export function registerZoomSurface(surface: ZoomableSurface): () => void {
  return register(surface);
}

export function useActiveZoomSurface(): ZoomableSurface | null {
  return useSyncExternalStore(subscribe, getActive, getActive);
}

export function useZoomSurface(surface: ZoomableSurface | null): void {
  useEffect(() => {
    if (!surface) return;
    return registerZoomSurface(surface);
  }, [surface]);
}