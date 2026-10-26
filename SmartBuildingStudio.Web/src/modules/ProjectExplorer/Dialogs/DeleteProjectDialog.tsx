import React, { useState } from "react";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

export default function DeleteProjectDialog({ isOpen, onClose, onConfirm, projectName }: DeleteProjectDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");

  if (!isOpen) return null;

  const isVerified = confirmInput.toLowerCase() === "destroy workspace";

  const handleDelete = () => {
    if (isVerified) {
      onConfirm();
      setConfirmInput("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-red-950 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-red-950/20 border-b border-red-950/40 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-red-400 uppercase flex items-center gap-2">
            <span>⚠️</span> Critical Destruction Warning
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
            <p>You are about to permanently purge the complete engineering structure for <span className="font-bold text-white">"{projectName}"</span>.</p>
            <p className="bg-red-950/10 border border-red-900/20 p-2.5 rounded-lg text-red-400">
              This action completely wipes all sub-buildings, floor planes, layout drafts, and DALI loop schematics associated with this root ID.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">
              Type <span className="font-mono text-red-400">destroy workspace</span> to execute hard purge:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="destroy workspace"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Retain Project
            </button>
            <button
              type="button"
              disabled={!isVerified}
              onClick={handleDelete}
              className={`px-4 py-2 rounded-lg text-xs font-medium shadow-md transition-all ${
                isVerified
                  ? "bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800/30"
              }`}
            >
              Purge Bounded Context
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
