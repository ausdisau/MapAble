import Link from "next/link";

const PARTICIPANT_LINKS = [
  { href: "/transport", label: "Overview", exact: true },
  { href: "/transport/request", label: "Request trip" },
  { href: "/transport/profile", label: "Access profile" },
  { href: "/transport/dashboard", label: "My trips" },
] as const;

export function TransportWorkspaceNav({
  activeHref,
}: {
  activeHref?: string;
}) {
  return (
    <nav
      aria-label="Transport participant navigation"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 py-3 lg:px-8">
        {PARTICIPANT_LINKS.map((link) => {
          const exact = "exact" in link && link.exact === true;
          const isActive = exact
            ? activeHref === link.href
            : activeHref === link.href ||
              (activeHref?.startsWith(`${link.href}/`) ?? false);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F] ${
                isActive
                  ? "bg-[#005B7F] text-white"
                  : "text-[#005B7F] hover:bg-[#F6FBFC]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
