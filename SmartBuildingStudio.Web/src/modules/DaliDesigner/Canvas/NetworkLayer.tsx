// src/modules/DaliDesigner/Canvas/NetworkLayer.tsx
import React from "react";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

/**
 * Reserved for future floorplan-level DALI overlays:
 * power supplies, backbone routing, signal paths between lines.
 * Currently renders nothing.
 */
export function NetworkLayer(_props: Props) {
  const visible = useLayerVisible("network");
  if (!visible) return null;
  return null;
}

export default NetworkLayer;