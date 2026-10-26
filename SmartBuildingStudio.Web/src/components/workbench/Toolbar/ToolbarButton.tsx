import { ReactNode } from "react";

export type ToolbarButtonVariant =
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger";

export interface ToolbarButtonProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
    variant?: ToolbarButtonVariant;
    title?: string;
    className?: string;
}

function getVariantClasses(
    variant: ToolbarButtonVariant,
    active: boolean,
    disabled: boolean
): string {
    if (disabled) {
        return "text-slate-300 border-transparent cursor-not-allowed opacity-60";
    }

    switch (variant) {
        case "primary":
            return active
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700";
        case "success":
            return active
                ? "bg-green-600 text-white border-green-600"
                : "hover:bg-green-50 hover:border-green-300 hover:text-green-700";
        case "warning":
            return active
                ? "bg-amber-500 text-white border-amber-500"
                : "hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700";
        case "danger":
            return active
                ? "bg-red-600 text-white border-red-600"
                : "hover:bg-red-50 hover:border-red-300 hover:text-red-700";
        default:
            return active
                ? "bg-cyan-600 text-white border-cyan-600"
                : "hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700";
    }
}

export default function ToolbarButton({
    icon,
    label,
    onClick,
    disabled = false,
    active = false,
    variant = "default",
    title,
    className = ""
}: ToolbarButtonProps) {
    const variantClasses = getVariantClasses(variant, active, disabled);

    return (
        <button
            type="button"
            title={title ?? label}
            disabled={disabled}
            onClick={onClick}
            className={`w-20 h-20 flex flex-col items-center justify-center rounded-md border transition-all duration-150 gap-2 select-none ${variantClasses} ${className}`}
        >
            <div className="text-xl flex items-center justify-center">
                {icon}
            </div>
            <span className="text-[11px] leading-tight text-center px-1 font-medium">
                {label}
            </span>
        </button>
    );
}
