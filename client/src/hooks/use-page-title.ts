import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | MapAble 4.0` : "MapAble 4.0 - NDIS Support Services Platform";
  }, [title]);
}
