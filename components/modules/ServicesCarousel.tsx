"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useBrandSafe } from "@/app/contexts/BrandContext";
import { modules, type MapAbleModule } from "@/app/lib/modules";
import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { moduleAccentClass } from "@/lib/brand/module-accents";

interface ServiceSlideProps {
  module: MapAbleModule;
}

function ServiceSlide({ module }: ServiceSlideProps) {
  const { iconStyle } = useBrandSafe();
  const currentLogo = module.icons?.[iconStyle] || module.logo;
  const accent = moduleAccentClass(module.accent);

  return (
    <Link href={module.href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Card
          className={cn(
            "h-full cursor-pointer overflow-hidden border-2 border-transparent bg-gradient-to-br from-background to-muted/30 transition-all hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
            accent.cardHoverClass,
          )}
          data-testid={`carousel-card-${module.key}`}
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className={cn("rounded-2xl p-4 shadow-sm", accent.iconWrapClass)}>
                <img
                  src={currentLogo}
                  alt={module.name}
                  className="h-14 w-14 object-contain drop-shadow"
                />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold">
                  {module.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {module.tagline}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm flex-1 mb-4">
              {module.description}
            </p>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {module.features.map((feature) => (
                <Badge
                  key={feature}
                  variant="secondary"
                  className={cn("px-2 py-0.5 text-xs", accent.badgeClass)}
                >
                  {feature}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-end">
              <motion.div
                className={cn("flex items-center gap-1 text-sm font-medium", accent.linkClass)}
                whileHover={{ x: 4 }}
              >
                Explore
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function AccessiViewSlide() {
  return (
    <Link href="/venues">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Card
          className="h-full cursor-pointer overflow-hidden border-2 border-transparent bg-gradient-to-br from-background to-muted/30 transition-all hover:border-primary/25 hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          data-testid="carousel-card-accessiview"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 p-4 shadow-sm">
                <Eye className="h-14 w-14 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold">AccessiView</h3>
                <p className="text-sm text-muted-foreground">
                  Virtual Venue Tours
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm flex-1 mb-4">
              Experience 360° virtual tours of accessible venues before you
              visit. Check accessibility features and plan your route with
              confidence.
            </p>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {[
                "360° Tours",
                "VR Support",
                "Route Planning",
                "Accessibility Info",
              ].map((feature) => (
                <Badge
                  key={feature}
                  variant="secondary"
                  className="border-transparent bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {feature}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-end">
              <motion.div
                className="flex items-center gap-1 text-sm font-medium text-primary"
                whileHover={{ x: 4 }}
              >
                Explore
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export function ServicesCarousel() {
  const [isPlaying, setIsPlaying] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      skipSnaps: false,
      dragFree: false,
    },
    [
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    ]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [_canScrollPrev, setCanScrollPrev] = useState(false);
  const [_canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const toggleAutoplay = useCallback(() => {
    const autoplay = emblaApi?.plugins()?.autoplay;
    if (!autoplay) return;

    if (autoplay.isPlaying()) {
      autoplay.stop();
      setIsPlaying(false);
    } else {
      autoplay.play();
      setIsPlaying(true);
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const autoplay = emblaApi.plugins()?.autoplay;
    if (autoplay) {
      setIsPlaying(autoplay.isPlaying());
      emblaApi.on("autoplay:play", () => setIsPlaying(true));
      emblaApi.on("autoplay:stop", () => setIsPlaying(false));
    }

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div
      className="relative"
      data-testid="services-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="MapAble services"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4" role="group" aria-label="Slides">
          {modules.map((module) => (
            <div
              key={module.key}
              className="flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
            >
              <ServiceSlide module={module} />
            </div>
          ))}
          <div className="flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
            <AccessiViewSlide />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAutoplay}
            className="rounded-full h-11 w-11"
            data-testid="carousel-autoplay"
            aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="rounded-full h-11 w-11"
            data-testid="carousel-prev"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="rounded-full h-11 w-11"
            data-testid="carousel-next"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="flex gap-2"
          data-testid="carousel-dots"
          role="tablist"
          aria-label="Carousel navigation"
        >
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                index === selectedIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-3"
              )}
              data-testid={`carousel-dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === selectedIndex}
              role="tab"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
