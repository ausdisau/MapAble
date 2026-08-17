import type { ReactNode } from "react";

export function CommunicationCentreShell({
  sidebar,
  main,
  info,
}: {
  sidebar: ReactNode;
  main: ReactNode;
  info?: ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_240px]">
      <aside aria-label="Inbox">{sidebar}</aside>
      <main className="min-h-[400px]">{main}</main>
      {info ? <aside aria-label="Conversation details">{info}</aside> : null}
    </div>
  );
}
