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
  Star,
  DollarSign,
  Navigation,
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
    <Card className="overflow-visible">
      <div className="rounded-t-md bg-gradient-to-r from-primary via-blue-600 to-indigo-700 dark:from-primary dark:via-blue-800 dark:to-indigo-900 px-5 py-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Bus className="w-5 h-5" /> Request Transport
        </h2>
        <p className="text-sm text-white/70 mt-0.5">Book accessible transport</p>
      </div>
      <div className="p-5 space-y-4">
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black tracking-tight">Available Drivers</h2>
        <Badge variant="secondary">{transportWorkers?.length || 0} drivers</Badge>
      </div>
      {transportWorkers?.map((w) => (
        <Card key={w.id} className="p-4 hover-elevate">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 flex items-center justify-center font-bold text-sm flex-shrink-0 text-primary">
              {w.user?.fullName?.split(" ").map((n) => n[0]).join("") || "SW"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm truncate">{w.user?.fullName}</span>
                {w.ndisVerified && (
                  <Badge variant="secondary" className="gap-0.5 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
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
                {w.rating && Number(w.rating) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {Number(w.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" data-testid={`button-select-driver-${w.id}`}>
              Select
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TripLogger() {
  const { toast } = useToast();
  const [distance, setDistance] = useState("");
  const [driverId, setDriverId] = useState("");
  const [accessible, setAccessible] = useState(false);
  const [tolls, setTolls] = useState("");

  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });

  const { data: drivers } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

  const transportDrivers = drivers?.filter((d) => d.transportCapable) || [];

  const logTrip = useMutation({
    mutationFn: async () => {
      const dist = Math.max(0, parseFloat(distance) || 0);
      const tollAmount = Math.max(0, parseFloat(tolls) || 0);
      if (dist <= 0) throw new Error("Distance must be greater than 0");
      const today = new Date().toISOString().split("T")[0];
      const res = await apiRequest("POST", "/api/trips", {
        workerId: driverId,
        participantId: me?.id || "demo-participant",
        distanceKm: String(dist),
        accessibleVehicle: accessible,
        tolls: String(tollAmount),
        date: today,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Trip logged",
        description: `${data.distanceKm}km at $${Number(data.perKmRate || 0).toFixed(2)}/km (${data.tierApplied}) — Total: $${Number(data.totalCharge || 0).toFixed(2)}`,
      });
      setDistance("");
      setDriverId("");
      setAccessible(false);
      setTolls("");
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log trip.", variant: "destructive" });
    },
  });

  return (
    <Card className="overflow-hidden" data-testid="card-trip-logger">
      <div className="bg-gradient-to-r from-[#2EAA6E] to-[#25905D] px-5 py-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Navigation className="w-4 h-4" /> Log a Trip
        </h3>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <Label htmlFor="trip-driver" className="text-xs font-semibold">Driver</Label>
          <select
            id="trip-driver"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            data-testid="select-trip-driver"
          >
            <option value="">Select driver...</option>
            {transportDrivers.map((d) => (
              <option key={d.id} value={d.id}>{d.user?.fullName || "Driver"}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="trip-distance" className="text-xs font-semibold">Distance (km)</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="trip-distance"
              type="number"
              step="0.1"
              min="0.1"
              className="pl-9"
              placeholder="e.g. 25.5"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              data-testid="input-trip-distance"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="trip-tolls" className="text-xs font-semibold">Tolls ($)</Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="trip-tolls"
              type="number"
              step="0.01"
              min="0"
              className="pl-9"
              placeholder="0.00"
              value={tolls}
              onChange={(e) => setTolls(e.target.value)}
              data-testid="input-trip-tolls"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="trip-accessible"
            checked={accessible}
            onCheckedChange={(v) => setAccessible(v === true)}
            data-testid="checkbox-trip-accessible"
          />
          <Label htmlFor="trip-accessible" className="text-xs">Wheelchair Accessible Vehicle ($2.76/km)</Label>
        </div>
        <Button
          className="w-full gap-2"
          disabled={!driverId || !distance || logTrip.isPending}
          onClick={() => logTrip.mutate()}
          data-testid="button-log-trip"
        >
          {logTrip.isPending ? "Logging..." : "Log Trip"}
        </Button>
      </div>
    </Card>
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
      <h2 className="text-lg font-black tracking-tight">Recent Requests</h2>
      {requests.map((r) => (
        <Card key={r.id} className="p-4 hover-elevate">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary" />
                {r.pickupLocation}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <ArrowRight className="w-3 h-3 text-emerald-500" />
                {r.dropoffLocation}
              </div>
            </div>
            <Badge className={statusColors[r.status] || ""}>{r.status.replace("_", " ")}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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
          <TripLogger />
          <RecentRequests />
        </div>
        <div className="lg:col-span-2">
          <TransportDrivers />
        </div>
      </div>
    </div>
  );
}
