import { RecentProject } from "@/modules/Dashboard/Store/DashboardTypes";

interface ProjectCardProps {
  project: RecentProject;
  onSelect?: (id: string) => void;
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <div 
      onClick={() => onSelect?.(project.id)}
      className="p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex flex-col justify-between select-none group transition-all cursor-pointer active:scale-[0.99] shadow-md"
    >
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-3">
          <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
            {project.name}
          </h4>
          <span className="text-[10px] font-mono font-bold bg-blue-950/40 text-blue-400 border border-blue-900/40 px-1.5 py-0.5 rounded shrink-0">
            {project.totalDaliDevices} Nodes
          </span>
        </div>
        <p className="text-[11px] text-slate-500 truncate">{project.clientName}</p>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div>• Levels: <span className="text-slate-300 font-bold">{project.floorCount}</span></div>
        <div>Mod: <span className="text-slate-400">{new Date(project.modifiedAt).toLocaleDateString()}</span></div>
      </div>
    </div>
  );
}
