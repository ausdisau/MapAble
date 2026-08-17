import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

const CARE_JOURNEY_STEPS = [
  {
    step: "1",
    title: "Describe your needs",
    description:
      "Tell us what support you want in plain language — no technical forms.",
  },
  {
    step: "2",
    title: "Review your draft plan",
    description:
      "Check the summary and tasks. Nothing is sent to providers until you confirm.",
  },
  {
    step: "3",
    title: "Confirm and track",
    description:
      "Save your request, then manage bookings and service logs in one place.",
  },
] as const;

export function CareJourneyStrip({ className }: { className?: string }) {
  return (
    <section aria-labelledby="care-journey-heading" className={className}>
      <div className="mb-6 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          How it works
        </p>
        <h2
          id="care-journey-heading"
          className="mt-2 font-heading text-2xl font-bold"
        >
          A simple path to the right support
        </h2>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {CARE_JOURNEY_STEPS.map((item) => (
          <li
            key={item.step}
            className={cn(mapableSectionCardClass, "flex flex-col gap-2 p-5")}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
              aria-hidden
            >
              {item.step}
            </span>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
