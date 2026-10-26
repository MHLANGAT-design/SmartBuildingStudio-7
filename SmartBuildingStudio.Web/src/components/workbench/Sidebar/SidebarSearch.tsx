import { Search, X } from "lucide-react";

export interface SidebarSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function SidebarSearch({
    value,
    onChange,
    placeholder = "Search...",
    autoFocus = false,
    disabled = false,
    className = ""
}: SidebarSearchProps) {
    const clearSearch = () => onChange("");

    return (
        <div className={`border-b border-slate-200 bg-white px-3 py-3 ${className}`}>
            <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    autoFocus={autoFocus}
                    disabled={disabled}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-9 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:bg-slate-100 disabled:text-slate-400"
                />
                {value.length > 0 && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Clear Search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
