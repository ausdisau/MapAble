import Link from "next/link";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata = {
  title: "Access and Inclusion is the real AI | MapAble",
  description: "A disability-led commitment to evidence-based access, accessible participation and choice.",
};

const pathways = [
  {
    title: "MapAble Access",
    text: "Find and compare specific access features and evidence without treating a single rating as a universal guarantee.",
    href: "/access",
    action: "Explore accessibility information",
  },
  {
    title: "Community Accessibility Survey",
    text: "Contribute a voluntary observation about a public place or journey. Reports require consent and review.",
    href: "/access/community-survey",
    action: "Contribute to the community pilot",
  },
  {
    title: "Trust and Inclusion Index",
    text: "A separate research proposal about NDIS services and participation. Recruitment is not yet open.",
    href: "/research/trust-inclusion",
    action: "View research status",
  },
];

export default function AccessInclusionPage() {
  return (
    <MapAbleCareMarketingShell>
      <main className="bg-white text-[#112D51]">
        <header className="border-b border-slate-200 bg-[#F3F7FB] px-5 py-16 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="font-bold uppercase tracking-wider text-[#005B7F]">
              Australian Disability Ltd × MapAble
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Access and Inclusion is the real AI
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-relaxed">
              Useful intelligence helps people exercise choice, communicate in their
              own ways and fully participate in community life. Disabled people
              should shape both the evidence and the decisions.
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-6xl space-y-10 px-5 py-12 md:px-8">
          <section aria-labelledby="pathways-heading">
            <h2 id="pathways-heading" className="text-2xl font-bold">Explore and participate</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {pathways.map((item) => (
                <article key={item.href} className="rounded-2xl border border-slate-300 p-5">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-base text-slate-700">{item.text}</p>
                  <Link href={item.href}
                    className="mt-5 inline-flex min-h-11 items-center font-semibold text-[#153B72] underline underline-offset-4 focus-visible:outline focus-visible:outline-4">
                    {item.action}
                  </Link>
                </article>
              ))}
            </div>
          </section>
          <section aria-labelledby="palsypod-heading" className="rounded-2xl bg-[#F3F7FB] p-6">
            <h2 id="palsypod-heading" className="text-2xl font-bold">PalsyPod: access in real life</h2>
            <p className="mt-3 text-base">
              PalsyPod is a planned disability-led podcast about cerebral palsy
              across medical, personal and political perspectives. A proposed
              episode can explore barriers, AAC and meaningful inclusion with
              separately consenting guests. Survey responses are not podcast permissions.
            </p>
            <p className="mt-3 text-sm font-semibold">Editorial concept only; no published episode is implied.</p>
          </section>
          <section aria-labelledby="rights-heading">
            <h2 id="rights-heading" className="text-2xl font-bold">Rights and accountability</h2>
            <p className="mt-3 max-w-4xl text-base">
              Australian Disability Ltd's proposed Protect Our NDIS campaign
              centres choice, participation, communication access and accountable
              decision-making. Its policy claims require source checks before
              publication. Survey data must not be transferred into advertising
              or Mailchimp contact targeting.
            </p>
          </section>
        </div>
      </main>
    </MapAbleCareMarketingShell>
  );
}
