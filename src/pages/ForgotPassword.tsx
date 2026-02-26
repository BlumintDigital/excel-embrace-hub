import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs text-muted-foreground">We've sent a password reset link to <strong>{email}</strong></p>
              <Link to="/login" className="text-primary hover:underline text-sm font-medium block mt-4">Back to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="alex@pipeworks.com" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
