import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { Link, Redirect } from "wouter";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  AlertTriangle,
  Save,
  DollarSign,
  FileText,
  Calendar,
  Car,
  Accessibility,
  Briefcase,
  Languages,
  X,
  Plus,
  ExternalLink,
  Camera,
  Upload,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Worker, User } from "@shared/schema";

type WorkerWithUser = Worker & { user?: User };

export default function WorkerProfile() {
  usePageTitle("My Profile | MapAble");
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const { data: worker, isLoading } = useQuery<WorkerWithUser>({
    queryKey: ["/api/worker/me"],
    enabled: authUser?.role === "carer",
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [transportCapable, setTransportCapable] = useState(false);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [transportType, setTransportType] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [firstAidExpiry, setFirstAidExpiry] = useState("");
  const [wwccNumber, setWwccNumber] = useState("");
  const [wwccExpiry, setWwccExpiry] = useState("");
  const [screeningNumber, setScreeningNumber] = useState("");
  const [screeningExpiry, setScreeningExpiry] = useState("");

  useEffect(() => {
    if (worker) {
      if (worker.user) {
        setFullName(worker.user.fullName || "");
        setEmail(worker.user.email || "");
        setLocation(worker.user.location || "");
        setPhoneNumber(worker.user.phoneNumber || "");
        setBio(worker.user.bio || "");
        setLanguages(worker.user.languages || []);
      }
      setTitle(worker.title || "");
      setSpecializations(worker.specializations || []);
      setHourlyRate(worker.hourlyRate ? String(worker.hourlyRate) : "");
      setTransportCapable(worker.transportCapable ?? false);
      setWheelchairAccessible(worker.wheelchairAccessible ?? false);
      setTransportType(worker.transportType || "");
      setInsuranceExpiry(worker.insuranceExpiry || "");
      setFirstAidExpiry(worker.firstAidExpiry || "");
      setWwccNumber(worker.wwccNumber || "");
      setWwccExpiry(worker.wwccExpiry || "");
      setScreeningNumber(worker.screeningNumber || "");
      setScreeningExpiry(worker.screeningExpiry || "");
      setPhotoUrl(worker.photo || "");
    }
  }, [worker]);

  const [photoUrl, setPhotoUrl] = useState("");

  const photoMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!worker) throw new Error("No worker");
      const res = await apiRequest("PATCH", `/api/workers/${worker.id}/photo`, { photo: url });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker/me"] });
      toast({ title: "Photo updated" });
    },
    onError: () => {
      toast({ title: "Failed to update photo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("PATCH", "/api/worker/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  if (authUser && authUser.role !== "carer") {
    return <Redirect to="/" />;
  }

  const handleSave = () => {
    updateMutation.mutate({
      fullName,
      email,
      location,
      phoneNumber,
      bio,
      title,
      specializations,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      transportCapable,
      wheelchairAccessible,
      transportType: transportType || null,
      languages,
      insuranceExpiry: insuranceExpiry || null,
      firstAidExpiry: firstAidExpiry || null,
      wwccNumber: wwccNumber || null,
      wwccExpiry: wwccExpiry || null,
      screeningNumber: screeningNumber || null,
      screeningExpiry: screeningExpiry || null,
    });
  };

  const addSpecialization = () => {
    const trimmed = newSpec.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations([...specializations, trimmed]);
      setNewSpec("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const addLanguage = () => {
    const trimmed = newLanguage.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="worker-profile-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-6" data-testid="worker-profile-error">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">Make sure you're logged in as a support worker.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl" data-testid="worker-profile">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-profile-heading">My Profile</h1>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2" data-testid="button-save-profile">
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="p-6" data-testid="card-profile-photo">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#1B6EB5]" /> Profile Photo
        </h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border" data-testid="img-profile-photo">
            {worker.photo ? (
              <img src={worker.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <div className="flex gap-2">
              <Input id="photoUrl" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://example.com/photo.jpg" data-testid="input-photo-url" className="flex-1" />
              <Button size="sm" disabled={!photoUrl || photoMutation.isPending} onClick={() => photoMutation.mutate(photoUrl)} data-testid="button-update-photo">
                <Upload className="w-4 h-4 mr-1" /> {photoMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter the URL of your profile photo.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-personal-info">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-[#1B6EB5]" /> Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName" className="flex items-center gap-1.5 mb-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              data-testid="input-fullname"
            />
          </div>
          <div>
            <Label htmlFor="email" className="flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
          <div>
            <Label htmlFor="location" className="flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="input-location"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone
            </Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              data-testid="input-phone"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio" className="flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5" /> Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell participants about yourself..."
              data-testid="input-bio"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-worker-details">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#1B6EB5]" /> Worker Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="flex items-center gap-1.5 mb-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Title / Role
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Support Worker, Occupational Therapist"
              data-testid="input-title"
            />
          </div>
          <div>
            <Label htmlFor="hourlyRate" className="flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Hourly Rate (AUD)
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g., 55.00"
              data-testid="input-hourly-rate"
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Rating</Label>
            <p className="font-medium mt-1.5 flex items-center gap-1" data-testid="text-rating">
              <Star className="w-3.5 h-3.5 fill-[#E6A817] text-[#E6A817]" />
              {Number(worker.rating || 0).toFixed(1)} ({worker.reviewCount || 0} reviews)
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">ABN</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="font-medium" data-testid="text-abn">{worker.abn || "Not set"}</p>
              <Link href="/abn-lookup">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[#1B6EB5]" data-testid="link-abn-lookup">
                  <ExternalLink className="w-3 h-3" /> ABN Lookup
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Briefcase className="w-3.5 h-3.5" /> Specializations
            </Label>
            <div className="flex flex-wrap gap-2 mb-2" data-testid="list-specializations">
              {specializations.map((spec, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {spec}
                  <button onClick={() => removeSpecialization(spec)} className="ml-1 hover:text-red-500" data-testid={`button-remove-spec-${i}`}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {specializations.length === 0 && (
                <span className="text-sm text-muted-foreground">No specializations listed</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                placeholder="Add specialization..."
                className="max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
                data-testid="input-new-specialization"
              />
              <Button variant="outline" size="sm" onClick={addSpecialization} className="gap-1" data-testid="button-add-specialization">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Languages className="w-3.5 h-3.5" /> Languages
            </Label>
            <div className="flex flex-wrap gap-2 mb-2" data-testid="list-languages">
              {languages.map((lang, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {lang}
                  <button onClick={() => removeLanguage(lang)} className="ml-1 hover:text-red-500" data-testid={`button-remove-lang-${i}`}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {languages.length === 0 && (
                <span className="text-sm text-muted-foreground">No languages listed</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add language..."
                className="max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                data-testid="input-new-language"
              />
              <Button variant="outline" size="sm" onClick={addLanguage} className="gap-1" data-testid="button-add-language">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-transport">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-[#2EAA6E]" /> Transport Settings
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Transport Capable</p>
                <p className="text-xs text-muted-foreground">Can provide transport to participants</p>
              </div>
            </div>
            <Switch
              checked={transportCapable}
              onCheckedChange={setTransportCapable}
              data-testid="switch-transport"
            />
          </div>
          {transportCapable && (
            <div className="pl-10">
              <Label className="text-xs text-muted-foreground mb-1">Vehicle Type</Label>
              <Input
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                placeholder="e.g., Sedan, Van, Modified vehicle"
                className="max-w-xs"
                data-testid="input-transport-type"
              />
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Wheelchair Accessible Vehicle</p>
                <p className="text-xs text-muted-foreground">Vehicle can accommodate wheelchairs</p>
              </div>
            </div>
            <Switch
              checked={wheelchairAccessible}
              onCheckedChange={setWheelchairAccessible}
              data-testid="switch-wheelchair"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-compliance">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E6A817]" /> Compliance & Verification
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">NDIS Verified</span>
            {worker.ndisVerified ? (
              <Badge className="bg-[#2EAA6E]/10 text-[#2EAA6E] border-[#2EAA6E]/30 gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                <AlertTriangle className="w-3 h-3" /> Pending
              </Badge>
            )}
          </div>

          <ExpiryField label="Insurance" value={insuranceExpiry} onChange={setInsuranceExpiry} testId="insurance" />
          <ExpiryField label="First Aid Certificate" value={firstAidExpiry} onChange={setFirstAidExpiry} testId="first-aid" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">WWCC Number</Label>
              <Input
                value={wwccNumber}
                onChange={(e) => setWwccNumber(e.target.value)}
                placeholder="WWCC number"
                data-testid="input-wwcc-number"
              />
            </div>
            <ExpiryField label="WWCC Expiry" value={wwccExpiry} onChange={setWwccExpiry} testId="wwcc" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Screening Number</Label>
              <Input
                value={screeningNumber}
                onChange={(e) => setScreeningNumber(e.target.value)}
                placeholder="Screening clearance number"
                data-testid="input-screening-number"
              />
            </div>
            <ExpiryField label="Screening Expiry" value={screeningExpiry} onChange={setScreeningExpiry} testId="screening" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ExpiryField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId: string }) {
  const getExpiryStatus = () => {
    if (!value) return { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", text: "Not set" };
    const days = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", text: "Expired" };
    if (days <= 30) return { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", text: `Expires in ${days}d` };
    return { color: "text-[#2EAA6E]", bg: "bg-green-50 dark:bg-green-950/30", text: "Valid" };
  };
  const status = getExpiryStatus();
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[200px]"
          data-testid={`input-${testId}-expiry`}
        />
        <Badge variant="outline" className={`${status.color} text-xs`} data-testid={`badge-${testId}-status`}>
          {status.text}
        </Badge>
      </div>
    </div>
  );
}
