// src/modules/DaliDesigner/Sidebar/SceneExplorer.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectScenes } from "@/modules/DaliDesigner/store/daliSelectors";
import { setActiveScene, setSelection } from "@/modules/DaliDesigner/store/daliSlice";
import { CollapsibleSection } from "./CollapsibleSection";

export function SceneExplorer() {
  const scenes = useAppSelector(selectScenes);
  const dispatch = useAppDispatch();

  return (
    <CollapsibleSection
      sectionKey="scenes"
      title="Scenes"
      count={scenes.length}
      defaultOpen={false}
    >
      {scenes.length === 0 && <em>No scenes</em>}
      <ul>
        {scenes.map((s) => (
          <li key={s.id}>
            <button
              className="link"
              onClick={() => {
                dispatch(setSelection({ deviceIds: [], sceneId: s.id }));
                dispatch(setActiveScene(s.id));
              }}
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}