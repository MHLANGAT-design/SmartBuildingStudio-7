import { ReactNode } from "react";

export interface SidebarProps {
    children: ReactNode;
    width?: number;
    className?: string;
}

export default function Sidebar({ children, width = 320, className = "" }: SidebarProps) {
    return (
        <aside
            className={`flex flex-col bg-white border-r border-slate-300 shadow-sm overflow-hidden ${className}`}
            style={{ width, minWidth: width, maxWidth: width }}
        >
            {children}
        </aside>
    );
}
