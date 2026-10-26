import React, { useState } from "react";
import { Upload } from "lucide-react";
import { ImportDevicesDialog } from "@/modules/DaliDesigner/Dialogs/ImportDevicesDialog";

export function ImportDevicesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn"
        onClick={() => setOpen(true)}
        title="Import devices from the floorplan's fixtures"
      >
        <Upload size={14} />
          <span className="tb-label">Import Devices</span>
        </button>
      {open && <ImportDevicesDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default ImportDevicesButton;

