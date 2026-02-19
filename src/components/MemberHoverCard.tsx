import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/status-config";

interface MemberHoverCardProps {
  member: {
    id: string;
    full_name: string | null;
    email: string | null;
    app_role?: string | null;
  };
  activeTasks?: number;
  children: React.ReactNode;
}

export function MemberHoverCard({ member, activeTasks = 0, children }: MemberHoverCardProps) {
  const initials = (member.full_name || "?")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const role = member.app_role || "team_member";

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-60 p-4" align="start" side="top">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm font-semibold leading-none truncate">
              {member.full_name || "Unknown"}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] h-4 px-1.5 ${ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.team_member}`}
            >
              {ROLE_LABELS[role] || role}
            </Badge>
            {member.email && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{member.email}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {activeTasks} active task{activeTasks !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
