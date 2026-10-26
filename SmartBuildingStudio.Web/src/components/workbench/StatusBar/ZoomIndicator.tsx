export interface ZoomIndicatorProps {
    zoom: number;
}

export default function ZoomIndicator({ zoom }: ZoomIndicatorProps) {
    return (
        <div className="font-mono text-slate-600">
            {Math.round(zoom * 100)}%
        </div>
    );
}
