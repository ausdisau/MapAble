import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ShieldCheck,
  MapPin,
  Star,
  Car,
  Accessibility,
  Clock,
  DollarSign,
  Globe,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Worker, User } from "@shared/schema";

export default function WorkerDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [showBooking, setShowBooking] = useState(false);

  const { data: worker, isLoading } = useQuery<Worker & { user?: User }>({
    queryKey: ["/api/workers", params.id],
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings", {
        participantId: "demo-participant",
        workerId: params.id,
        serviceType: "General Support",
        date: bookingDate,
        startTime: bookingTime,
        notes: bookingNotes || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Booking submitted!", description: "Your booking request has been sent." });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setShowBooking(false);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create booking.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6">
          <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </Card>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold mb-2">Worker not found</h2>
        <Link href="/care">
          <Button variant="secondary" data-testid="button-back-to-workers">Back to Workers</Button>
        </Link>
      </div>
    );
  }

  const initials = worker.user?.fullName
    ? worker.user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "SW";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/care">
        <Button variant="ghost" size="sm" className="gap-1" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" /> Back to Workers
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="relative h-28 rounded-t-md bg-gradient-to-r from-primary via-blue-600 to-indigo-700 dark:from-primary dark:via-blue-800 dark:to-indigo-900" />
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <Avatar className="w-20 h-20 border-4 border-card shadow-lg flex-shrink-0">
                  {worker.photo ? (
                    <AvatarImage src={worker.photo} alt={worker.user?.fullName || "Worker"} />
                  ) : (
                    <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black tracking-tight" data-testid="text-worker-name">
                      {worker.user?.fullName}
                    </h1>
                    {worker.ndisVerified && (
                      <Badge variant="secondary" className="gap-1 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{worker.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {worker.user?.location}
                </span>
                {worker.rating && Number(worker.rating) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {Number(worker.rating).toFixed(1)} ({worker.reviewCount} reviews)
                  </span>
                )}
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-bold text-sm mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{worker.user?.bio}</p>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-bold text-sm mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-1.5">
                  {worker.specializations?.map((spec, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{spec}</Badge>
                  ))}
                </div>
              </div>

              {worker.user?.languages && worker.user.languages.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Languages
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {worker.user.languages.map((lang, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-3">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>${worker.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{worker.availability}</span>
              </div>
              {worker.transportCapable && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0">
                    <Car className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span>{worker.transportType || "Transport Available"}</span>
                </div>
              )}
              {worker.wheelchairAccessible && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                    <Accessibility className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Wheelchair Accessible</span>
                </div>
              )}
            </div>
          </Card>

          {!showBooking ? (
            <Button className="w-full" onClick={() => setShowBooking(true)} data-testid="button-start-booking">
              Book This Worker
            </Button>
          ) : (
            <Card className="overflow-visible">
              <div className="rounded-t-md bg-gradient-to-r from-primary via-blue-600 to-indigo-700 dark:from-primary dark:via-blue-800 dark:to-indigo-900 px-5 py-3">
                <h3 className="font-bold text-sm text-white">Book {worker.user?.fullName?.split(" ")[0]}</h3>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      data-testid="input-booking-date"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Time</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      className="pl-9"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      data-testid="input-booking-time"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Notes</Label>
                  <Textarea
                    className="mt-1 resize-none"
                    placeholder="Any specific requirements..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    data-testid="input-booking-notes"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!bookingDate || !bookingTime || createBooking.isPending}
                    onClick={() => createBooking.mutate()}
                    data-testid="button-confirm-booking"
                  >
                    {createBooking.isPending ? "Submitting..." : "Confirm Booking"}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowBooking(false)} data-testid="button-cancel-booking">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
