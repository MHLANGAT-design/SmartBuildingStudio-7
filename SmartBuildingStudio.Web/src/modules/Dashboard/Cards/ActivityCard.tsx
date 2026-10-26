import { SystemJobActivity } from "@/modules/Dashboard/Store/DashboardTypes";

interface ActivityCardProps {
  activity: SystemJobActivity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const getStatusIndicator = (status: SystemJobActivity["status"]) => {
    switch (status) {
      case "Success": return { icon: "✓", color: "text-emerald-500 bg-emerald-950/20 border-emerald-900/30" };
      case "Warning": return { icon: "⚠", color: "text-amber-500 bg-amber-950/20 border-amber-900/30" };
      case "Failed": return { icon: "✕", color: "text-red-500 bg-red-950/20 border-red-900/30" };
    }
  };

  const indicator = getStatusIndicator(activity.status);

  return (
    <div className="p-3 bg-slate-900/20 border border-slate-800/40 rounded-xl flex items-start gap-3 select-none text-xs">
      <div className={`w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 ${indicator.color}`}>
        {indicator.icon}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-slate-300 font-medium leading-normal break-words">
          {activity.description}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
          <span className="truncate max-w-[120px]">Op: {activity.operator}</span>
          <span className="shrink-0">{new Date(activity.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
