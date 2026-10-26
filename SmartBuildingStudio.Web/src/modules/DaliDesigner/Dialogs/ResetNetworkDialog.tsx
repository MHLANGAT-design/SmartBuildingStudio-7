import React from "react";
import { useAppDispatch } from "@/store/hooks";
import { loadDaliNetwork } from "@/modules/DaliDesigner/store/daliThunks";
import { useAppSelector } from "@/store/hooks";
import { selectDocument } from "@/modules/DaliDesigner/store/daliSelectors";

export function ResetNetworkDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDocument);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Reset Network</h3>
        <p>Discard all in-memory DALI changes and reload from ProjectExplorer?</p>
        <button
          onClick={() => {
            if (doc.id) {
              dispatch(loadDaliNetwork({
                projectId: doc.projectId,
                floorplanId: doc.floorplanId,
                networkId: doc.id,
              }));
            }
            onClose();
          }}
        >
          Reset
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}