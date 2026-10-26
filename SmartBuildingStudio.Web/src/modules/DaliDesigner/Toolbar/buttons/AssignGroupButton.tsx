import React, { useState } from "react";
import { Users } from "lucide-react";
import { CreateGroupDialog } from "@/modules/DaliDesigner/Dialogs/CreateGroupDialog";

export function AssignGroupButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn"
        onClick={() => setOpen(true)}
        title="Assign selected devices to a group"
      >
        <Users size={14} />
          <span className="tb-label">Assign Group</span>
        </button>
      {open && <CreateGroupDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default AssignGroupButton;

