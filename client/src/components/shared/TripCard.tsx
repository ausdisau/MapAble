import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/shared/StatusBadge";
import { MapPin, ArrowRight, Calendar, Clock, Accessibility, Map as MapIcon } from "lucide-react";
import { TransportRouteMap } from "@/features/geo/TransportRouteMap";
import type { TransportRequest } from "@shared/schema";

const statusTone: Record<string, StatusTone> = {
  requested: "pending",
  accepted: "info",
  in_transit: "info",
  completed: "success",
  cancelled: "destructive",
};

interface TripCardProps {
  request: TransportRequest;
}

export function TripCard({ request: r }: TripCardProps) {
  const [showMap, setShowMap] = useState(false);
  return (
    <Card className="p-4 hover-elevate" data-testid={`card-request-${r.id}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-primary" />
            {r.pickupLocation}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <ArrowRight className="w-3 h-3 text-brand-teal" />
            {r.dropoffLocation}
          </div>
        </div>
        <StatusBadge label={r.status.replace("_", " ")} tone={statusTone[r.status] ?? "neutral"} />
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
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 ml-auto text-xs gap-1"
          onClick={() => setShowMap((v) => !v)}
          data-testid={`button-toggle-route-${r.id}`}
        >
          <MapIcon className="w-3 h-3" /> {showMap ? "Hide map" : "Show on map"}
        </Button>
      </div>
      {showMap && <TransportRouteMap pickup={r.pickupLocation} dropoff={r.dropoffLocation} />}
    </Card>
  );
}
