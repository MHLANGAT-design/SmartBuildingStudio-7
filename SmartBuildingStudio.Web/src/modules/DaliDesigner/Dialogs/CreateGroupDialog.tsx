import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createGroup } from "@/modules/DaliDesigner/store/daliSlice";
import { selectSelection } from "@/modules/DaliDesigner/store/daliSelectors";

export function CreateGroupDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const dispatch = useAppDispatch();
  const sel = useAppSelector(selectSelection);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Create Group</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
        <p>{sel.deviceIds.length} devices selected.</p>
        <button
          disabled={!name}
          onClick={() => { dispatch(createGroup({ name, deviceIds: sel.deviceIds })); onClose(); }}
        >
          Create
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}