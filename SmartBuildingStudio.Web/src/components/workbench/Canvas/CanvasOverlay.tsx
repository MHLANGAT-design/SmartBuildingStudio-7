import { ReactNode, CSSProperties, WheelEvent } from "react";

export interface CanvasViewportProps {
    children: ReactNode;
    zoom?: number;
    offsetX?: number;
    offsetY?: number;
    background?: string;
    className?: string;
    onWheel?: (event: WheelEvent<HTMLDivElement>) => void;
}

export default function CanvasViewport({
    children,
    zoom = 1,
    offsetX = 0,
    offsetY = 0,
    background = "#ffffff",
    className = "",
    onWheel
}: CanvasViewportProps) {
    const transform: CSSProperties = {
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
        transformOrigin: "top left"
    };

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`} onWheel={onWheel}>
            {/* Engineering Workspace */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ background }}>
                {/* Viewport */}
                <div style={transform} className="relative select-none">
                    {children}
                </div>
            </div>
        </div>
    );
}
