import React, { useState } from "react";
import { Rocket } from "lucide-react";
import { CommissionDialog } from "@/modules/DaliDesigner/Dialogs/CommissionDialog";

export function CommissionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn tb-primary"
        onClick={() => setOpen(true)}
        title="Push the network configuration to the DALI bus"
      >
        <Rocket size={14} />
          <span className="tb-label">Commission</span>
        </button>
      {open && <CommissionDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default CommissionButton;

