export interface CanvasCoordinatesProps {
    x: number;
    y: number;
    unit?: string;
    className?: string;
}

export default function CanvasCoordinates({
    x,
    y,
    unit = "mm",
    className = ""
}: CanvasCoordinatesProps) {
    return (
        <div className={`absolute bottom-4 left-4 z-30 px-3 py-1 bg-white border border-slate-300 shadow-sm rounded-md text-xs font-mono text-slate-600 ${className}`}>
            X: {x.toFixed(0)} {unit} | Y: {y.toFixed(0)} {unit}
        </div>
    );
}
