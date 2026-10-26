import { ReactNode } from "react";

interface ToolbarProps {
    children: ReactNode;
    className?: string;
}

export default function Toolbar({ children, className = "" }: ToolbarProps) {
    return (
        <header
            className={`h-24 bg-white border-b border-slate-300 shadow-sm flex items-stretch overflow-x-auto overflow-y-hidden whitespace-nowrap ${className}`}
        >
            {children}
        </header>
    );
}
