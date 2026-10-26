import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface SidebarSectionProps {
    title: string;
    children: ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    actions?: ReactNode;
    className?: string;
}

export default function SidebarSection({
    title,
    children,
    collapsible = true,
    defaultExpanded = true,
    actions,
    className = ""
}: SidebarSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggle = () => {
        if (collapsible) {
            setExpanded(prev => !prev);
        }
    };

    return (
        <section className={`border-b border-slate-200 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                <button
                    type="button"
                    onClick={toggle}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-cyan-700 transition"
                >
                    {collapsible ? (
                        expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : (
                        <div className="w-4" />
                    )}
                    {title}
                </button>

                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            {expanded && (
                <div className="bg-white">
                    {children}
                </div>
            )}
        </section>
    );
}
