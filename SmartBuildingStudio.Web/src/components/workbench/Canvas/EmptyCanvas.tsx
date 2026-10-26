import { ReactNode } from "react";
import { FileImage, Upload, MousePointer2 } from "lucide-react";

export interface EmptyCanvasProps {
    title?: string;
    description?: string;
    actionText?: string;
    icon?: ReactNode;
    onAction?: () => void;
}

export default function EmptyCanvas({
    title = "No Drawing Loaded",
    description = "Import a DWG, DXF or PDF drawing to begin designing your smart building.",
    actionText = "Import Drawing",
    icon,
    onAction
}: EmptyCanvasProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-10 max-w-lg text-center">
                <div className="flex justify-center mb-6 text-cyan-600">
                    {icon ?? <FileImage size={60} />}
                </div>

                <h2 className="text-2xl font-bold text-slate-800">
                    {title}
                </h2>

                <p className="mt-4 text-slate-500 leading-relaxed">
                    {description}
                </p>

                {onAction && (
                    <button
                        type="button"
                        onClick={onAction}
                        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-white font-medium hover:bg-cyan-700 transition-colors"
                    >
                        <Upload size={18} />
                        {actionText}
                    </button>
                )}

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
                    <MousePointer2 size={16} />
                    Drag & Drop drawings anywhere onto the canvas
                </div>
            </div>
        </div>
    );
}
