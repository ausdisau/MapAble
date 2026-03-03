import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Bus,
  MapPin,
  Clock,
  Car,
  Accessibility,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { TransportRequest, Worker, User } from "@shared/schema";

function TransportBookingForm() {
  const { toast } = useToast();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [wheelchair, setWheelchair] = useState(false);
  const [notes, setNotes] = useState("");

  const createRequest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/transport", {
        participantId: "demo-participant",
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        date,
        time,
        wheelchairRequired: wheelchair,
        notes: notes || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Transport requested!", description: "Your request has been submitted." });
      queryClient.invalidateQueries({ queryKey: ["/api/transport"] });
      setPickup("");
      setDropoff("");
      setDate("");
      setTime("");
      setWheelchair(false);
      setNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    },
  });

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold mb-4">Request Transport</h2>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Pickup Location</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter pickup address..."
              className="pl-9"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              data-testid="input-pickup"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold">Dropoff Location</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <Input
              placeholder="Enter destination..."
              className="pl-9"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              data-testid="input-dropoff"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Date</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-9"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-transport-date"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">Time</Label>
            <div className="relative mt-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                className="pl-9"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-testid="input-transport-time"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wheelchair"
            checked={wheelchair}
            onCheckedChange={(c) => setWheelchair(c as boolean)}
            data-testid="checkbox-wheelchair"
          />
          <Label htmlFor="wheelchair" className="text-sm cursor-pointer flex items-center gap-1">
            <Accessibility className="w-3 h-3" /> Wheelchair accessible vehicle required
          </Label>
        </div>
        <div>
          <Label className="text-sm font-semibold">Notes (optional)</Label>
          <Textarea
            className="mt-1 resize-none"
            placeholder="Any special requirements..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="input-transport-notes"
          />
        </div>
        <Button
          className="w-full gap-2"
          onClick={() => createRequest.mutate()}
          disabled={!pickup || !dropoff || !date || !time || createRequest.isPending}
          data-testid="button-request-transport"
        >
          {createRequest.isPending ? "Submitting..." : (
            <>
              <Bus className="w-4 h-4" /> Request Transport
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function TransportDrivers() {
  const { data: workers, isLoading } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

  const transportWorkers = workers?.filter((w) => w.transportCapable);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Available Drivers</h2>
      {transportWorkers?.map((w) => (
        <Card key={w.id} className="p-4 hover-elevate">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">
              {w.user?.fullName?.split(" ").map((n) => n[0]).join("") || "SW"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">{w.user?.fullName}</span>
                {w.ndisVerified && (
                  <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3" /> {w.transportType || "Car"}
                </span>
                {w.wheelchairAccessible && (
                  <span className="flex items-center gap-1">
                    <Accessibility className="w-3 h-3" /> Accessible
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {w.user?.location}
                </span>
              </div>
            </div>
            <Button size="sm" variant="secondary" data-testid={`button-select-driver-${w.id}`}>
              Select
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RecentRequests() {
  const { data: requests, isLoading } = useQuery<TransportRequest[]>({
    queryKey: ["/api/transport"],
  });

  const statusColors: Record<string, string> = {
    requested: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300",
    accepted: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
    in_transit: "bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300",
    completed: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
    cancelled: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (!requests?.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Recent Requests</h2>
      {requests.map((r) => (
        <Card key={r.id} className="p-4 hover-elevate">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                {r.pickupLocation}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <ArrowRight className="w-3 h-3 text-emerald-500" />
                {r.dropoffLocation}
              </div>
            </div>
            <Badge className={statusColors[r.status] || ""}>{r.status.replace("_", " ")}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {r.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {r.time}
            </span>
            {r.wheelchairRequired && (
              <span className="flex items-center gap-1">
                <Accessibility className="w-3 h-3" /> Wheelchair
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function TransportPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Get Transport</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Book wheelchair accessible transport with verified NDIS drivers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <TransportBookingForm />
          <RecentRequests />
        </div>
        <div className="lg:col-span-2">
          <TransportDrivers />
        </div>
      </div>
    </div>
  );
}
