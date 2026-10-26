import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ResetNetworkDialog } from "@/modules/DaliDesigner/Dialogs/ResetNetworkDialog";

export function ResetNetworkButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn tb-danger"
        onClick={() => setOpen(true)}
        title="Discard in-memory changes and reload from the server"
      >
        <RotateCcw size={14} />
          <span className="tb-label">Reset</span>
        </button>
      {open && <ResetNetworkDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default ResetNetworkButton;

