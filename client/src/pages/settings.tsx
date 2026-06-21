import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useAccessibility } from "@/components/accessibility-provider";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  User,
  Bell,
  Accessibility,
  Moon,
  Sun,
  ShieldCheck,
  Globe,
  Camera,
  Upload,
  Loader2,
  BookOpen,
  UserCog,
  Building2,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AccessProfileWizard } from "@/components/access-profile-wizard";
import { AbnLookup } from "@/components/abn-lookup";
import { useMutation } from "@tanstack/react-query";

function EasyReadToggle() {
  const { isEnabled, setMode } = useAccessibility();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Easy Read Mode
        </p>
        <p className="text-xs text-muted-foreground">Larger text, simpler layout, more spacing for easier reading</p>
      </div>
      <Switch
        checked={isEnabled("easy-read")}
        onCheckedChange={(checked) => setMode("easy-read", checked)}
        data-testid="switch-easy-read"
        aria-label="Toggle easy read mode"
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, iconColor }: { icon: any; title: string; description: string; iconColor?: string }) {
  return (
    <div className="rounded-t-md bg-gradient-to-r from-primary via-blue-600 to-indigo-700 dark:from-primary dark:via-blue-800 dark:to-indigo-900 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white">{title}</h2>
          <p className="text-xs text-white/70">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ProfilePhotoUpload() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ id: string; avatar: string | null }>({
    queryKey: ["/api/me"],
  });

  useEffect(() => {
    if (currentUser?.avatar) {
      setAvatarUrl(currentUser.avatar);
    }
  }, [currentUser?.avatar]);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: async (response) => {
      setAvatarUrl(response.objectPath);
      if (currentUser?.id) {
        try {
          await apiRequest("PATCH", `/api/users/${currentUser.id}/avatar`, { avatar: response.objectPath });
          queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        } catch {
        }
      }
      toast({ title: "Photo uploaded", description: "Your profile photo has been updated" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
  };

  return (
    <div className="flex items-center gap-5" data-testid="profile-photo-upload">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4EAF7] to-[#E8F0F8] dark:from-[#1A4B7A] dark:to-[#14578F] flex items-center justify-center overflow-hidden border-2 border-border">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" data-testid="img-profile-avatar" />
          ) : (
            <User className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <button
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-change-avatar"
          aria-label="Change profile photo"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold">Profile Photo</p>
        <p className="text-xs text-muted-foreground mb-2">Upload a photo to personalize your profile</p>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-upload-photo"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {isUploading ? "Uploading..." : "Upload Photo"}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-file-avatar"
      />
    </div>
  );
}

function HighContrastToggle() {
  const { isEnabled, setMode } = useAccessibility();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">High Contrast Mode</p>
        <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
      </div>
      <Switch checked={isEnabled("high-contrast")} onCheckedChange={(checked) => setMode("high-contrast", checked)} data-testid="switch-high-contrast" aria-label="Toggle high contrast mode" />
    </div>
  );
}

function ScreenReaderToggle() {
  const { isEnabled, setMode } = useAccessibility();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">Screen Reader Optimization</p>
        <p className="text-xs text-muted-foreground">Hide decorative elements, enhance focus outlines</p>
      </div>
      <Switch checked={isEnabled("screen-reader-optimized")} onCheckedChange={(checked) => setMode("screen-reader-optimized", checked)} data-testid="switch-screen-reader" aria-label="Toggle screen reader optimization" />
    </div>
  );
}

function AccessProfileSection() {
  const [showWizard, setShowWizard] = useState(false);
  const profileQuery = useQuery<any>({ queryKey: ["/api/access-profile"] });
  const hasProfile = profileQuery.data && profileQuery.data.id;

  return (
    <>
      <Card className="overflow-visible">
        <SectionHeader icon={UserCog} title="Access Profile" description="Your mobility and accessibility needs for MapAble Chat" />
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{hasProfile ? "Edit Access Profile" : "Set Up Access Profile"}</p>
              <p className="text-xs text-muted-foreground">
                {hasProfile
                  ? "Update your mobility aids, sensory preferences, and communication mode"
                  : "Tell MapAble Chat about your accessibility needs for personalised guidance"}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowWizard(true)}
              data-testid="button-edit-access-profile"
            >
              {hasProfile ? "Edit" : "Set Up"}
            </Button>
          </div>
        </div>
      </Card>
      {showWizard && (
        <AccessProfileWizard
          onClose={() => {
            setShowWizard(false);
            queryClient.invalidateQueries({ queryKey: ["/api/access-profile"] });
          }}
        />
      )}
    </>
  );
}

function QuickBooksSection() {
  const { toast } = useToast();
  const { data: qbConfig } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/quickbooks/config"],
  });
  const { data: qbStatus, refetch: refetchStatus } = useQuery<{
    connected: boolean;
    realmId: string | null;
    connectedAt: string | null;
    enabled: boolean;
  }>({
    queryKey: ["/api/quickbooks/status"],
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/quickbooks/connect");
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start QuickBooks connection.", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/quickbooks/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/status"] });
      toast({ title: "Disconnected", description: "QuickBooks has been disconnected." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disconnect QuickBooks.", variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quickbooks/sync-all");
      return res.json();
    },
    onSuccess: (data: { pushed: number; paymentUpdates: number; errors: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Sync complete",
        description: `Pushed ${data.pushed} invoice(s), updated ${data.paymentUpdates} payment(s).${data.errors?.length ? ` ${data.errors.length} error(s).` : ""}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("qb_success") === "true") {
      toast({ title: "Connected", description: "QuickBooks Online has been connected successfully." });
      refetchStatus();
      window.history.replaceState({}, "", "/settings");
    } else if (params.get("qb_error")) {
      toast({ title: "Connection failed", description: `QuickBooks connection error: ${params.get("qb_error")}`, variant: "destructive" });
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  if (!qbConfig?.enabled) return null;

  const connected = qbStatus?.connected || false;

  return (
    <Card className="overflow-visible" data-testid="card-quickbooks-settings">
      <SectionHeader icon={Link2} title="QuickBooks Online" description="Sync invoices and payments with QuickBooks" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              Connection Status
              {connected ? (
                <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 gap-1" data-testid="badge-qb-connected">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 gap-1" data-testid="badge-qb-disconnected">
                  <XCircle className="w-3 h-3" /> Not Connected
                </Badge>
              )}
            </p>
            {connected && qbStatus?.connectedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Connected since {new Date(qbStatus.connectedAt).toLocaleDateString()}
                {qbStatus.realmId && ` (Company ID: ${qbStatus.realmId})`}
              </p>
            )}
            {!connected && (
              <p className="text-xs text-muted-foreground mt-1">
                Connect your QuickBooks Online account to automatically sync invoices and track payments
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="gap-1.5"
                  data-testid="button-qb-sync"
                >
                  {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {syncMutation.isPending ? "Syncing..." : "Sync Now"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="gap-1.5"
                  data-testid="button-qb-disconnect"
                >
                  {disconnectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="gap-1.5"
                data-testid="button-qb-connect"
              >
                {connectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Connect QuickBooks
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  usePageTitle("Settings");
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ id: string; fullName: string; email: string; location: string; notifyOrderUpdates?: boolean }>({
    queryKey: ["/api/me"],
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [notifyOrderUpdates, setNotifyOrderUpdates] = useState(true);

  useEffect(() => {
    if (currentUser && !profileLoaded) {
      setFullName(currentUser.fullName || "");
      setEmail(currentUser.email || "");
      setLocation(currentUser.location || "");
      setNotifyOrderUpdates(currentUser.notifyOrderUpdates ?? true);
      setProfileLoaded(true);
    }
  }, [currentUser, profileLoaded]);

  const updateOrderNotifyPref = async (next: boolean) => {
    const previous = notifyOrderUpdates;
    setNotifyOrderUpdates(next);
    try {
      await apiRequest("PATCH", "/api/me/notification-prefs", { notifyOrderUpdates: next });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: next ? "Order notifications on" : "Order notifications off",
        description: next
          ? "We'll email you when your grocery order status changes."
          : "You won't receive emails about grocery order status changes.",
      });
    } catch {
      setNotifyOrderUpdates(previous);
      toast({ title: "Error", description: "Could not update notification preference.", variant: "destructive" });
    }
  };

  const isSaveDisabled = !profileLoaded;

  const saveProfile = async () => {
    if (!profileLoaded) return;
    if (!fullName.trim()) {
      toast({ title: "Validation error", description: "Full name is required.", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("PATCH", "/api/me", { fullName: fullName.trim(), email: email.trim(), location: location.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and accessibility preferences
        </p>
      </div>

      <Card className="overflow-visible">
        <SectionHeader icon={User} title="Profile" description="Your personal information" />
        <div className="p-5 grid gap-4">
          <ProfilePhotoUpload />
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-name" className="text-sm font-semibold">Full Name</Label>
              <Input id="settings-name" placeholder="Your full name" className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} data-testid="input-full-name" />
            </div>
            <div>
              <Label htmlFor="settings-email" className="text-sm font-semibold">Email</Label>
              <Input id="settings-email" placeholder="email@example.com" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" />
            </div>
          </div>
          <div>
            <Label htmlFor="settings-location" className="text-sm font-semibold">Location</Label>
            <Input id="settings-location" placeholder="City, State" className="mt-1" value={location} onChange={(e) => setLocation(e.target.value)} data-testid="input-location" />
          </div>
        </div>
      </Card>

      <Card className="overflow-visible">
        <SectionHeader icon={Accessibility} title="Accessibility" description="Display and interaction preferences" />
        <div className="p-5 space-y-4">
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
          <HighContrastToggle />
          <Separator />
          <ScreenReaderToggle />
          <Separator />
          <EasyReadToggle />
        </div>
      </Card>

      <AccessProfileSection />

      <Card className="overflow-visible">
        <SectionHeader icon={Bell} title="Notifications" description="Choose what updates you receive" />
        <div className="p-5 space-y-4">
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
              <p className="text-sm font-semibold">Grocery Order Updates</p>
              <p className="text-xs text-muted-foreground">
                Email me when my grocery order moves to confirmed, shopping, out for delivery, or delivered
              </p>
            </div>
            <Switch
              checked={notifyOrderUpdates}
              disabled={!profileLoaded}
              onCheckedChange={updateOrderNotifyPref}
              data-testid="switch-grocery-order-notifications"
            />
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

      <Card className="overflow-visible">
        <SectionHeader icon={ShieldCheck} title="NDIS & Verification" description="Manage your credentials" />
        <div className="p-5 space-y-3">
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

      <QuickBooksSection />

      <Card className="overflow-visible">
        <SectionHeader icon={Building2} title="ABN Verification" description="Verify your Australian Business Number" />
        <div className="p-5">
          <AbnLookup compact />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" data-testid="button-cancel">Cancel</Button>
        <Button onClick={saveProfile} disabled={isSaveDisabled} data-testid="button-save-settings">Save Changes</Button>
      </div>
    </div>
  );
}
