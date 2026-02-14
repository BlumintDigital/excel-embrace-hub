import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInviteUser } from "@/hooks/use-supabase-mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteUserDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("team_member");
  const invite = useInviteUser();

  const handleSubmit = async () => {
    if (!email.trim() || !fullName.trim()) return;
    await invite.mutateAsync({ email: email.trim(), full_name: fullName.trim(), role });
    setEmail("");
    setFullName("");
    setRole("team_member");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="team_member">Team Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!email.trim() || !fullName.trim() || invite.isPending}>
            {invite.isPending ? "Inviting..." : "Invite User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
