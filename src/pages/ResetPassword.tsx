import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase will auto-exchange the token in the URL hash for a session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
      }
    });
    // Also check if already in recovery
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <p className="text-sm font-medium">Password updated!</p>
              <p className="text-xs text-muted-foreground">Redirecting you to the dashboard...</p>
            </div>
          ) : !hasSession ? (
            <div className="text-center space-y-3 py-6">
              <p className="text-sm text-muted-foreground">Waiting for authentication...</p>
              <p className="text-xs text-muted-foreground">If you arrived here from an email link, please wait a moment.</p>
              <Link to="/forgot-password" className="text-primary hover:underline text-sm font-medium block mt-4">Request a new link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" placeholder="••••••••" className="h-11" value={confirm} onChange={(e) => setConfirm(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
