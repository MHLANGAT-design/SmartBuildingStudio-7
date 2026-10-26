import { ReactNode } from "react";

export interface CanvasContainerProps {
    children: ReactNode;
    className?: string;
}

export default function CanvasContainer({ children, className = "" }: CanvasContainerProps) {
    return (
        <main className={`relative flex-1 overflow-hidden bg-slate-200 ${className}`}>
            {children}
        </main>
    );
}
