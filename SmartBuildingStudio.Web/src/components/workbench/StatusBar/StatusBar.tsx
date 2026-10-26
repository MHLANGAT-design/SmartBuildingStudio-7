import { ReactNode } from "react";

export interface StatusBarProps {
    left?: ReactNode;
    center?: ReactNode;
    right?: ReactNode;
    className?: string;
}

export default function StatusBar({
    left,
    center,
    right,
    className = ""
}: StatusBarProps) {
    return (
        <footer
            className={`h-8 w-full flex items-center justify-between px-3 border-t border-slate-300 bg-slate-50 text-xs text-slate-600 select-none ${className}`}
        >
            <div className="flex items-center gap-3">
                {left}
            </div>

            <div className="flex items-center gap-3">
                {center}
            </div>

            <div className="flex items-center gap-3">
                {right}
            </div>
        </footer>
    );
}
