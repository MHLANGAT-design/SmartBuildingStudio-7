
interface TaskCardProps {
  task: {
    id: string;
    label: string;
    done: boolean;
  };
  onToggle?: (id: string, currentState: boolean) => void;
}

export default function TaskCard({ task, onToggle }: TaskCardProps) {
  return (
    <label className="flex items-start gap-3 p-2.5 bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/80 rounded-xl cursor-pointer select-none transition-colors group">
      <input 
        type="checkbox" 
        checked={task.done} 
        onChange={() => onToggle?.(task.id, task.done)}
        className="mt-0.5 w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer" 
      />
      <span className={`text-xs leading-normal break-words transition-colors ${
        task.done ? "text-slate-500 line-through" : "text-slate-300 font-medium group-hover:text-slate-200"
      }`}>
        {task.label}
      </span>
    </label>
  );
}
