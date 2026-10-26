import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDocument } from "@/modules/DaliDesigner/store/daliSelectors";
import { ValidationService } from "@/modules/DaliDesigner/services/ValidationService";
import { CommissioningService } from "@/modules/DaliDesigner/services/CommissioningService";
import {
  CommissionResult,
} from "@/modules/DaliDesigner/Document/CommissioningManager";
import { setCommissioningStatus } from "@/modules/DaliDesigner/store/daliSlice";

type Phase = "preflight" | "running" | "result";

export function CommissionDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDocument);

  const preflight = useMemo(() => {
    const issues = ValidationService.validate(doc);
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    return { errorCount, warningCount };
  }, [doc]);

  const [phase, setPhase] = useState<Phase>("preflight");
  const [result, setResult] = useState<CommissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRun = () => {
    setPhase("running");
    setErrorMsg(null);
    // Defer so the "running" state paints before the sync commission runs.
    setTimeout(() => {
      try {
        const r = CommissioningService.run(doc);
        setResult(r);
        setPhase("result");
        // Persist the resulting status into the document.
        dispatch(setCommissioningStatus(r.status));
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Commissioning failed");
      }
    }, 0);
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Commission Network</h3>

        {phase === "preflight" && (
          <>
            <p>
              <b>{doc.devices.length}</b> devices on{" "}
              <b>{doc.lines.length}</b> lines
            </p>
            <p>
              {preflight.errorCount} blocking error
              {preflight.errorCount === 1 ? "" : "s"},{" "}
              {preflight.warningCount} warning
              {preflight.warningCount === 1 ? "" : "s"}
            </p>
            {preflight.errorCount > 0 && (
              <p className="dialog-error">
                Resolve blocking errors before commissioning.
              </p>
            )}
            <div className="dialog-actions">
              <button
                className="tb-btn tb-primary"
                onClick={handleRun}
                disabled={preflight.errorCount > 0}
                title={
                  preflight.errorCount > 0
                    ? "Fix blocking errors before commissioning"
                    : "Push configuration to the DALI bus"
                }
              >
                <span className="tb-label">Start Commissioning</span>
              </button>
              <button className="tb-btn" onClick={onClose}>
                <span className="tb-label">Cancel</span>
              </button>
            </div>
          </>
        )}

        {phase === "running" && <p className="dialog-status">Commissioning…</p>}

        {phase === "result" && result && (
          <>
            <p>
              Status: <b>{result.status}</b>
            </p>
            {result.status === "failed" && (
              <p className="dialog-error">
                {preflight.errorCount} blocking error
                {preflight.errorCount === 1 ? "" : "s"} prevented commissioning.
              </p>
            )}
            {result.status === "commissioned" && (
              <p>The network is commissioned. The document has been marked accordingly.</p>
            )}
            {errorMsg && <p className="dialog-error">{errorMsg}</p>}
            <div className="dialog-actions">
              <button className="tb-btn tb-primary" onClick={onClose}>
                <span className="tb-label">Close</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}