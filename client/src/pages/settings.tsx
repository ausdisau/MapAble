import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  User,
  Bell,
  Accessibility,
  Moon,
  Sun,
  ShieldCheck,
  Globe,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and accessibility preferences
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-bold">Profile</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">Full Name</Label>
              <Input placeholder="Your full name" className="mt-1" data-testid="input-full-name" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Email</Label>
              <Input placeholder="email@example.com" className="mt-1" data-testid="input-email" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">Location</Label>
            <Input placeholder="City, State" className="mt-1" data-testid="input-location" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
            <Accessibility className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="font-bold">Accessibility</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode"
              />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">High Contrast Mode</p>
              <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
            </div>
            <Switch data-testid="switch-high-contrast" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Screen Reader Optimization</p>
              <p className="text-xs text-muted-foreground">Optimize layout for screen readers</p>
            </div>
            <Switch data-testid="switch-screen-reader" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="font-bold">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Booking Updates</p>
              <p className="text-xs text-muted-foreground">Get notified about booking status changes</p>
            </div>
            <Switch defaultChecked data-testid="switch-booking-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">New Messages</p>
              <p className="text-xs text-muted-foreground">Receive notifications for new messages</p>
            </div>
            <Switch defaultChecked data-testid="switch-message-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Job Alerts</p>
              <p className="text-xs text-muted-foreground">Get alerts for new job postings</p>
            </div>
            <Switch data-testid="switch-job-notifications" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-bold">NDIS & Verification</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">NDIS Worker Screening</p>
              <p className="text-xs text-muted-foreground">Upload your worker screening certificate</p>
            </div>
            <Button variant="secondary" size="sm" data-testid="button-upload-screening">
              Upload
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Languages
              </p>
              <p className="text-xs text-muted-foreground">Set your spoken languages</p>
            </div>
            <Button variant="secondary" size="sm" data-testid="button-edit-languages">
              Edit
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" data-testid="button-cancel">Cancel</Button>
        <Button data-testid="button-save-settings">Save Changes</Button>
      </div>
    </div>
  );
}
