import { ReactNode } from "react";

export interface SidebarHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export default function SidebarHeader({
    title,
    subtitle,
    icon,
    actions,
    className = ""
}: SidebarHeaderProps) {
    return (
        <header className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50 ${className}`}>
            <div className="flex items-center gap-3 min-w-0">
                {icon && (
                    <div className="flex items-center justify-center text-slate-600">
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-800 truncate">
                        {title}
                    </h2>
                    {subtitle && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </header>
    );
}
