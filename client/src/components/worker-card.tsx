import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, MapPin, Star, Car, Accessibility, ArrowRight } from "lucide-react";
import type { Worker, User } from "@shared/schema";
import { Link } from "wouter";

interface WorkerCardProps {
  worker: Worker & { user?: User };
}

export function WorkerCard({ worker }: WorkerCardProps) {
  const initials = worker.user?.fullName
    ? worker.user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "SW";

  return (
    <Card className="group relative flex flex-col hover-elevate overflow-visible shadow-md">
      <div className="relative h-44 rounded-t-md bg-gradient-to-br from-[#D4EAF7] to-[#E8F0F8] dark:from-[#1a3a5c] dark:to-[#1e2d42] flex items-center justify-center">
        <Avatar className="w-22 h-22 border-4 border-background shadow-lg">
          <AvatarImage src={worker.photo || undefined} alt={worker.user?.fullName || "Worker"} />
          <AvatarFallback className="text-2xl font-black bg-primary/15 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        {worker.ndisVerified && (
          <div className="absolute top-3 right-3">
            <Badge className="gap-1.5 bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500 font-semibold no-default-hover-elevate no-default-active-elevate">
              <ShieldCheck className="w-3.5 h-3.5" />
              NDIS Verified
            </Badge>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-black text-lg leading-tight" data-testid={`text-worker-name-${worker.id}`}>
            {worker.user?.fullName || "Support Worker"}
          </h3>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {worker.user?.location || "Australia"}
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{worker.title}</p>

        <div className="flex flex-wrap gap-1.5">
          {worker.specializations?.slice(0, 3).map((spec, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {spec}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          {worker.transportCapable && (
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Transport
            </span>
          )}
          {worker.wheelchairAccessible && (
            <span className="flex items-center gap-1">
              <Accessibility className="w-3.5 h-3.5" /> Accessible
            </span>
          )}
          {worker.rating && Number(worker.rating) > 0 && (
            <span className="flex items-center gap-1 ml-auto font-semibold">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {Number(worker.rating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Link href={`/care/${worker.id}`} className="flex-1">
            <Button
              className="w-full gap-1.5 bg-gradient-to-r from-[#14578F] to-[#1B6EB5] text-white border-primary-border"
              size="sm"
              data-testid={`button-view-worker-${worker.id}`}
            >
              View Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href={`/care/${worker.id}/book`}>
            <Button variant="secondary" size="sm" data-testid={`button-book-worker-${worker.id}`}>
              Book
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
