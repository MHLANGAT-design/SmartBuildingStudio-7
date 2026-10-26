import { Loader2 } from "lucide-react";

export interface CanvasLoaderProps {
    visible?: boolean;
    title?: string;
    message?: string;
    progress?: number;
}

export default function CanvasLoader({
    visible = true,
    title = "Loading Drawing",
    message = "Preparing workspace...",
    progress
}: CanvasLoaderProps) {
    if (!visible) {
        return null;
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm">
            <div className="w-[420px] rounded-xl bg-white border border-slate-300 shadow-xl p-8">
                {/* Spinner */}
                <div className="flex justify-center mb-6">
                    <Loader2 size={48} className="animate-spin text-cyan-600" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-center text-slate-800">
                    {title}
                </h2>

                {/* Message */}
                <p className="mt-3 text-center text-slate-500">
                    {message}
                </p>

                {/* Progress */}
                {progress !== undefined && (
                    <>
                        <div className="mt-8 h-3 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className="h-full bg-cyan-600 transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                        </div>
                        <div className="mt-3 text-center text-sm font-medium text-slate-600">
                            {Math.round(progress)}%
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
