import { ReactNode } from "react";

interface ToolbarGroupProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export default function ToolbarGroup({ title, children, className = "" }: ToolbarGroupProps) {
    return (
        <section className={`flex flex-col justify-between px-3 py-2 min-w-fit ${className}`}>
            {/* Command Buttons */}
            <div className="flex items-start gap-2">
                {children}
            </div>

            {/* Group Title */}
            <div className="mt-2 text-[11px] uppercase tracking-wider text-slate-500 font-medium text-center border-t border-slate-200 pt-1">
                {title}
            </div>
        </section>
    );
}
