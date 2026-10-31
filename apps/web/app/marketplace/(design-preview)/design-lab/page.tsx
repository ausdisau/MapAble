import { CommerceDesignLab } from "@/components/marketplace/commerce-design-lab/CommerceDesignLab";

export const metadata = {
  title: "Commerce design lab | MapAble Marketplace",
  description:
    "Authenticated synthetic UI for accessible, evidence-first commerce research. No live sellers or checkout.",
  robots: { index: false, follow: false },
};

/** Inherits requireAuth + independently default-off design-preview flag. */
export default function CommerceDesignLabPage() {
  return <CommerceDesignLab />;
}
