// src/modules/DaliDesigner/Canvas/ValidationLayer.tsx
import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectValidationIssues } from "@/modules/DaliDesigner/store/daliSelectors";
import { useLayerVisible } from "@/modules/DaliDesigner/hooks/useLayerVisible";
import type { ViewTransform } from "@/modules/Shared/Canvas/Transform";

interface Props {
  transform: ViewTransform;
}

export function ValidationLayer({ transform }: Props) {
  const visible = useLayerVisible("validation");
  const issues = useAppSelector(selectValidationIssues);

  if (!visible) return null;

  const toScreen = (p: { x: number; y: number }) => ({
    x: transform.width / 2 + transform.offsetX + (p.x - transform.centerX) * transform.finalScale,
    y: transform.height / 2 + transform.offsetY + (p.y - transform.centerY) * transform.yScale,
  });

  return (
    <g className="dali-layer dali-layer-validation">
      {issues
        .filter((i) => i.position)
        .map((issue) => {
          const p = toScreen(issue.position!);
          return (
            <g key={issue.id} transform={`translate(${p.x},${p.y})`}>
              <circle r={11} fill="none" stroke="#ff4d4f" strokeWidth={2} />
              <text y={-16} textAnchor="middle" fill="#ff7875" fontSize={9}>
                {issue.code}
              </text>
            </g>
          );
        })}
    </g>
  );
}

export default ValidationLayer;