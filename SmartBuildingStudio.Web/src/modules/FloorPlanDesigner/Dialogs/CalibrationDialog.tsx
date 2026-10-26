import React, { useState, useEffect } from "react";

interface CalibrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (realWorldDistanceMeters: number) => void;
  pixelDistance?: number;
}

export default function CalibrationDialog({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  onConfirm: propOnConfirm, 
  pixelDistance: propPixelDistance = 0 
}: CalibrationDialogProps) {
  
  // 🚀 FIXED: Injected local state anchors to catch cross-module tool triggers autonomously!
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [localPixelDistance, setLocalPixelDistance] = useState(0);
  const [distance, setDistance] = useState<string>("5.0");

  // Synchronize with parent props if they happen to change state correctly
  useEffect(() => {
    setLocalIsOpen(propIsOpen);
  }, [propIsOpen]);

  useEffect(() => {
    if (propPixelDistance > 0) setLocalPixelDistance(propPixelDistance);
  }, [propPixelDistance]);

  // 🚀 FIXED: Global Event Interceptor listening for Calibration tool mouse completions!
  useEffect(() => {
    const handleTriggerCalibrationPrompt = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail) return;
      
      const pixels = customEvent.detail.pixelDistance || customEvent.detail.pixels || 0;
      
      setLocalPixelDistance(pixels);
      setLocalIsOpen(true);
    };

    window.addEventListener("sbs:calibration-complete", handleTriggerCalibrationPrompt);
    return () => {
      window.removeEventListener("sbs:calibration-complete", handleTriggerCalibrationPrompt);
    };
  }, []);

  const handleClose = () => {
    setLocalIsOpen(false);
    if (typeof propOnClose === "function") propOnClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(distance);
    if (!isNaN(parsed) && parsed > 0) {
      if (typeof propOnConfirm === "function") {
        propOnConfirm(parsed);
      } else {
        // Fallback pipeline trigger forcing canvas workspace model scale mutations natively
        window.dispatchEvent(new CustomEvent("sbs:apply-calibration-scale", { detail: { meters: parsed, pixels: localPixelDistance } }));
      }
      setLocalIsOpen(false);
    }
  };

  if (!localIsOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>📏</span> Set Dimension Calibration
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/60 text-xs text-slate-400 space-y-1">
            <p>You have dragged a calibration vector across the canvas area.</p>
            <p className="font-mono text-slate-500">Measured Component: {localPixelDistance.toFixed(1)} pixels</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Real-World Distance (Metres)</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="e.g., 12.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                autoFocus
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">m</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-md transition-colors"
            >
              Apply Scale Factor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
