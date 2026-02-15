import { useState } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace, CURRENCIES } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Building2,
  Bell,
  Palette,
  Shield,
  Save,
  Upload,
} from "lucide-react";
import logoColor from "@/assets/logo-color.png";

export default function SettingsPage() {
  const { user, profile, role } = useAuth();
  const { settings, updateSettings } = useWorkspace();

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  // Local workspace form state (synced from context)
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyTagline, setCompanyTagline] = useState(settings.companyTagline);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [sidebarStyle, setSidebarStyle] = useState(settings.sidebarStyle);
  const [currency, setCurrency] = useState(settings.currency);

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [taskAssigned, setTaskAssigned] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = () => {
    updateSettings({ companyName, companyTagline, currency });
    toast.success("Workspace settings saved");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, workspace, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:block" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:block" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:block" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" /> Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact admin to change email
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div>
                  <Badge variant="outline" className="capitalize">
                    <Shield className="h-3 w-3 mr-1" />
                    {role || "Member"}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const newPw = (document.getElementById("newPassword") as HTMLInputElement)?.value;
                    const confirmPw = (document.getElementById("confirmPassword") as HTMLInputElement)?.value;
                    if (!newPw || newPw.length < 6) {
                      toast.error("Password must be at least 6 characters");
                      return;
                    }
                    if (newPw !== confirmPw) {
                      toast.error("Passwords do not match");
                      return;
                    }
                    const { error } = await supabase.auth.updateUser({ password: newPw });
                    if (error) toast.error(error.message);
                    else toast.success("Password updated");
                  }}
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Workspace / Company Tab ── */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Branding</CardTitle>
              <CardDescription>
                Customize your workspace appearance for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50">
                  <img src={logoColor} alt="Logo" className="h-10 object-contain" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    SVG, PNG or JPG. Recommended 200×50px.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Workspace Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyTagline">Tagline</Label>
                  <Input
                    id="companyTagline"
                    value={companyTagline}
                    onChange={(e) => setCompanyTagline(e.target.value)}
                    placeholder="Short description"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  placeholder="Enter your company address"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input id="companyPhone" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input id="companyWebsite" placeholder="https://example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} — {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This currency will be used across all budget displays
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} className="gap-2">
                  <Save className="h-4 w-4" /> Save Workspace Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Task Assignments</p>
                  <p className="text-xs text-muted-foreground">
                    When a task is assigned to you
                  </p>
                </div>
                <Switch checked={taskAssigned} onCheckedChange={setTaskAssigned} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Project Updates</p>
                  <p className="text-xs text-muted-foreground">
                    Status changes on projects you follow
                  </p>
                </div>
                <Switch checked={projectUpdates} onCheckedChange={setProjectUpdates} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Budget Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    When budget thresholds are exceeded
                  </p>
                </div>
                <Switch checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Weekly Digest</p>
                  <p className="text-xs text-muted-foreground">
                    Summary of activity sent every Monday
                  </p>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="h-4 w-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance Tab ── */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Colors</CardTitle>
              <CardDescription>
                Customize the look and feel of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 rounded-md border border-input cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="accentColor"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-10 rounded-md border border-input cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="rounded-lg border border-border p-4 flex items-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: primaryColor, color: "#fff" }}
                  >
                    BW
                  </div>
                  <div>
                    <p className="font-heading font-semibold">{companyName}</p>
                    <p className="text-xs text-muted-foreground">{companyTagline}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Sidebar Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Dark", "Light", "Branded"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSidebarStyle(style)}
                      className={cn(
                        "rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors focus:outline-none",
                        sidebarStyle === style ? "border-primary bg-primary/5" : "border-border hover:border-primary"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => { updateSettings({ primaryColor, accentColor, sidebarStyle }); toast.success("Appearance settings saved"); }} className="gap-2">
                  <Save className="h-4 w-4" /> Save Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
