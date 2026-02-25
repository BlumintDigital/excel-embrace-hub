import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { cn } from "@/lib/utils";

const LAST_SEEN_KEY = "blumint_notif_last_seen";

function getLastSeen(): Date {
  const stored = localStorage.getItem(LAST_SEEN_KEY);
  return stored ? new Date(stored) : new Date(0);
}

function markSeen() {
  localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

const entityRoutes: Record<string, string> = {
  task: "/tasks",
  project: "/projects",
  budget_category: "/budget",
  document: "/documents",
  client: "/clients",
  user: "/team",
};

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeenState] = useState<Date>(getLastSeen);
  const navigate = useNavigate();
  const { data: logs = [] } = useActivityLogs(30);
  const { prefs } = useNotificationPrefs();

  const filteredLogs = logs
    .filter((log) => {
      if (log.entity_type === "task" && !prefs.taskAssigned) return false;
      if (log.entity_type === "project" && !prefs.projectUpdates) return false;
      if (log.entity_type === "budget_category" && !prefs.budgetAlerts) return false;
      return true;
    })
    .slice(0, 15);

  const unreadCount = filteredLogs.filter(
    (log) => new Date(log.created_at) > lastSeen
  ).length;

  const handleOpen = (val: boolean) => {
    setOpen(val);
    if (val) {
      markSeen();
      setLastSeenState(new Date());
    }
  };

  const handleClick = (log: (typeof logs)[0]) => {
    setOpen(false);
    const base = entityRoutes[log.entity_type];
    if (base && log.entity_id) {
      navigate(`${base}/${log.entity_id}`);
    } else if (base) {
      navigate(base);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-8 w-8", className)}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount === 0 && (
            <span className="text-xs text-muted-foreground">All caught up</span>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ScrollArea className="max-h-[320px]">
            {filteredLogs.map((log) => {
              const isNew = new Date(log.created_at) > lastSeen;
              return (
                <button
                  key={log.id}
                  onClick={() => handleClick(log)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0",
                    isNew && "bg-primary/5"
                  )}
                >
                  <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", isNew ? "bg-primary" : "bg-transparent")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{log.entity_name || log.entity_type}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.action}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        )}

        <div className="px-4 py-2 border-t">
          <button
            onClick={() => { setOpen(false); navigate("/activity"); }}
            className="text-xs text-primary hover:underline w-full text-center"
          >
            View all activity →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
