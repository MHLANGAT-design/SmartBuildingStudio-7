import React, { useState } from "react";

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { subnetBufferMA: number; runStrictAudit: boolean }) => void;
}

export default function ProjectSettingsDialog({ isOpen, onClose, onSave }: ProjectSettingsDialogProps) {
  const [subnetBufferMA, setSubnetBufferMA] = useState("50");
  const [runStrictAudit, setRunStrictAudit] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subnetBufferMA: parseFloat(subnetBufferMA) || 50,
      runStrictAudit
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>⚙️</span> Studio Project Configurations
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">DALI Subnet Bus Safety Margin Buffer</label>
            <div className="relative">
              <input
                type="number"
                value={subnetBufferMA}
                onChange={(e) => setSubnetBufferMA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">mA</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Maintains power supply current protection thresholds across connected digital twin loops.
            </p>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <div className="space-y-0.5">
                <span className="font-semibold block">Enforce Strict Compliance Audits</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Flags errors instantly if circuit paths miss sensor nodes</span>
              </div>
              <input
                type="checkbox"
                checked={runStrictAudit}
                onChange={(e) => setRunStrictAudit(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-md transition-colors"
            >
              Apply Configurations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
