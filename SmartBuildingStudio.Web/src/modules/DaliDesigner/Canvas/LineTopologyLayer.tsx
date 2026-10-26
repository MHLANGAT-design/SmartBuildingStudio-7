// src/modules/DaliDesigner/Canvas/LineTopologyLayer.tsx
import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectLines, selectDevices } from "@/modules/DaliDesigner/store/daliSelectors";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

export function LineTopologyLayer({ transform }: Props) {
  const visible = useLayerVisible("lineTopology");
  const lines = useAppSelector(selectLines);
  const devices = useAppSelector(selectDevices);

  if (!visible) return null;

  const toScreen = (p: { x: number; y: number }) => ({
    x: transform.width / 2 + transform.offsetX + (p.x - transform.centerX) * transform.finalScale,
    y: transform.height / 2 + transform.offsetY + (p.y - transform.centerY) * transform.yScale,
  });

  return (
    <g className="dali-layer dali-layer-topology">
      {lines.map((line) => {
        const members = devices.filter((d) => d.lineId === line.id);
        if (members.length < 2) return null;

        const d = members
          .map((m, i) => {
            const p = toScreen(m.metadata.position ?? { x: 0, y: 0 });
            return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
          })
          .join(" ");

        return (
          <path
            key={line.id}
            d={d}
            fill="none"
            stroke="#4ea1ff"
            strokeOpacity={0.5}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
}

export default LineTopologyLayer;