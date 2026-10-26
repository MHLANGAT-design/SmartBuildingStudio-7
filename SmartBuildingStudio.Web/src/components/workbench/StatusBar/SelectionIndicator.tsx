export interface SelectionIndicatorProps {
    count: number;
}

export default function SelectionIndicator({ count }: SelectionIndicatorProps) {
    return (
        <div className="text-slate-600">
            {count} selected
        </div>
    );
}
