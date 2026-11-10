import { PUBLIC_RESOURCE_LINKS, normalisePublicQuery, searchPublicDisapedia } from "@/lib/locallinks/public-knowledge-bridge";

export const metadata = {
  title: "LocalLinks | Accessible reading and disability knowledge",
  description: "Explore Australian Disapedia and AccessiBooks using source-attributed, participant-first links.",
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function LocalLinksPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = normalisePublicQuery(params.q);
  const search = query.length >= 2 ? await searchPublicDisapedia(query) : null;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">MapAble LocalLinks</h1>
        <p className="max-w-3xl text-lg">
          Find disability-led knowledge and accessible reading resources.
          You decide which external service to open; MapAble does not share your profile or location.
        </p>
      </header>

      <section aria-labelledby="resources-heading" className="space-y-4">
        <h2 id="resources-heading" className="text-2xl font-semibold">Connected resources</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PUBLIC_RESOURCE_LINKS.map((site) => (
            <article key={site.id} className="rounded-xl border p-5">
              <h3 className="text-xl font-semibold">{site.title}</h3>
              <p className="mt-2">{site.description}</p>
              <p className="mt-2 text-sm">External site · Availability and content are controlled by its publisher</p>
              <a className="mt-4 inline-block rounded-md px-3 py-3 font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2"
                 href={site.href} rel="noopener noreferrer">
                Visit {site.title} (external site)
              </a>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="wiki-search-heading" className="space-y-4">
        <h2 id="wiki-search-heading" className="text-2xl font-semibold">Search Australian Disapedia</h2>
        <p>Search text is sent to the public MediaWiki only when live search is enabled.
           No account details, precise location, or accessibility profile are included.</p>
        <form method="get" action="/locallinks" className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="disapedia-query" className="font-medium sm:self-center">Topic</label>
          <input id="disapedia-query" name="q" defaultValue={query} maxLength={120}
                 placeholder="e.g. disability rights" className="min-h-12 min-w-0 flex-1 rounded-md border px-3 py-2"
                 autoComplete="off" />
          <button type="submit" className="min-h-12 rounded-md border px-5 py-3 font-semibold focus-visible:outline focus-visible:outline-4">
            Search
          </button>
        </form>
        {search?.status === "disabled" && <p role="status">Live wiki search is not yet enabled. Use the direct Disapedia link above.</p>}
        {search?.status === "unavailable" && <p role="status">The public wiki could not be reached. No results were inferred. You can open Disapedia directly.</p>}
        {search?.status === "ok" && (
          <div aria-live="polite" className="space-y-3">
            <p>{search.results.length} article(s) returned by Australian Disapedia.</p>
            <ul className="space-y-3">
              {search.results.map((item) => (
                <li key={item.pageId} className="rounded-lg border p-4">
                  <a href={item.url} rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                    {item.title} (external article)
                  </a>
                  <p className="text-sm">
                    Source: Australian Disapedia
                    {item.revisionId ? " · Revision " + item.revisionId : " · Revision not supplied"}
                    {item.revisionTimestamp ? " · " + item.revisionTimestamp : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <aside className="rounded-lg border p-4" aria-label="Important information">
        <p>Disapedia articles are editorial information, not authoritative legal decisions.
           AccessiBooks catalogue availability, rights clearance, and subscriptions are not verified through this page.
           For legal entitlements, check the original current legislation and relevant official agency.</p>
      </aside>
    </main>
  );
}
