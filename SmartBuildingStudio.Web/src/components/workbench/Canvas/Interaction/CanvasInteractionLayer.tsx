import { ReactNode, MouseEvent, WheelEvent } from "react";
import { CanvasPoint, CanvasInteractionCallbacks } from "./types";

export interface CanvasInteractionLayerProps extends CanvasInteractionCallbacks {
    children?: ReactNode;
    className?: string;
    onWheel?(event: WheelEvent<HTMLDivElement>): void;
}

export default function CanvasInteractionLayer({
    children,
    className = "",
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    onContextMenu,
    onWheel
}: CanvasInteractionLayerProps) {
    const getPoint = (e: MouseEvent<HTMLDivElement>): CanvasPoint => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    return (
        <div
            className={`absolute inset-0 z-30 ${className}`}
            onMouseDown={(e) => onMouseDown?.(getPoint(e))}
            onMouseMove={(e) => onMouseMove?.(getPoint(e))}
            onMouseUp={(e) => onMouseUp?.(getPoint(e))}
            onDoubleClick={(e) => onDoubleClick?.(getPoint(e))}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu?.(getPoint(e));
            }}
            onWheel={onWheel}
        >
            {children}
        </div>
    );
}
