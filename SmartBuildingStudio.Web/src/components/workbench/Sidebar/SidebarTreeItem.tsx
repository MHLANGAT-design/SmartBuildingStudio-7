import { ReactNode, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export interface SidebarTreeItemProps {
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: ReactNode;
    children?: ReactNode;
    selected?: boolean;
    defaultExpanded?: boolean;
    expandable?: boolean;
    disabled?: boolean;
    level?: number;
    onClick?: (id: string) => void;
}

export default function SidebarTreeItem({
    id,
    label,
    icon,
    badge,
    children,
    selected = false,
    defaultExpanded = false,
    expandable = false,
    disabled = false,
    level = 0,
    onClick
}: SidebarTreeItemProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!expandable) return;
        setExpanded(!expanded);
    };

    const handleClick = () => {
        if (disabled) return;
        onClick?.(id);
    };

    return (
        <div>
            {/* Tree Node */}
            <div
                onClick={handleClick}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors select-none ${
                    selected ? "bg-cyan-100 text-cyan-700 font-semibold" : "hover:bg-slate-100"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ paddingLeft: `${16 + level * 20}px` }}
            >
                {/* Left Content */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Expand Arrow Button */}
                    <button
                        type="button"
                        onClick={handleExpand}
                        className="w-4 h-4 flex items-center justify-center text-slate-500 shrink-0"
                    >
                        {expandable ? (
                            expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />
                        ) : (
                            <div className="w-4" />
                        )}
                    </button>

                    {/* Icon */}
                    {icon && <div className="text-slate-500 shrink-0">{icon}</div>}

                    {/* Label */}
                    <span className="truncate text-sm">{label}</span>
                </div>

                {/* Badge */}
                {badge && <div className="shrink-0 ml-2">{badge}</div>}
            </div>

            {/* Children Nested Container */}
            {expandable && expanded && (
                <div>
                    {children}
                </div>
            )}
        </div>
    );
}
