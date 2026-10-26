interface SidebarDividerProps {
    className?: string;
}

export default function SidebarDivider({ className = "" }: SidebarDividerProps) {
    return (
        <div className={`h-px bg-slate-200 mx-3 ${className}`} aria-hidden="true" />
    );
}
