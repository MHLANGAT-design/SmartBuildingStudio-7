// src/modules/DaliDesigner/Canvas/SceneLayer.tsx
import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectActiveScene, selectDevices } from "@/modules/DaliDesigner/store/daliSelectors";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

export function SceneLayer({ transform }: Props) {
  const visible = useLayerVisible("scenes");
  const scene = useAppSelector(selectActiveScene);
  const devices = useAppSelector(selectDevices);

  if (!visible || !scene) return null;

  const toScreen = (p: { x: number; y: number }) => ({
    x: transform.width / 2 + transform.offsetX + (p.x - transform.centerX) * transform.finalScale,
    y: transform.height / 2 + transform.offsetY + (p.y - transform.centerY) * transform.yScale,
  });

  return (
    <g className="dali-layer dali-layer-scene">
      {devices.map((d) => {
        const level = scene.levels[d.id] ?? 0;
        if (level <= 0) return null;
        const p = toScreen(d.metadata.position ?? { x: 0, y: 0 });
        return (
          <circle
            key={d.id}
            cx={p.x}
            cy={p.y}
            r={18}
            fill="yellow"
            fillOpacity={(level / 254) * 0.35}
          />
        );
      })}
    </g>
  );
}

export default SceneLayer;