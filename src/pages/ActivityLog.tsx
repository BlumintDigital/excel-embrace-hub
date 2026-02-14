import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, FolderKanban, ListTodo, DollarSign, FileText, Users, Shield, Clock } from "lucide-react";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { formatDistanceToNow } from "date-fns";

const entityIcons: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: ListTodo,
  budget_category: DollarSign,
  document: FileText,
  user: Users,
  role: Shield,
};

const actionColors: Record<string, string> = {
  created: "bg-success/15 text-success border-success/30",
  updated: "bg-primary/15 text-primary border-primary/30",
  deleted: "bg-destructive/15 text-destructive border-destructive/30",
  invited: "bg-warning/15 text-warning border-warning/30",
  changed: "bg-accent/15 text-accent-foreground border-accent/30",
};

function getActionColor(action: string) {
  const key = Object.keys(actionColors).find((k) => action.toLowerCase().includes(k));
  return actionColors[key || ""] || "bg-muted text-muted-foreground";
}

export default function ActivityLog() {
  const { data: logs = [], isLoading } = useActivityLogs(100);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Track all changes across the platform</p>
      </div>

      {logs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No activity recorded yet. Actions will appear here as team members make changes.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => {
            const Icon = entityIcons[log.entity_type] || Clock;
            const initials = (log.user_name || "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.user_name || "Unknown"}</span>{" "}
                        <span className="text-muted-foreground">{log.action}</span>{" "}
                        {log.entity_name && <span className="font-medium">{log.entity_name}</span>}
                      </p>
                      {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${getActionColor(log.action)}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {log.entity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
