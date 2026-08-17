import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { mapableSectionCardClass } from "@/lib/brand/styles";

const VALUE_STATS = [
  {
    value: "4",
    label: "funding pathways visible before enquiry",
  },
  {
    value: "5",
    label: "access filters designed around real support needs",
  },
  {
    value: "1",
    label: "combined list, map and guidance experience",
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: "1",
    title: "Search with context",
    description:
      "Tell us what support you need, where you are, and any access or funding requirements up front.",
  },
  {
    step: "2",
    title: "Compare with confidence",
    description:
      "See availability signals, response times, and NDIS registration before you reach out.",
  },
  {
    step: "3",
    title: "Take the next step",
    description:
      "View profiles, compare providers, or ask MapAble for guidance on your options.",
  },
] as const;

export function MapAbleCareCombinedSections() {
  return (
    <>
      <section className="container mx-auto max-w-6xl px-4 py-12" aria-labelledby="value-stats">
        <h2 id="value-stats" className="sr-only">
          Why MapAble Provider Finder
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {VALUE_STATS.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                mapableSectionCardClass,
                "flex flex-col items-start gap-2 p-6 sm:p-8",
              )}
            >
              <span className="font-heading text-5xl font-bold text-primary sm:text-6xl">
                {stat.value}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-border/50 bg-muted/30 py-14"
        aria-labelledby="guided-journey-heading"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Guided support journey
            </p>
            <h2
              id="guided-journey-heading"
              className="mt-2 font-heading text-2xl font-bold sm:text-3xl"
            >
              From search to support, without the guesswork
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for participants, families and coordinators who need clarity
              before they commit — not another generic directory.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {JOURNEY_STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button variant="default" asChild size="lg">
              <Link href="/ask">Ask MapAble</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/provider-finder">Find support</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">List your service</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
