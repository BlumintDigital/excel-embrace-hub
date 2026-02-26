import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResetPlatformDialog({ open, onOpenChange }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const canConfirm = confirmText === "RESET";

  const handleReset = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("reset-platform", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        // Try to extract the real error message from the function response body
        let msg = error.message || "Failed to reset platform data";
        try {
          // FunctionsHttpError has a context with the raw Response
          const body = await (error as any).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      qc.clear();
      onOpenChange(false);
      toast.success("Platform data has been reset successfully.");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset platform data.");
    } finally {
      setLoading(false);
      setConfirmText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); setConfirmText(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Reset All Platform Data
          </DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>all projects, tasks, budget categories, documents, and clients</strong>.
            User accounts and roles will be preserved. This action <strong>cannot be undone</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="confirm-reset" className="text-sm">
            Type <span className="font-mono font-semibold">RESET</span> to confirm
          </Label>
          <Input
            id="confirm-reset"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            autoComplete="off"
            disabled={loading}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); setConfirmText(""); }} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReset} disabled={!canConfirm || loading}>
            {loading ? "Resetting…" : "Reset All Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
