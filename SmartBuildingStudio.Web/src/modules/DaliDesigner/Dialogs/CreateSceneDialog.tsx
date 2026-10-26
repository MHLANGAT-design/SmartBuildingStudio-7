import React, { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { createScene } from "@/modules/DaliDesigner/store/daliSlice";

export function CreateSceneDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const dispatch = useAppDispatch();
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Create Scene</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scene name" />
        <button disabled={!name} onClick={() => { dispatch(createScene({ name })); onClose(); }}>
          Create
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}