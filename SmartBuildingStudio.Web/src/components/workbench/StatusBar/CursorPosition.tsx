export interface CursorPositionProps {
    x: number;
    y: number;
    unit?: string;
}

export default function CursorPosition({ x, y, unit = "mm" }: CursorPositionProps) {
    return (
        <div className="font-mono text-slate-600">
            X: {Math.round(x)} {unit} | Y: {Math.round(y)} {unit}
        </div>
    );
}
