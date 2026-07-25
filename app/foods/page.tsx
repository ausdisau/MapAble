import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { enforceYearOneModulePath } from "@/lib/year-one/deferred-module-gate";

export const metadata = {
  title: "MapAble Foods | Meals and grocery support",
  description:
    "Learn how MapAble Foods will handle meal, grocery and delivery workflows with privacy-safe dietary and allergy information.",
};

export default function FoodsModulePage() {
  enforceYearOneModulePath("/foods");

  return (
    <PublicModulePage
      eyebrow="MapAble Foods"
      title="Meal and grocery support with sensitive dietary information protected."
      description="MapAble Foods is planned for meal, grocery and delivery workflows that separate food, preparation, delivery and support line items."
      whoFor={[
        "Participants who need meal, grocery or delivery support options.",
        "Vendors preparing accessible ordering and fulfilment workflows.",
        "Drivers and support workers handling delivery with need-to-know details.",
      ]}
      availableNow={[
        "Public module information and pilot enquiry pathway.",
        "High-level explanation of privacy safeguards for dietary information.",
        "Provider discovery links for related support services.",
      ]}
      comingSoon={[
        "Catalogue, cart and checkout prototypes for controlled pilots.",
        "Allergy and dietary preferences with restricted access.",
        "Vendor dashboard, delivery tracking and confirmation/dispute flow.",
      ]}
      safetyNote="Allergy, dietary and delivery information is sensitive. MapAble will not claim groceries or meals are automatically NDIS funded, and exact delivery addresses will only be used for fulfilment."
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={{ label: "Contact MapAble", href: "/contact" }}
    />
  );
}
