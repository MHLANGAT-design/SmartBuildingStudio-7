import { CSSProperties } from "react";

export interface CanvasSelectionBoxProps {
    x: number;
    y: number;
    width: number;
    height: number;
    visible?: boolean;
    color?: string;
    fillOpacity?: number;
    borderWidth?: number;
    className?: string;
}

export default function CanvasSelectionBox({
    x,
    y,
    width,
    height,
    visible = true,
    color = "#06b6d4", // cyan-500
    fillOpacity = 0.1,
    borderWidth = 1,
    className = ""
}: CanvasSelectionBoxProps) {
    if (!visible) return null;

    const style: CSSProperties = {
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        border: `${borderWidth}px solid ${color}`,
        backgroundColor: `${color}${Math.round(fillOpacity * 255).toString(16).padStart(2, "0")}`,
        pointerEvents: "none",
        boxSizing: "border-box"
    };

    return (
        <div className={`z-40 ${className}`} style={style} />
    );
}
