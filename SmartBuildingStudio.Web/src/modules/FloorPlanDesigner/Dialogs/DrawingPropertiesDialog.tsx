import React, { useState, useEffect } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";

interface DrawingPropertiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (properties: { title: string; designer: string; projectCode: string }) => void;
}

export default function DrawingPropertiesDialog({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  onSave: propOnSave 
}: DrawingPropertiesDialogProps) {
  
  // 🚀 FIXED: Injected autonomous local state variables to decouple dialog activation from broken parent locks!
  const [localIsOpen, setLocalIsOpen] = useState(false);

  // 🚀 FIXED: Safe fallback selection query extraction resolving both namespace variations safely!
  const floorPlanState = useAppSelector((state: any) => state?.floorPlan || state?.FloorPlan || {});
  const activeDocument = floorPlanState?.document || floorPlanState?.drawingDocument || null;
  
  const [title, setTitle] = useState("New Lighting Layout");
  const [designer, setDesigner] = useState("Lead System Engineer");
  const [projectCode, setProjectCode] = useState("SBS-DALI-2026");

  // Keep state components synced up if parent parameters happen to initialize correctly
  useEffect(() => {
    setLocalIsOpen(propIsOpen);
  }, [propIsOpen]);

  useEffect(() => {
    if (activeDocument) {
      setTitle(activeDocument.id || activeDocument.Id || activeDocument.name || activeDocument.Name || "New Lighting Layout");
    }
  }, [activeDocument]);

  // 🚀 FIXED: Global Event Interceptor listening for properties toolbar button clicks!
  useEffect(() => {
    const handleTriggerPropertiesPrompt = (e: Event) => {
      setLocalIsOpen(true);
    };

    window.addEventListener("sbs:trigger-drawing-properties-dialog", handleTriggerPropertiesPrompt);
    return () => {
      window.removeEventListener("sbs:trigger-drawing-properties-dialog", handleTriggerPropertiesPrompt);
    };
  }, []);

  const handleClose = () => {
    setLocalIsOpen(false);
    if (typeof propOnClose === "function") propOnClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPayload = { title, designer, projectCode };

    if (typeof propOnSave === "function") {
      propOnSave(updatedPayload);
    } else {
      // Fallback global event dispatcher notifying the main layout framework to save parameters
      window.dispatchEvent(new CustomEvent("sbs:save-drawing-properties-confirmed", { detail: updatedPayload }));
    }
    setLocalIsOpen(false);
  };

  if (!localIsOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>📋</span> Drawing Metadata Properties
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-slate-400 block">Drawing Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-sans transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Assigned Lead Designer</label>
              <input
                type="text"
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-sans transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Global Project Code</label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-sans transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800/40">
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
              Update Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
