// src/modules/DaliDesigner/Canvas/AddressMapLayer.tsx
import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectDevices } from "@/modules/DaliDesigner/store/daliSelectors";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

export function AddressMapLayer({ transform }: Props) {
  const visible = useLayerVisible("addressMap");
  const devices = useAppSelector(selectDevices);

  if (!visible) return null;

  // Only label devices with a real position. Library-added devices
  // (dev-lib-…) have no metadata.position and would otherwise default
  // to (0, 0) in world space — drawing their labels off the plan.
  const positionedDevices = devices.filter(
    (d) => !!d.metadata.position && d.address != null
  );

  const toScreen = (p: { x: number; y: number }) => ({
    x:
      transform.width / 2 +
      transform.offsetX +
      (p.x - transform.centerX) * transform.finalScale,
    y:
      transform.height / 2 +
      transform.offsetY +
      (p.y - transform.centerY) * transform.yScale,
  });

  return (
    <g className="dali-layer dali-layer-address">
      {positionedDevices.map((d) => {
        const p = toScreen(d.metadata.position!);
        return (
          <text
            key={d.id}
            x={p.x + 10}
            y={p.y - 6}
            fill="#7ecbff"
            fontSize={9}
            fontFamily="monospace"
            fontWeight="bold"
            style={{
              paintOrder: "stroke",
              stroke: "rgba(0, 0, 0, 0.75)",
              strokeWidth: 3,
              pointerEvents: "none",
            }}
          >
            #{String(d.address).padStart(3, "0")}
          </text>
        );
      })}
    </g>
  );
}

export default AddressMapLayer;