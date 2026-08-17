import { PEERS_CONTRAST } from "@/lib/community/mapable-peers/copy";

export function PeersContrastTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th scope="col" className="px-4 py-3 font-semibold">
              Dimension
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
              Additive feed logic
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-primary">
              MapAble PEERS
            </th>
          </tr>
        </thead>
        <tbody>
          {PEERS_CONTRAST.map((row) => (
            <tr key={row.title} className="border-b border-border/60 last:border-0">
              <th scope="row" className="px-4 py-3 align-top font-medium">
                {row.title}
              </th>
              <td className="px-4 py-3 align-top text-muted-foreground">{row.feed}</td>
              <td className="px-4 py-3 align-top">{row.peers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
