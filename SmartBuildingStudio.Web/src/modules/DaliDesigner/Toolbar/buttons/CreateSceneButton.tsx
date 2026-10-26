import React, { useState } from "react";
import { Palette } from "lucide-react";
import { CreateSceneDialog } from "@/modules/DaliDesigner/Dialogs/CreateSceneDialog";

export function CreateSceneButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="tb-btn"
        onClick={() => setOpen(true)}
        title="Create a new scene"
      >
        <Palette size={14} />
          <span className="tb-label">Create Scene</span>
        </button>
      {open && <CreateSceneDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default CreateSceneButton;

