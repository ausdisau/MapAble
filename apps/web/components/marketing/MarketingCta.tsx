import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function MarketingCta() {
  return (
    <section
      aria-labelledby="marketing-cta-heading"
      className="bg-primary py-14 text-white sm:py-16"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="marketing-cta-heading"
            className="mb-4 font-heading text-2xl font-bold md:text-3xl"
          >
            Ready to get started with MapAble?
          </h2>
          <p className="mb-6 text-white/80">
            Find verified providers, book services, and manage your NDIS journey
            in one place.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="default"
              size="lg"
              className="h-12 rounded-lg bg-white px-6 text-primary hover:bg-white/90"
              asChild
            >
              <Link href="/register">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-lg border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/provider-finder">Find providers</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
