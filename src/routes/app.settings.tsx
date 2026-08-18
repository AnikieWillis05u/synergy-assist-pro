import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Manage your profile, AI preferences, notifications, appearance and privacy settings.",
      },
      { property: "og:title", content: "Settings" },
      { property: "og:description", content: "Tune your AI assistant to the way you work." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, updateUser, updatePreferences, theme, toggleTheme, resetDemoData } = useStore();
  const p = user.preferences;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Profile, AI behaviour, notifications and privacy." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Profile</CardTitle>
            <CardDescription>How you appear across the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={user.name}
                onChange={(e) => updateUser({ name: e.target.value, avatar: e.target.value.slice(0, 2).toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} onChange={(e) => updateUser({ email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={user.role} onChange={(e) => updateUser({ role: e.target.value })} />
            </div>
            <Button className="rounded-xl" onClick={() => toast.success("Profile saved")}>
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">AI preferences</CardTitle>
            <CardDescription>Shape how your assistant writes and plans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Writing tone</Label>
              <Select value={p.tone} onValueChange={(v) => updatePreferences({ tone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Professional", "Friendly", "Direct", "Detailed"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Summary length</Label>
              <Select value={p.summaryLength} onValueChange={(v) => updatePreferences({ summaryLength: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Concise", "Balanced", "Comprehensive"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ToggleRow
              label="Auto-convert action items"
              hint="Suggest turning meeting action items into tasks."
              checked={p.autoConvertActionItems}
              onChange={(v) => updatePreferences({ autoConvertActionItems: v })}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Notifications</CardTitle>
            <CardDescription>Choose what your assistant tells you about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Email notifications"
              hint="Daily digest of what needs attention."
              checked={p.emailNotifications}
              onChange={(v) => updatePreferences({ emailNotifications: v })}
            />
            <ToggleRow
              label="Deadline reminders"
              hint="Alerts before a task is due."
              checked={p.deadlineReminders}
              onChange={(v) => updatePreferences({ deadlineReminders: v })}
            />
            <ToggleRow
              label="Weekly digest"
              hint="A Monday summary of your productivity."
              checked={p.weeklyDigest}
              onChange={(v) => updatePreferences({ weeklyDigest: v })}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Appearance, data & account</CardTitle>
            <CardDescription>Theme, connected AI services and your data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Dark mode"
              hint="Switch between light and dark themes."
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <div className="rounded-xl border border-border/70 p-3">
              <p className="text-sm font-medium">Connected AI service</p>
              <p className="text-xs text-muted-foreground">
                {p.aiModel} — used for summaries, planning and chat. Falls back to demo responses when unavailable.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  resetDemoData();
                  toast.success("Workspace reset to demo data");
                }}
              >
                Reset workspace data
              </Button>
              <Button variant="ghost" className="rounded-xl" onClick={() => toast.success("Settings saved")}>
                Save all settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
