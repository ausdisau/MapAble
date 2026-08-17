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
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Heart,
  Send,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Worker, User, Review } from "@shared/schema";
import { validateAbnChecksum, stripAbn } from "@shared/abn-utils";

function VerificationChecklist({ worker }: { worker: Worker & { user?: User } }) {
  const abnChecksumValid = !!worker.abn && validateAbnChecksum(stripAbn(worker.abn));
  const abnVerified = abnChecksumValid;

  const items = [
    {
      label: "NDIS Worker Screening",
      verified: worker.ndisVerified,
      detail: worker.ndisVerified ? "Verified" : "Pending",
    },
    {
      label: "First Aid Certificate",
      verified: !!worker.firstAidExpiry,
      detail: worker.firstAidExpiry ? `Expires ${worker.firstAidExpiry}` : "Not provided",
    },
    {
      label: "Working With Children Check",
      verified: !!worker.wwccNumber,
      detail: worker.wwccNumber
        ? `${worker.wwccNumber} (Expires ${worker.wwccExpiry || "N/A"})`
        : "Not provided",
    },
    {
      label: "Professional Insurance",
      verified: !!worker.insuranceExpiry,
      detail: worker.insuranceExpiry ? `Expires ${worker.insuranceExpiry}` : "Not provided",
    },
    {
      label: "ABN Registered",
      verified: !!worker.abn && abnVerified,
      detail: worker.abn
        ? abnChecksumValid
          ? `Valid — ${worker.abn}`
          : `Unverified — ${worker.abn}`
        : "Not provided",
    },
  ];

  const verifiedCount = items.filter((i) => i.verified).length;

  return (
    <Card className="p-5" data-testid="card-verification-checklist">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#2EAA6E]" /> Verification
        </h3>
        <Badge variant="secondary" className="text-[10px]">
          {verifiedCount}/{items.length} verified
        </Badge>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5" data-testid={`verification-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
            {item.verified ? (
              <CheckCircle2 className="w-4 h-4 text-[#2EAA6E] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className="text-sm font-medium">{item.label}</span>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReviewForm({ workerId, participantId }: { workerId: string; participantId: string }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReview = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        toast({ title: "Please select a star rating", variant: "destructive" });
        throw new Error("Rating required");
      }
      const res = await apiRequest("POST", "/api/reviews", {
        participantId,
        workerId,
        rating,
        comment: comment || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thank you for your feedback." });
      queryClient.invalidateQueries({ queryKey: ["/api/workers", workerId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workers", workerId] });
      setRating(0);
      setComment("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
    },
  });

  return (
    <Card className="p-5" data-testid="card-review-form">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Heart className="w-4 h-4 text-[#E6A817]" /> Leave a Review
      </h3>
      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            data-testid={`button-star-${star}`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="resize-none mb-3"
        data-testid="input-review-comment"
      />
      <Button
        onClick={() => submitReview.mutate()}
        disabled={rating === 0 || submitReview.isPending}
        className="w-full gap-2"
        data-testid="button-submit-review"
      >
        <Send className="w-4 h-4" />
        {submitReview.isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </Card>
  );
}

function ShiftManager({ workerId, participantId, workerName }: { workerId: string; participantId: string; workerName: string }) {
  const { toast } = useToast();
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftStartTimestamp, setShiftStartTimestamp] = useState<number>(0);
  const [shiftStartTime, setShiftStartTime] = useState<string>("");
  const [shiftNotes, setShiftNotes] = useState("");
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!shiftActive || !shiftStartTimestamp) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - shiftStartTimestamp) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setElapsed(`${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [shiftActive, shiftStartTimestamp]);

  const endShift = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const endTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const diffMs = Math.max(0, now.getTime() - shiftStartTimestamp);
      const hours = Math.max(diffMs / 3600000, 0.25).toFixed(2);
      const today = now.toISOString().split("T")[0];

      const res = await apiRequest("POST", "/api/sessions", {
        workerId,
        participantId,
        startTime: shiftStartTime,
        endTime,
        actualHours: hours,
        date: today,
        shiftNotes: shiftNotes || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Shift completed",
        description: `Session logged: ${data.actualHours}hrs at $${Number(data.hourlyRate || 0).toFixed(2)}/hr (${data.tierApplied}) — Total: $${Number(data.totalCharge || 0).toFixed(2)}`,
      });
      setShiftActive(false);
      setShiftStartTimestamp(0);
      setShiftStartTime("");
      setShiftNotes("");
      setElapsed("00:00:00");
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to end shift.", variant: "destructive" });
    },
  });

  const startShift = () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setShiftStartTimestamp(Date.now());
    setShiftStartTime(time);
    setShiftActive(true);
  };

  return (
    <Card className="overflow-hidden" data-testid="card-shift-manager">
      <div className="bg-gradient-to-r from-[#2EAA6E] to-[#25905D] px-5 py-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Clock className="w-4 h-4" /> Shift Management
        </h3>
      </div>
      <div className="p-5 space-y-3">
        {!shiftActive ? (
          <Button
            className="w-full gap-2"
            onClick={startShift}
            data-testid="button-start-shift"
          >
            <Clock className="w-4 h-4" /> Start Shift with {workerName}
          </Button>
        ) : (
          <>
            <div className="text-center">
              <div className="text-3xl font-mono font-black tracking-wider" data-testid="text-shift-timer" role="timer" aria-label="Shift duration">
                {elapsed}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Started at {shiftStartTime}</p>
            </div>
            <div>
              <Label htmlFor="shift-notes" className="text-xs font-semibold">Shift Notes</Label>
              <Textarea
                id="shift-notes"
                className="mt-1 resize-none"
                placeholder="Log activities performed during this shift..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                data-testid="input-shift-notes"
              />
            </div>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => endShift.mutate()}
              disabled={endShift.isPending}
              data-testid="button-end-shift"
            >
              {endShift.isPending ? "Ending..." : "End Shift"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function ReviewsList({ workerId }: { workerId: string }) {
  const { data: reviewsData, isLoading } = useQuery<(Review & { participant?: User })[]>({
    queryKey: ["/api/workers", workerId, "reviews"],
  });

  if (isLoading) {
    return <Card className="p-5"><Skeleton className="h-24 w-full" /></Card>;
  }

  if (!reviewsData?.length) {
    return (
      <Card className="p-5 text-center text-sm text-muted-foreground" data-testid="card-no-reviews">
        No reviews yet. Be the first to leave feedback.
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="list-reviews">
      {reviewsData.map((review) => (
        <Card key={review.id} className="p-4" data-testid={`card-review-${review.id}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-bold text-sm">{review.participant?.fullName || "Participant"}</span>
              <div className="flex gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-AU") : ""}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function WorkerDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [showBooking, setShowBooking] = useState(false);

  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });

  const { data: worker, isLoading } = useQuery<Worker & { user?: User }>({
    queryKey: ["/api/workers", params.id],
  });

  usePageTitle(worker?.user?.fullName ? `${worker.user.fullName} | Book a Carer` : "Worker Detail");

  const createBooking = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings", {
        participantId: me?.id || "demo-participant",
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

              {worker.transportCapable && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-1">
                      <Car className="w-3 h-3" /> Vehicle Details
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs">{worker.transportType || "Car"}</Badge>
                      {worker.wheelchairAccessible && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Accessibility className="w-3 h-3" /> Wheelchair Accessible
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div>
            <h2 className="text-lg font-black tracking-tight mb-3" data-testid="text-reviews-heading">Reviews</h2>
            <ReviewsList workerId={params.id!} />
          </div>
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

          <VerificationChecklist worker={worker} />

          {me && (
            <ShiftManager
              workerId={params.id!}
              participantId={me.id}
              workerName={worker.user?.fullName?.split(" ")[0] || "Worker"}
            />
          )}

          <Link href="/shifts">
            <Button variant="outline" className="w-full gap-2 text-xs" data-testid="link-view-shifts">
              <Calendar className="w-3 h-3" /> View Shift Schedule
            </Button>
          </Link>

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
                  <Label htmlFor="booking-date" className="text-xs font-semibold">Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="booking-date"
                      type="date"
                      className="pl-9"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      data-testid="input-booking-date"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="booking-time" className="text-xs font-semibold">Time</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="booking-time"
                      type="time"
                      className="pl-9"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      data-testid="input-booking-time"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="booking-notes" className="text-xs font-semibold">Notes</Label>
                  <Textarea
                    id="booking-notes"
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

          {me && <ReviewForm workerId={params.id!} participantId={me.id} />}
        </div>
      </div>
    </div>
  );
}
