import React, { useState } from "react";

interface NewFloorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; levelIndex: number; heightMeters: number }) => void;
}

export default function NewFloorDialog({ isOpen, onClose, onConfirm }: NewFloorDialogProps) {
  const [name, setName] = useState("");
  const [levelIndex, setLevelIndex] = useState("0");
  const [heightMeters, setHeightMeters] = useState("3.2");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onConfirm({
      name: name.trim(),
      levelIndex: parseInt(levelIndex) || 0,
      heightMeters: parseFloat(heightMeters) || 3.2
    });

    setName("");
    setLevelIndex("0");
    setHeightMeters("3.2");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>🥞</span> Provision Floor Height Plane
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Floor Layer Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Level 03 - Server Enclosure"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Relative Plane Index</label>
              <input
                type="number"
                value={levelIndex}
                onChange={(e) => setLevelIndex(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Clearance Height Constraint</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={heightMeters}
                  onChange={(e) => setHeightMeters(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">m</span>
              </div>
            </div>
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
              Inject Height Plane
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
