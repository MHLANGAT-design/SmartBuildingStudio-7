import React, { useState } from "react";
import { ListOrdered } from "lucide-react";
import { AutoAddressDialog } from "@/modules/DaliDesigner/Dialogs/AutoAddressDialog";

export function AutoAddressButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn"
        onClick={() => setOpen(true)}
        title="Assign sequential DALI addresses to unaddressed devices"
      >
        <ListOrdered size={14} />
          <span className="tb-label">Auto Address</span>
        </button>
      {open && <AutoAddressDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default AutoAddressButton;

