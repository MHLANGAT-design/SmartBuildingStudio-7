interface ToolbarDividerProps {
    className?: string;
}

export default function ToolbarDivider({ className = "" }: ToolbarDividerProps) {
    return (
        <div className={`flex items-center justify-center px-2 ${className}`} aria-hidden="true">
            <div className="w-px h-16 bg-slate-300" />
        </div>
    );
}
