import React from "react";
import { Hash } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDeviceAddress } from "@/modules/DaliDesigner/store/daliThunks";
import { selectSelection } from "@/modules/DaliDesigner/store/daliSelectors";

export function ManualAddressButton() {
  const dispatch = useAppDispatch();
  const sel = useAppSelector(selectSelection);
  const disabled = sel.deviceIds.length !== 1;

  return (
    <button
      className="tb-btn"
      disabled={disabled}
      onClick={() => {
        const v = window.prompt("Assign address (0–63):");
        if (!v) return;
        const addr = Number(v);
        if (!Number.isFinite(addr) || addr < 0 || addr > 63) return;
        dispatch(setDeviceAddress({ deviceId: sel.deviceIds[0], address: addr }));
      }}
      title={
        disabled
          ? "Select exactly one device to assign a manual address"
          : "Assign a specific DALI address to the selected device"
      }
    >
      <Hash size={14} />
        <span className="tb-label">Manual Address</span>
      </button>
  );
}

export default ManualAddressButton;

