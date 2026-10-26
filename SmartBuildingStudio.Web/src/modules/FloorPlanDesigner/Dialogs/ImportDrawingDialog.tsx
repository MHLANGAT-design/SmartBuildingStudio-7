import React, { useState, useRef } from "react";

interface ImportDrawingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, scaleFactor: number) => void;
}

export default function ImportDrawingDialog({ isOpen, onClose, onImport }: ImportDrawingDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scaleFactor, setScaleFactor] = useState<string>("1.0");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onImport(selectedFile, parseFloat(scaleFactor) || 1.0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>📥</span> Import Vector Blueprint
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Select Template Blueprint File (DXF / PNG / SVG)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".dxf,.png,.jpg,.jpeg,.svg"
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 p-6 rounded-lg text-center cursor-pointer transition-all space-y-1"
            >
              <span className="text-2xl block">📂</span>
              <span className="text-xs font-medium text-slate-300 block">
                {selectedFile ? selectedFile.name : "Browse system files or drag structural map..."}
              </span>
              {selectedFile && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">Fallback Target File Scale multiplier</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
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
              disabled={!selectedFile}
              className={`px-4 py-2 rounded-lg text-xs font-medium shadow-md transition-colors ${
                selectedFile
                  ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800/50"
              }`}
            >
              Parse & Ingest Map
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
