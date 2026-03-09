import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
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
} from "lucide-react";
import { AccessProfileWizard } from "@/components/access-profile-wizard";

function EasyReadToggle() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem("easy-read") === "true";
  });

  const toggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem("easy-read", String(checked));
    if (checked) {
      document.documentElement.classList.add("easy-read");
    } else {
      document.documentElement.classList.remove("easy-read");
    }
  };

  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add("easy-read");
    }
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Easy Read Mode
        </p>
        <p className="text-xs text-muted-foreground">Larger text, simpler layout, more spacing for easier reading</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
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
  const [enabled, setEnabled] = useState(() => localStorage.getItem("high-contrast") === "true");

  const toggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem("high-contrast", String(checked));
    if (checked) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  useEffect(() => {
    if (enabled) document.documentElement.classList.add("high-contrast");
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">High Contrast Mode</p>
        <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} data-testid="switch-high-contrast" aria-label="Toggle high contrast mode" />
    </div>
  );
}

function ScreenReaderToggle() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("screen-reader-optimized") === "true");

  const toggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem("screen-reader-optimized", String(checked));
    if (checked) {
      document.documentElement.classList.add("screen-reader-optimized");
    } else {
      document.documentElement.classList.remove("screen-reader-optimized");
    }
  };

  useEffect(() => {
    if (enabled) document.documentElement.classList.add("screen-reader-optimized");
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">Screen Reader Optimization</p>
        <p className="text-xs text-muted-foreground">Hide decorative elements, enhance focus outlines</p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} data-testid="switch-screen-reader" aria-label="Toggle screen reader optimization" />
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

export default function SettingsPage() {
  usePageTitle("Settings");
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ id: string; fullName: string; email: string; location: string }>({
    queryKey: ["/api/me"],
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (currentUser && !profileLoaded) {
      setFullName(currentUser.fullName || "");
      setEmail(currentUser.email || "");
      setLocation(currentUser.location || "");
      setProfileLoaded(true);
    }
  }, [currentUser, profileLoaded]);

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

      <div className="flex justify-end gap-3">
        <Button variant="secondary" data-testid="button-cancel">Cancel</Button>
        <Button onClick={saveProfile} disabled={isSaveDisabled} data-testid="button-save-settings">Save Changes</Button>
      </div>
    </div>
  );
}
