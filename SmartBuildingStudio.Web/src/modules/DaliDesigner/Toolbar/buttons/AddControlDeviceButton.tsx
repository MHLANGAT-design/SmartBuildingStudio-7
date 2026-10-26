import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { AddDeviceDialog } from "@/modules/DaliDesigner/Dialogs/AddDeviceDialog";

export function AddControlDeviceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn"
        onClick={() => setOpen(true)}
        title="Add a control device from the library"
      >
        <PlusCircle size={14} />
          <span className="tb-label">Control Device</span>
        </button>
      {open && <AddDeviceDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default AddControlDeviceButton;

