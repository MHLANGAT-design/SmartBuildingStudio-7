import { CSSProperties } from "react";

export interface CanvasBackgroundProps {
    gridSize?: number;
    showGrid?: boolean;
    backgroundColor?: string;
    gridColor?: string;
    className?: string;
}

export default function CanvasBackground({
    gridSize = 20,
    showGrid = true,
    backgroundColor = "#f8fafc",
    gridColor = "rgba(0,0,0,0.08)",
    className = ""
}: CanvasBackgroundProps) {
    const style: CSSProperties = {
        backgroundColor,
        backgroundImage: showGrid
            ? `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`
            : undefined,
        backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : undefined
    };

    return (
        <div
            className={`absolute inset-0 pointer-events-none ${className}`}
            style={style}
        />
    );
}
