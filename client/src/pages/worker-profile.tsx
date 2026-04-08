import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { Redirect } from "wouter";
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

  useEffect(() => {
    if (worker?.user) {
      setFullName(worker.user.fullName || "");
      setEmail(worker.user.email || "");
      setLocation(worker.user.location || "");
      setPhoneNumber(worker.user.phoneNumber || "");
      setBio(worker.user.bio || "");
    }
  }, [worker]);

  const updateMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; location: string; phoneNumber: string; bio: string }) => {
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
    updateMutation.mutate({ fullName, email, location, phoneNumber, bio });
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
          <ShieldCheck className="w-5 h-5 text-[#2EAA6E]" /> Worker Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Title / Role</Label>
            <p className="font-medium mt-0.5" data-testid="text-worker-title">{worker.title}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Hourly Rate</Label>
            <p className="font-medium mt-0.5 flex items-center gap-1" data-testid="text-hourly-rate">
              <DollarSign className="w-3.5 h-3.5" />
              {Number(worker.hourlyRate || 0).toFixed(2)}/hr
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Rating</Label>
            <p className="font-medium mt-0.5 flex items-center gap-1" data-testid="text-rating">
              <Star className="w-3.5 h-3.5 fill-[#E6A817] text-[#E6A817]" />
              {Number(worker.rating || 0).toFixed(1)} ({worker.reviewCount || 0} reviews)
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">ABN</Label>
            <p className="font-medium mt-0.5" data-testid="text-abn">{worker.abn || "Not set"}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <h3 className="text-sm font-semibold mb-3">Specializations</h3>
        <div className="flex flex-wrap gap-2" data-testid="list-specializations">
          {(worker.specializations || []).map((spec, i) => (
            <Badge key={i} variant="secondary">{spec}</Badge>
          ))}
          {(!worker.specializations || worker.specializations.length === 0) && (
            <span className="text-sm text-muted-foreground">No specializations listed</span>
          )}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-compliance">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E6A817]" /> Compliance & Verification
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm">NDIS Verified</span>
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
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Insurance</span>
            {worker.insuranceExpiry ? (
              <span className="text-sm font-medium">Expires: {worker.insuranceExpiry}</span>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                <AlertTriangle className="w-3 h-3" /> Not set
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Transport Capable</span>
            <Badge variant={worker.transportCapable ? "default" : "outline"}>
              {worker.transportCapable ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Wheelchair Accessible</span>
            <Badge variant={worker.wheelchairAccessible ? "default" : "outline"}>
              {worker.wheelchairAccessible ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
