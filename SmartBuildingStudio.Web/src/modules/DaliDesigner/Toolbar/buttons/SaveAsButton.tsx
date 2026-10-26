import React, { useState } from "react";
import { SaveAll } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { saveDaliNetworkAs } from "@/modules/DaliDesigner/store/daliThunks";

export function SaveAsButton() {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch(saveDaliNetworkAs({ name: trimmed }));
    setName("");
    setOpen(false);
  };

  return (
    <>
      <button
        className="tb-btn"
        title="Save this DALI network under a new name"
        onClick={() => setOpen(true)}
      >
        <SaveAll size={14} />
          <span className="tb-label">Save As…</span>
        </button>

      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div
            className="dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dali-saveas-title"
          >
            <h3 id="dali-saveas-title">Save DALI Network As</h3>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Network name"
            />

            <div className="dialog-actions">
              <button className="tb-btn tb-primary" disabled={!name.trim()} onClick={handleSave}>
                  <span className="tb-label">Save As…</span>
                </button>
              <button className="tb-btn" onClick={() => setOpen(false)}>
                  <span className="tb-label">Cancel</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SaveAsButton;