import React from "react";
import { Waypoints } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { addDaliLine } from "@/modules/DaliDesigner/store/daliThunks";

export function AddDaliLineButton() {
  const dispatch = useAppDispatch();

  return (
    <button
      className="tb-btn"
      onClick={() => dispatch(addDaliLine())}
      title="Add a new DALI line"
    >
      <Waypoints size={14} />
        <span className="tb-label">DALI Line</span>
      </button>
  );
}

export default AddDaliLineButton;

