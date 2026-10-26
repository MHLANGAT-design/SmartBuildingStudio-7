import React, { useState, useEffect } from "react";

interface DeleteFloorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  floorName: string;
}

export default function DeleteFloorDialog({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  onConfirm: propOnConfirm, 
  floorName: propFloorName 
}: DeleteFloorDialogProps) {
  
  // 🚀 FIXED: Injected autonomous local state tracking variables to override parent property drilling locks!
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [localFloorName, setLocalFloorName] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  // Keep state components synced up if parent parameters happen to initialize correctly
  useEffect(() => {
    setLocalIsOpen(propIsOpen);
  }, [propIsOpen]);

  useEffect(() => {
    if (propFloorName) setLocalFloorName(propFloorName);
  }, [propFloorName]);

  // 🚀 FIXED: Global Service Broker Listener catching cross-panel layout floor removal event pings!
  useEffect(() => {
    const handleTriggerDeletePrompt = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail) return;
      
      const targetName = customEvent.detail.floorName || customEvent.detail.name || "Target Floor Level";
      
      setLocalFloorName(targetName);
      setLocalIsOpen(true);
    };

    window.addEventListener("sbs:trigger-floor-delete-prompt", handleTriggerDeletePrompt);
    return () => {
      window.removeEventListener("sbs:trigger-floor-delete-prompt", handleTriggerDeletePrompt);
    };
  }, []);

  const handleClose = () => {
    setConfirmationText("");
    setLocalIsOpen(false);
    if (typeof propOnClose === "function") propOnClose();
  };

  const isConfirmed = confirmationText.toLowerCase() === "delete";

  const handleDelete = () => {
    if (isConfirmed) {
      if (typeof propOnConfirm === "function") {
        propOnConfirm();
      } else {
        // Fallback transaction dispatcher firing deletion macros directly straight to background data slices
        window.dispatchEvent(new CustomEvent("sbs:execute-floor-purge-confirmed", { detail: { name: localFloorName } }));
      }
      setConfirmationText("");
      setLocalIsOpen(false);
    }
  };

  if (!localIsOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-red-950 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-red-950/20 border-b border-red-950/40 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-red-400 uppercase flex items-center gap-2">
            <span>⚠️</span> Destructive Action Warning
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-slate-300 space-y-2">
            <p>Are you sure you want to remove <span className="font-semibold text-white">"{localFloorName}"</span>?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action purges all room configurations, structural walls, and every single routed DALI circuit loop bound to this level plane. This cannot be undone.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">
              Type <span className="font-mono text-red-400">delete</span> to confirm structural removal:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="delete"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Keep Level
            </button>
            <button
              type="button"
              disabled={!isConfirmed}
              onClick={handleDelete}
              className={`px-4 py-2 rounded-lg text-xs font-medium shadow-md transition-colors ${
                isConfirmed
                  ? "bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800/50"
              }`}
            >
              Permanently Purge Floor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
