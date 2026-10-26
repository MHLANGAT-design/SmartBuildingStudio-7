import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { syncDevicesWithFixtures } from "@/modules/DaliDesigner/store/daliThunks";
import { selectStatus } from "@/modules/DaliDesigner/store/daliSelectors";

export function SyncDevicesButton() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectStatus);
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    setRunning(true);
    try {
      await dispatch(syncDevicesWithFixtures()).unwrap();
    } catch (err) {
      // Thunk rejected — the fetch or reconciliation failed. Log for
      // now; a toast/dialog is the natural next step but out of scope
      // for this change.
      console.error("[SyncDevicesButton] Sync failed:", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <button
      className="tb-btn"
      disabled={status === "saving" || running}
      onClick={handleClick}
      title="Reconcile the device list with the floorplan's current fixtures"
    >
      <RefreshCw size={14} className={running ? "spin" : undefined} />
      <span className="tb-label">{running ? "Syncing…" : "Sync Devices"}</span>
    </button>
  );
}

export default SyncDevicesButton;