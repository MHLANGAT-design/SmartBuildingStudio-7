import React, { useState, useEffect } from "react";

interface NewFloorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (floorData: { name: string; level: number; heightMeters: number }) => void;
}

export default function NewFloorDialog({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  onCreate: propOnCreate 
}: NewFloorDialogProps) {
  
  // 🚀 FIXED: Injected autonomous local state tracking variables to override parent property drilling locks!
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("0");
  const [heightMeters, setHeightMeters] = useState("3.2");

  // Keep state components synced up if parent parameters happen to initialize correctly
  useEffect(() => {
    setLocalIsOpen(propIsOpen);
  }, [propIsOpen]);

  // 🚀 FIXED: Global Event Interceptor listening for quick-action "+ Floor" button clicks!
  useEffect(() => {
    const handleTriggerNewFloorPrompt = (e: Event) => {
      setLocalIsOpen(true);
    };

    window.addEventListener("sbs:trigger-new-floor-dialog", handleTriggerNewFloorPrompt);
    return () => {
      window.removeEventListener("sbs:trigger-new-floor-dialog", handleTriggerNewFloorPrompt);
    };
  }, []);

  const handleClose = () => {
    setName("");
    setLocalIsOpen(false);
    if (typeof propOnClose === "function") propOnClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      level: parseInt(level) || 0,
      heightMeters: parseFloat(heightMeters) || 3.2,
    };

    if (typeof propOnCreate === "function") {
      propOnCreate(payload);
    } else {
      // Fallback global event dispatcher notifying the main database layer framework to write the row
      window.dispatchEvent(new CustomEvent("sbs:create-floor-confirmed", { detail: payload }));
    }
    
    setName("");
    setLocalIsOpen(false);
  };

  if (!localIsOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>🏢</span> Provision New Structural Level
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Level / Floor Alias</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Level 03 - Marketing Suite"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Elevation Index</label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Clearance Height (z-axis)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={heightMeters}
                  onChange={(e) => setHeightMeters(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-sans">m</span>
              </div>
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
              Initialize Level
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
