import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface CanvasZoomControlsProps {
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    className?: string;
}

export default function CanvasZoomControls({
    zoom,
    minZoom = 0.2,
    maxZoom = 5,
    onZoomIn,
    onZoomOut,
    onReset,
    className = ""
}: CanvasZoomControlsProps) {
    const canZoomIn = zoom < maxZoom;
    const canZoomOut = zoom > minZoom;

    return (
        <div className={`absolute bottom-4 right-4 z-30 flex flex-col gap-2 bg-white border border-slate-300 shadow-md rounded-md p-2 ${className}`}>
            <button
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className="p-2 hover:bg-slate-100 rounded disabled:opacity-40"
                title="Zoom In"
            >
                <ZoomIn size={18} />
            </button>

            <button
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className="p-2 hover:bg-slate-100 rounded disabled:opacity-40"
                title="Zoom Out"
            >
                <ZoomOut size={18} />
            </button>

            <button
                onClick={onReset}
                className="p-2 hover:bg-slate-100 rounded"
                title="Reset View"
            >
                <RotateCcw size={18} />
            </button>

            <div className="text-[10px] text-center text-slate-500 font-medium">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    );
}
