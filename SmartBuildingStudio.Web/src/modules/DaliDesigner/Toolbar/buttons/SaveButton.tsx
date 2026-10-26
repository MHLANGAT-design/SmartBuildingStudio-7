import React from "react";
import { Save } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { saveDaliNetwork } from "@/modules/DaliDesigner/store/daliThunks";
import { selectDirty, selectStatus } from "@/modules/DaliDesigner/store/daliSelectors";

export function SaveButton() {
  const dispatch = useAppDispatch();
  const dirty = useAppSelector(selectDirty);
  const status = useAppSelector(selectStatus);

  return (
    <button
      className="tb-btn tb-primary"
      disabled={!dirty || status === "saving"}
      onClick={() => dispatch(saveDaliNetwork())}
      title="Save the DALI network (Ctrl+S)"
    >
      <Save size={14} />
      <span className="tb-label">
        {status === "saving" ? "Saving…" : "Save"}
      </span>
    </button>
  );
}

export default SaveButton;