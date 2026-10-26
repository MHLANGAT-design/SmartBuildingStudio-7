import React from "react";
import { useAppDispatch } from "@/store/hooks";
import { autoAddress } from "@/modules/DaliDesigner/store/daliThunks";

export function AutoAddressDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Auto Address Devices</h3>
        <p>Assign sequential DALI addresses starting from 0.</p>
        <button onClick={() => { dispatch(autoAddress()); onClose(); }}>Run</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}