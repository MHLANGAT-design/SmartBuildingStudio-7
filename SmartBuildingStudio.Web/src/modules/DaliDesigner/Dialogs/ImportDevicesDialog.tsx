import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { syncDevicesWithFixtures } from "@/modules/DaliDesigner/store/daliThunks";
import { selectDevices } from "@/modules/DaliDesigner/store/daliSelectors";

export function ImportDevicesDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const devices = useAppSelector(selectDevices);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Import Devices from Fixtures</h3>
        <p>{devices.length} devices currently loaded.</p>
        <button onClick={() => { dispatch(syncDevicesWithFixtures()); onClose(); }}>
          Sync Now
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}