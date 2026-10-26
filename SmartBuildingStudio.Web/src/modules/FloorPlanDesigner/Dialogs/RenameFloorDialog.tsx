import React, { useState, useEffect } from "react";

interface RenameFloorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
}

export default function RenameFloorDialog({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  onRename: propOnRename, 
  currentName: propCurrentName 
}: RenameFloorDialogProps) {
  
  // 🚀 FIXED: Injected autonomous local state tracking variables to override parent property drilling locks!
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [localCurrentName, setLocalCurrentName] = useState("");
  const [name, setName] = useState("");

  // Keep state components synced up if parent parameters happen to initialize correctly
  useEffect(() => {
    setLocalIsOpen(propIsOpen);
  }, [propIsOpen]);

  useEffect(() => {
    if (propCurrentName) {
      setLocalCurrentName(propCurrentName);
      setName(propCurrentName);
    }
  }, [propCurrentName]);

  // 🚀 FIXED: Global Event Interceptor listening for floor list rename action clicks!
  useEffect(() => {
    const handleTriggerRenameFloorPrompt = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail) return;
      
      const floorTitle = customEvent.detail.currentName || customEvent.detail.name || "Target Floor Level";
      
      setLocalCurrentName(floorTitle);
      setName(floorTitle);
      setLocalIsOpen(true);
    };

    window.addEventListener("sbs:trigger-floor-rename-dialog", handleTriggerRenameFloorPrompt);
    return () => {
      window.removeEventListener("sbs:trigger-floor-rename-dialog", handleTriggerRenameFloorPrompt);
    };
  }, []);

  const handleClose = () => {
    setLocalIsOpen(false);
    if (typeof propOnClose === "function") propOnClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== localCurrentName) {
      const trimmedName = name.trim();
      
      if (typeof propOnRename === "function") {
        propOnRename(trimmedName);
      } else {
        // Fallback global event dispatcher notifying the main database layer framework to update the row
        window.dispatchEvent(new CustomEvent("sbs:rename-floor-confirmed", { detail: { name: trimmedName } }));
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
            <span>✏️</span> Modify Level Structural Alias
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Updated Structural Level Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-sans"
              required
              autoFocus
            />
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
              disabled={!name.trim() || name.trim() === localCurrentName}
              className={`px-4 py-2 rounded-lg text-xs font-medium shadow-md transition-colors ${
                name.trim() && name.trim() !== localCurrentName
                  ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/30"
              }`}
            >
              Save New Title
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
