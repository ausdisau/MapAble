import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Send, MapPin, Sparkles, X, Layers as LayersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MapView, type MapViewHandle } from "@/features/geo/MapView";
import { DomainTabBar } from "@/features/geo/DomainTabBar";
import { useLayers, usePersonalPlaces } from "@/features/geo/hooks";
import { geoApi } from "@/features/geo/api";
import type { GeoDomain, GeocodeResult, MapFeature } from "@/features/geo/types";

interface ChatMsg { role: "user" | "assistant"; content: string; }

export default function AccessibilityMapPage() {
  const { toast } = useToast();
  const mapRef = useRef<MapViewHandle>(null);
  const [domain, setDomain] = useState<GeoDomain>("accessibility");
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(new Set());
  const [bbox, setBbox] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [geoResults, setGeoResults] = useState<GeocodeResult[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Accessibility Map | MapAble 4.0";
  }, []);

  const { data: layers = [], isLoading: layersLoading } = useLayers(domain);
  const { data: personalPlaces = [] } = usePersonalPlaces();

  // Default-visible layers when domain/layers change
  useEffect(() => {
    if (layers.length === 0) return;
    setVisibleLayerIds(new Set(layers.filter((l) => l.defaultVisible).map((l) => l.id)));
  }, [layers]);

  // Debounce feature search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const layerIds = useMemo(() => layers.map((l) => l.id), [layers]);

  const { data: features = [], isLoading: featuresLoading } = useQuery<MapFeature[]>({
    queryKey: ["/api/geo/features", layerIds.slice().sort().join(","), debouncedSearch],
    queryFn: () => geoApi.getFeatures({ layerIds, q: debouncedSearch || undefined, limit: 3000 }),
    enabled: layerIds.length > 0,
  });

  const toggleLayer = (id: string) => {
    setVisibleLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGeocode = async () => {
    if (!search.trim()) return;
    try {
      const results = await geoApi.geocode(search.trim());
      setGeoResults(results);
      if (results[0]) mapRef.current?.flyTo(results[0].lat, results[0].lng, 14);
    } catch {
      toast({ title: "Search failed", description: "Could not look up that location.", variant: "destructive" });
    }
  };

  const visibleFeatureCount = features.filter((f) => visibleLayerIds.has(f.layerId)).length;

  return (
    <div className="flex flex-col h-full" data-testid="page-accessibility-map">
      <div className="px-4 pt-4 pb-2 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <MapPin className="w-6 h-6 text-[#1B6EB5]" /> Accessibility Map
            </h1>
            <p className="text-sm text-muted-foreground">Explore accessible places, parking, lifts and routes.</p>
          </div>
          <DomainTabBar active={domain} onChange={setDomain} />
        </div>
        <div className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleGeocode(); }}
              placeholder="Search places or features..."
              className="pl-9"
              data-testid="input-map-search"
            />
          </div>
          <Button onClick={handleGeocode} data-testid="button-map-search">Go</Button>
        </div>
        {geoResults.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="geocode-results">
            {geoResults.slice(0, 4).map((r, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover-elevate"
                onClick={() => mapRef.current?.flyTo(r.lat, r.lng, 15)}
                data-testid={`geocode-result-${i}`}
              >
                <MapPin className="w-3 h-3 mr-1" /> {r.name.split(",").slice(0, 2).join(",")}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setGeoResults([])} data-testid="button-clear-geocode"><X className="w-3 h-3" /></Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Layers sidebar */}
        <aside className="w-64 border-r flex flex-col shrink-0 hidden md:flex" aria-label="Map layers" data-testid="sidebar-layers">
          <div className="p-3 border-b flex items-center gap-2 text-sm font-semibold">
            <LayersIcon className="w-4 h-4" /> Layers
            <Badge variant="outline" className="ml-auto" data-testid="badge-feature-count">{visibleFeatureCount}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {layersLoading && <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
              {!layersLoading && layers.length === 0 && <div className="p-3 text-sm text-muted-foreground">No layers in this domain yet.</div>}
              {layers.map((l) => (
                <label
                  key={l.id}
                  className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer text-sm"
                  data-testid={`layer-toggle-${l.slug}`}
                >
                  <Checkbox
                    checked={visibleLayerIds.has(l.id)}
                    onCheckedChange={() => toggleLayer(l.id)}
                    data-testid={`checkbox-layer-${l.slug}`}
                  />
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color || "#1B6EB5" }} />
                  <span className="flex-1 leading-tight">{l.name}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
          {personalPlaces.length > 0 && (
            <div className="p-3 border-t text-xs text-muted-foreground">
              <span className="font-semibold text-[#E6A817]">My places:</span> {personalPlaces.length} saved
            </div>
          )}
        </aside>

        {/* Map */}
        <div className="flex-1 relative min-w-0" id="map-panel" role="tabpanel" aria-labelledby={`domain-tab-${domain}`}>
          {featuresLoading && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[500] bg-background/90 px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow" data-testid="status-loading-features">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading features…
            </div>
          )}
          <MapView
            ref={mapRef}
            layers={layers}
            features={features}
            visibleLayerIds={visibleLayerIds}
            personalPlaces={personalPlaces}
            highlightFeatureId={highlightId}
            onMoveEnd={setBbox}
          />
        </div>

        {/* AI Explorer */}
        <AIExplorerPanel
          mapRef={mapRef}
          bbox={bbox}
          activeDomain={domain}
          visibleLayerIds={Array.from(visibleLayerIds)}
          layersBySlug={useMemo(() => new Map(layers.map((l) => [l.slug, l.id])), [layers])}
          onSetDomain={setDomain}
          onToggleLayer={(layerId, visible) => {
            setVisibleLayerIds((prev) => {
              const next = new Set(prev);
              if (visible) next.add(layerId); else next.delete(layerId);
              return next;
            });
          }}
          onHighlight={setHighlightId}
        />
      </div>
    </div>
  );
}

function AIExplorerPanel(props: {
  mapRef: React.RefObject<MapViewHandle>;
  bbox: string;
  activeDomain: GeoDomain;
  visibleLayerIds: string[];
  layersBySlug: Map<string, string>;
  onSetDomain: (d: GeoDomain) => void;
  onToggleLayer: (layerId: string, visible: boolean) => void;
  onHighlight: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I can help you find accessible places. Try \"show accessible parking near me\" or \"switch to transport\"." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setSending(true);
    try {
      const bboxArr = props.mapRef.current?.getBboxArray();
      const res = await geoApi.ai({
        message: msg,
        bbox: bboxArr,
        activeDomain: props.activeDomain,
        visibleLayerIds: props.visibleLayerIds,
      });
      for (const action of res.actions || []) {
        if (action.type === "setDomain" && action.domain) props.onSetDomain(action.domain);
        if (action.type === "toggleLayer" && action.layerId) props.onToggleLayer(action.layerId, action.visible ?? true);
        if (action.type === "flyTo" && typeof action.lat === "number" && typeof action.lng === "number") {
          props.mapRef.current?.flyTo(action.lat, action.lng, action.zoom ?? 15);
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: res.reply || "Done." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't process that right now." }]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="absolute bottom-6 right-6 z-[600] rounded-full shadow-lg gap-2 bg-[#1B6EB5] hover:bg-[#14578F]"
        data-testid="button-open-ai-explorer"
      >
        <Sparkles className="w-4 h-4" /> AI Explorer
      </Button>
    );
  }

  return (
    <aside className="w-80 border-l flex flex-col shrink-0 bg-background" aria-label="AI map explorer" data-testid="panel-ai-explorer">
      <div className="p-3 border-b flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#1B6EB5]" />
        <span className="font-semibold text-sm">AI Explorer</span>
        <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setOpen(false)} data-testid="button-close-ai-explorer"><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-3 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg px-3 py-2 ${m.role === "user" ? "bg-[#1B6EB5] text-white ml-6" : "bg-muted mr-6"}`}
              data-testid={`ai-message-${m.role}-${i}`}
            >
              {m.content}
            </div>
          ))}
          {sending && <div className="text-sm text-muted-foreground flex items-center gap-2 mr-6"><Loader2 className="w-3 h-3 animate-spin" /> Thinking…</div>}
        </div>
      </ScrollArea>
      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask about the map…"
          disabled={sending}
          data-testid="input-ai-explorer"
        />
        <Button size="icon" onClick={send} disabled={sending || !input.trim()} data-testid="button-send-ai-explorer"><Send className="w-4 h-4" /></Button>
      </div>
    </aside>
  );
}
