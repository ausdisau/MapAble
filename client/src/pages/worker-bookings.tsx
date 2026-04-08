import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { Redirect } from "wouter";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  MapPin,
  Calendar,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import type { Booking } from "@shared/schema";

type EnrichedBooking = Booking & {
  participant: { id: string; fullName: string; email: string; location: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function WorkerBookings() {
  usePageTitle("My Bookings | MapAble");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery<EnrichedBooking[]>({
    queryKey: ["/api/worker/bookings"],
    enabled: user?.role === "carer",
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/worker/bookings/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker/dashboard"] });
      toast({
        title: variables.status === "confirmed" ? "Booking accepted" : "Booking declined",
        description: variables.status === "confirmed"
          ? "The participant has been notified."
          : "The booking has been declined.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update booking status.", variant: "destructive" });
    },
  });

  if (user && user.role !== "carer") {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="worker-bookings-loading">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const allBookings = bookings || [];
  const pendingBookings = allBookings.filter(b => b.status === "pending");
  const confirmedBookings = allBookings.filter(b => b.status === "confirmed" || b.status === "in_progress");
  const pastBookings = allBookings.filter(b => b.status === "completed" || b.status === "cancelled");

  const renderBookingCard = (booking: EnrichedBooking, showActions: boolean) => (
    <Card key={booking.id} className="p-5" data-testid={`booking-card-${booking.id}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[booking.status] || ""}>
              {booking.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline">{booking.serviceType}</Badge>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {booking.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {booking.startTime}{booking.endTime ? ` – ${booking.endTime}` : ""}
            </span>
          </div>

          {booking.participant && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                {booking.participant.fullName}
              </span>
              {booking.participant.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {booking.participant.location}
                </span>
              )}
            </div>
          )}

          {booking.notes && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">{booking.notes}</p>
          )}

          {booking.totalCost && (
            <p className="text-sm font-medium">${Number(booking.totalCost).toFixed(2)}</p>
          )}
        </div>

        {showActions && booking.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-[#2EAA6E] hover:bg-[#259D61] gap-1"
              onClick={() => statusMutation.mutate({ id: booking.id, status: "confirmed" })}
              disabled={statusMutation.isPending}
              data-testid={`button-accept-${booking.id}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 gap-1"
              onClick={() => statusMutation.mutate({ id: booking.id, status: "cancelled" })}
              disabled={statusMutation.isPending}
              data-testid={`button-decline-${booking.id}`}
            >
              <XCircle className="w-3.5 h-3.5" /> Decline
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6" data-testid="worker-bookings">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-bookings-heading">
          <ClipboardList className="w-6 h-6 text-[#1B6EB5]" /> My Bookings
        </h1>
        {pendingBookings.length > 0 && (
          <Badge className="bg-[#E6A817]/10 text-[#E6A817] border-[#E6A817]/30">
            {pendingBookings.length} pending
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending">
        <TabsList data-testid="tabs-booking-status">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({confirmedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingBookings.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-pending">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No pending bookings to review.</p>
            </Card>
          ) : (
            pendingBookings.map(b => renderBookingCard(b, true))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-4">
          {confirmedBookings.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-active">
              <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active bookings.</p>
            </Card>
          ) : (
            confirmedBookings.map(b => renderBookingCard(b, false))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {pastBookings.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-past">
              <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No past bookings yet.</p>
            </Card>
          ) : (
            pastBookings.map(b => renderBookingCard(b, false))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
