// src/modules/FloorPlanDesigner/Hooks/UseCanvasRedrawing.ts
// Consolidated: O(1) fingerprint instead of O(N) map + stringify.

import { useEffect, useRef } from "react";

/**
 * Safely clones a potentially frozen object into an extensible proxy.
 * Uses a prototype chain to keep original methods accessible.
 */
function makeExtensible<T extends object>(source: T): T {
  if (Object.isExtensible(source) && typeof (source as any).getWalls === "function") {
    return source;
  }

  const shadow = Object.create(source);

  const addGetter = (name: string, fallback: () => any) => {
    if (!(name in shadow) || typeof (shadow as any)[name] !== "function") {
      Object.defineProperty(shadow, name, {
        enumerable: true,
        configurable: true,
        value: fallback,
        writable: true,
      });
    }
  };

  addGetter("getWalls", () => (source as any).walls || []);
  addGetter("getDoors", () => (source as any).doors || []);
  addGetter("getWindows", () => (source as any).windows || []);
  addGetter("getRooms", () => (source as any).rooms || []);
  addGetter("getId", () => (source as any).id || "dxf-runtime-instance");

  const extraProps = new Map<string | symbol, any>();

  return new Proxy(shadow, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (value !== undefined) {
        return typeof value === "function" ? value.bind(target) : value;
      }
      if (extraProps.has(prop)) {
        return extraProps.get(prop);
      }
      return (source as any)[prop];
    },
    set(target, prop, value, _receiver) {
      const descriptor = Object.getOwnPropertyDescriptor(target, prop);
      if (descriptor && descriptor.writable) {
        (target as any)[prop] = value;
        return true;
      }
      extraProps.set(prop, value);
      return true;
    },
    has(target, prop) {
      return Reflect.has(target, prop) || extraProps.has(prop) || prop in (source as any);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      const extra = Array.from(extraProps.keys());
      const sourceKeys = Reflect.ownKeys(source);
      return Array.from(new Set([...keys, ...extra, ...sourceKeys]));
    },
    getOwnPropertyDescriptor(target, prop) {
      const desc = Reflect.getOwnPropertyDescriptor(target, prop);
      if (desc) return desc;
      if (extraProps.has(prop)) {
        return {
          enumerable: true,
          configurable: true,
          value: extraProps.get(prop),
        };
      }
      const sourceDesc = Reflect.getOwnPropertyDescriptor(source, prop);
      if (sourceDesc) return sourceDesc;
      return undefined;
    },
  });
}

/**
 * Hook that triggers a canvas redraw when the active document changes.
 *
 * Uses an O(1) fingerprint (document id + element counts) rather than
 * mapping over every element and JSON.stringify-ing the result. The
 * previous implementation ran `.map()` over 19k+ walls + hundreds of
 * doors/windows on every effect invocation — seconds of main-thread
 * work during load.
 */
export function UseCanvasRedrawing(
  activeDocumentState: any,
  drawingDocInstance: any
) {
  const previousHashRef = useRef<string>("");

  useEffect(() => {
    // ---- Step 1: obtain a safe, extensible instance ----
    let instanceToUse = drawingDocInstance;

    if (
      !instanceToUse ||
      (typeof instanceToUse.getWalls === "function" &&
        instanceToUse.getWalls()?.length === 0)
    ) {
      const globalInstance = (window as any).__floorPlanActiveDocumentInstance;
      if (
        globalInstance &&
        typeof globalInstance.getWalls === "function" &&
        globalInstance.getWalls()?.length > 0
      ) {
        instanceToUse = globalInstance;
      }
    }

    if (
      !instanceToUse ||
      (typeof instanceToUse.getWalls === "function" &&
        instanceToUse.getWalls()?.length === 0)
    ) {
      const backup = (window as any).__floorPlanActiveDocumentInstanceBackup;
      if (
        backup &&
        typeof backup.getWalls === "function" &&
        backup.getWalls()?.length > 0
      ) {
        instanceToUse = backup;
        (window as any).__floorPlanActiveDocumentInstance = backup;
      }
    }

    if (!instanceToUse) {
      // Expected on first mount, before the fetch resolves. No warning.
      return;
    }

    // ---- Step 2: wrap in extensible proxy ----
    const safeInstance = makeExtensible(instanceToUse);

    if (safeInstance !== (window as any).__floorPlanActiveDocumentInstance) {
      (window as any).__floorPlanActiveDocumentInstance = safeInstance;
    }

    // ---- Step 3: O(1) fingerprint ----
    // NOTE: `.length` reads do not iterate the arrays, so this is constant
    // time regardless of document size. If per-element edits need to
    // trigger redraws (thickness, position, etc.), add a monotonically
    // increasing `version` field to the Redux slice and include it here.
    const wallsCount = safeInstance.getWalls?.()?.length ?? 0;
    const doorsCount = safeInstance.getDoors?.()?.length ?? 0;
    const windowsCount = safeInstance.getWindows?.()?.length ?? 0;
    const roomsCount = safeInstance.getRooms?.()?.length ?? 0;
    const drawingsCount = safeInstance.getImportedDrawings?.()?.length ?? 0;
    const docId = safeInstance.getId?.() || "unknown";

    const stateHash =
      `${docId}|${wallsCount}|${doorsCount}|${windowsCount}|${roomsCount}|${drawingsCount}`;

    // ---- Step 4: redraw only if changed ----
    if (previousHashRef.current === stateHash) {
      return;
    }

    previousHashRef.current = stateHash;
    console.log("[UseCanvasRedrawing] Document changed, updating canvas...");

    // Single event — the canvas coalesces bursts via its own rAF scheduler.
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
  }, [drawingDocInstance, activeDocumentState]);
}

export default UseCanvasRedrawing;