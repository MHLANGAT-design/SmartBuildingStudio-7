import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectValidationIssues } from "@/modules/DaliDesigner/store/daliSelectors";

export function ValidationReportDialog({ onClose }: { onClose: () => void }) {
  const issues = useAppSelector(selectValidationIssues);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Validation Report</h3>
        {issues.length === 0 ? (
          <p>No issues. ✓</p>
        ) : (
          <ul>
            {issues.map((i) => (
              <li key={i.id}>
                <b>[{i.severity}]</b> {i.code} — {i.message}
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}