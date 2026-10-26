import { RecentDocument } from "@/modules/Dashboard/Store/DashboardTypes";

interface DocumentCardProps {
  document: RecentDocument;
  onClick?: (id: string) => void;
}

export default function DocumentCard({ document, onClick }: DocumentCardProps) {
  const getModuleBadgeColor = (owner: RecentDocument["moduleOwner"]) => {
    switch (owner) {
      case "FloorPlanDesigner": return "bg-purple-950/40 text-purple-400 border-purple-900/40";
      case "FixturePlacementStudio": return "bg-amber-950/40 text-amber-400 border-amber-900/40";
      case "DaliDesigner": return "bg-emerald-950/40 text-emerald-400 border-emerald-900/40";
      case "EmergencyLighting": return "bg-red-950/40 text-red-400 border-red-900/40";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div 
      onClick={() => onClick?.(document.id)}
      className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/60 hover:border-slate-700/60 rounded-xl flex items-center justify-between gap-4 select-none group transition-all cursor-pointer"
    >
      <div className="min-w-0 space-y-0.5">
        <h4 className="text-xs font-semibold text-slate-300 group-hover:text-blue-400 transition-colors truncate">
          {document.title}
        </h4>
        <p className="text-[10px] text-slate-500 truncate">
          Zone: <span className="text-slate-400 font-medium">{document.floorName}</span>
        </p>
      </div>

      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono shrink-0 ${getModuleBadgeColor(document.moduleOwner)}`}>
        {document.moduleOwner.replace(/([A-Z])/g, ' $1').trim()}
      </span>
    </div>
  );
}
