
interface NotificationCardProps {
  notification: {
    title: string;
    type: "Error" | "Warning" | "Info";
    text: string;
    time: string;
  };
  onDismiss?: () => void;
}

export default function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const getSeverityStyles = (type: string) => {
    switch (type) {
      case "Error": return "bg-red-950/10 border-red-900/20 text-red-200 title:text-red-400";
      case "Warning": return "bg-amber-950/10 border-amber-900/20 text-amber-200 title:text-amber-400";
      case "Info":
      default: return "bg-blue-950/10 border-blue-900/20 text-blue-200 title:text-blue-400";
    }
  };

  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-1 relative group select-none ${getSeverityStyles(notification.type)}`}>
      <div className="flex justify-between items-center text-xs font-bold pr-4">
        <span className="truncate">{notification.title}</span>
        <span className="text-[10px] opacity-50 font-mono font-normal shrink-0">{notification.time}</span>
      </div>
      <p className="text-[11px] opacity-75 leading-relaxed break-words">{notification.text}</p>
      
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 text-[10px] opacity-0 group-hover:opacity-60 hover:!opacity-100 text-slate-400 transition-all"
          title="Dismiss Notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
