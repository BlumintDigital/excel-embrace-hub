import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FolderKanban, ListTodo, DollarSign, FileText, Users, Shield, Clock, FileOutput, Building2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { format, formatDistanceToNow, parseISO } from "date-fns";

const entityIcons: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: ListTodo,
  budget_category: DollarSign,
  document: FileText,
  user: Users,
  role: Shield,
  pdf_conversion: FileOutput,
  client: Building2,
};

const actionColors: Record<string, string> = {
  created: "bg-success/15 text-success border-success/30",
  updated: "bg-primary/15 text-primary border-primary/30",
  deleted: "bg-destructive/15 text-destructive border-destructive/30",
  invited: "bg-warning/15 text-warning border-warning/30",
  converted: "bg-accent/15 text-accent-foreground border-accent/30",
  changed: "bg-accent/15 text-accent-foreground border-accent/30",
};

function getActionColor(action: string) {
  const key = Object.keys(actionColors).find((k) => action.toLowerCase().includes(k));
  return actionColors[key || ""] || "bg-muted text-muted-foreground";
}

export default function ActivityLog() {
  const { data: logs = [], isLoading } = useActivityLogs(500);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Build sorted unique month options from logs
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    logs.forEach((log) => {
      const key = format(parseISO(log.created_at), "yyyy-MM");
      seen.add(key);
    });
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  // Filter logs by month + text search
  const filtered = useMemo(() => {
    let result = selectedMonth === "all"
      ? logs
      : logs.filter((log) => format(parseISO(log.created_at), "yyyy-MM") === selectedMonth);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          (log.user_name || "").toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.entity_name || "").toLowerCase().includes(q) ||
          log.entity_type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, selectedMonth, search]);

  // Group filtered logs by month label for section headers
  const grouped = useMemo(() => {
    const groups: { label: string; logs: typeof logs }[] = [];
    let currentKey = "";
    filtered.forEach((log) => {
      const key = format(parseISO(log.created_at), "yyyy-MM");
      const label = format(parseISO(log.created_at), "MMMM yyyy");
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ label, logs: [] });
      }
      groups[groups.length - 1].logs.push(log);
    });
    return groups;
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Activity Log"
        subtitle="Track all changes across the platform"
        action={(monthOptions.length > 0 || logs.length > 0) ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm w-full sm:w-44"
                placeholder="Search activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {monthOptions.length > 0 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All time</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {format(parseISO(`${m}-01`), "MMMM yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : undefined}
      />

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <p className="font-heading font-semibold text-base">No activity yet</p>
              <p className="text-sm text-muted-foreground">Actions will appear here as team members make changes.</p>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">No matching activity</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or month filter.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              {/* Month section header — only shown in "all time" view or when multiple months visible */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {group.label}
                </p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{group.logs.length}</span>
              </div>

              <div className="space-y-2">
                {group.logs.map((log, i) => {
                  const Icon = entityIcons[log.entity_type] || Clock;
                  const initials = (log.user_name || "?")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{log.user_name || "Unknown"}</span>{" "}
                              <span className="text-muted-foreground">{log.action}</span>{" "}
                              {log.entity_name && <span className="font-medium">{log.entity_name}</span>}
                            </p>
                            {log.details && (
                              <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${getActionColor(log.action)}`}
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {log.entity_type.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                              {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
