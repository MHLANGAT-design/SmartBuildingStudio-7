import { ReactNode } from "react";

export interface SidebarFooterProps {
    children?: ReactNode;
    status?: string;
    statusColor?: "default" | "success" | "warning" | "error";
    className?: string;
}

function getStatusColor(color: SidebarFooterProps["statusColor"]): string {
    switch (color) {
        case "success":
            return "bg-green-500";
        case "warning":
            return "bg-amber-500";
        case "error":
            return "bg-red-500";
        default:
            return "bg-slate-400";
    }
}

export default function SidebarFooter({
    children,
    status,
    statusColor = "default",
    className = ""
}: SidebarFooterProps) {
    return (
        <footer className={`border-t border-slate-200 bg-slate-50 px-4 py-3 mt-auto ${className}`}>
            {(status || children) && (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {status && (
                            <>
                                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(statusColor)}`} />
                                <span className="text-xs font-medium text-slate-600">
                                    {status}
                                </span>
                            </>
                        )}
                    </div>

                    {children && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            {children}
                        </div>
                    )}
                </div>
            )}
        </footer>
    );
}
