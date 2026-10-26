import React, { useState } from "react";

interface UserPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: { defaultUnit: "mm" | "m" | "ft"; defaultModule: string; startupRefresh: boolean }) => void;
}

export default function UserPreferencesDialog({ isOpen, onClose, onSave }: UserPreferencesDialogProps) {
  const [defaultUnit, setDefaultUnit] = useState<"mm" | "m" | "ft">("mm");
  const [defaultModule, setDefaultModule] = useState("/designer/floorplan");
  const [startupRefresh, setStartupRefresh] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ defaultUnit, defaultModule, startupRefresh });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>👤</span> Operator Preferences
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Default Measurement Unit System</label>
            <div className="flex gap-2">
              {(["mm", "m", "ft"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setDefaultUnit(unit)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-colors ${
                    defaultUnit === unit
                      ? "bg-blue-600/10 border-blue-500 text-blue-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Default Startup Engineering Studio</label>
            <select
              value={defaultModule}
              onChange={(e) => setDefaultModule(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="/designer/floorplan">Floor Plan Designer Workspace</option>
              <option value="/designer/fixtures">Fixture Placement Studio</option>
              <option value="/designer/dali">DALI Loop Network Manager</option>
            </select>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <div className="space-y-0.5">
                <span className="font-semibold block">Automatic Startup Refresh</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Query all server tables instantly on application boot</span>
              </div>
              <input
                type="checkbox"
                checked={startupRefresh}
                onChange={(e) => setStartupRefresh(e.target.checked)}
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
              Apply Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
