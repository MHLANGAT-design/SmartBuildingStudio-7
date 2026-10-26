import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { validateNetwork } from "@/modules/DaliDesigner/store/daliThunks";
import { ValidationReportDialog } from "@/modules/DaliDesigner/Dialogs/ValidationReportDialog";

export function ValidateNetworkButton() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    setRunning(true);
    try {
      await dispatch(validateNetwork()).unwrap();
      setOpen(true);
    } catch (err) {
      console.error("[ValidateNetworkButton] Validation failed:", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <button
        className="tb-btn"
        onClick={handleClick}
        disabled={running}
        title="Check addresses, lines, groups, and scenes for conflicts"
      >
        <ShieldCheck size={14} />
        <span className="tb-label">
          {running ? "Validating…" : "Validate"}
        </span>
      </button>
      {open && <ValidationReportDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default ValidateNetworkButton;