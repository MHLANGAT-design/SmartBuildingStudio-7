import { ReactNode } from "react";

export interface StatusItemProps {
    label?: string;
    value?: ReactNode;
    icon?: ReactNode;
    color?: "default" | "success" | "warning" | "error";
    className?: string;
}

export default function StatusItem({
    label,
    value,
    icon,
    color = "default",
    className = ""
}: StatusItemProps) {
    const colorMap = {
        default: "text-slate-600",
        success: "text-green-600",
        warning: "text-amber-600",
        error: "text-red-600"
    };

    return (
        <div className={`flex items-center gap-1 ${colorMap[color]} ${className}`}>
            {icon && <span>{icon}</span>}
            {label && <span className="font-medium">{label}:</span>}
            {value && <span className="font-mono">{value}</span>}
        </div>
    );
}
