import React, { useState } from "react";

interface DashboardSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { refreshInterval: number; enableCloudSync: boolean; loggingLevel: string }) => void;
}

export default function DashboardSettingsDialog({ isOpen, onClose, onSave }: DashboardSettingsDialogProps) {
  const [refreshInterval, setRefreshInterval] = useState("45");
  const [enableCloudSync, setEnableCloudSync] = useState(true);
  const [loggingLevel, setLoggingLevel] = useState<string>("Information");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      refreshInterval: parseInt(refreshInterval) || 45,
      enableCloudSync,
      loggingLevel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>⚙️</span> System Terminal Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Telemetry Pulling Refresh Interval</label>
            <div className="relative">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="15">High Frequency (15 seconds)</option>
                <option value="45">Standard Interval (45 seconds)</option>
                <option value="120">Consolidated Mode (2 minutes)</option>
                <option value="0">Manual Refreshes Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Database Internal Logging Level</label>
            <select
              value={loggingLevel}
              onChange={(e) => setLoggingLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Verbose">Verbose (Diagnostic Trace)</option>
              <option value="Information">Information (Standard Audit)</option>
              <option value="Warning">Warning (Discrepancy Alerts Only)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <div className="space-y-0.5">
                <span className="font-semibold block">Enable Cloud Synchronization</span>
                <span className="text-[10px] text-slate-500 block leading-tight">Stream background metrics to central SQL server</span>
              </div>
              <input
                type="checkbox"
                checked={enableCloudSync}
                onChange={(e) => setEnableCloudSync(e.target.checked)}
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
              Save Terminal Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}