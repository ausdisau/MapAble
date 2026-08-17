import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Accessibility statement | MapAble",
  description:
    "MapAble accessibility statement and current WCAG testing status.",
  alternates: canonicalAlternate("/accessibility-statement"),
};

export default function AccessibilityStatementPage() {
  return (
    <PublicInfoPage
      eyebrow="Accessibility"
      title="Accessibility statement"
      description="MapAble is designed toward WCAG 2.2 AA accessibility, with formal testing pending before any compliance claim is made."
      ctaLabel="Send accessibility feedback"
      ctaHref="/contact"
      sections={[
        {
          title: "Current status",
          content: (
            <p>
              The public website uses semantic HTML, keyboard-focus styles,
              responsive layouts and accessible loading/error states. Formal
              WCAG 2.2 AA testing has not yet been completed, so MapAble does
              not claim conformance at this stage.
            </p>
          ),
        },
        {
          title: "Design targets",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Keyboard-accessible navigation and controls.</li>
              <li>Visible focus states and sufficient text contrast.</li>
              <li>Clear headings, labels and status messages.</li>
              <li>Mobile-responsive layouts and touch-friendly controls.</li>
            </ul>
          ),
        },
        {
          title: "Known work remaining",
          content: (
            <p>
              Map, dashboard and workflow-heavy screens require additional
              assistive technology testing, manual keyboard checks and
              user-centred accessibility review before production launch.
            </p>
          ),
        },
        {
          title: "Feedback",
          content: (
            <p>
              If a page is difficult to use with a screen reader, keyboard,
              switch control, magnification, captions, colour settings or
              another access technology, contact MapAble so the issue can be
              recorded and prioritised.
            </p>
          ),
        },
      ]}
    />
  );
}
