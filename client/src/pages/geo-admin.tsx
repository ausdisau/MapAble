import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Layers as LayersIcon, MapPin, Upload, Tags, History, Trash2, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { geoApi } from "@/features/geo/api";
import { useLayers, useCategories } from "@/features/geo/hooks";
import { DOMAIN_LABELS, type GeoDomain, type MapLayer, type MapCategory, type MapFeature } from "@/features/geo/types";

const DOMAINS: GeoDomain[] = ["accessibility", "care", "transport", "employment"];

export default function GeoAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Geo Management | MapAble 4.0";
  }, []);

  if (authLoading) {
    return <div className="flex items-center justify-center h-full" data-testid="status-auth-loading"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center" data-testid="status-forbidden">
        <AlertTriangle className="w-10 h-10 text-[#E6A817]" />
        <h1 className="text-xl font-bold">Admins only</h1>
        <p className="text-muted-foreground">Geo Management is restricted to administrators.</p>
        <Link href="/accessibility-map"><Button variant="outline" data-testid="link-back-map">Go to Accessibility Map</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-geo-admin">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <LayersIcon className="w-6 h-6 text-[#1B6EB5]" /> Geo Management
          </h1>
          <p className="text-sm text-muted-foreground">Manage map layers, features, imports and categories.</p>
        </div>
        <Link href="/accessibility-map"><Button variant="outline" data-testid="link-view-map"><MapPin className="w-4 h-4 mr-2" /> View map</Button></Link>
      </div>

      <Tabs defaultValue="layers">
        <TabsList data-testid="tabs-geo-admin">
          <TabsTrigger value="layers" data-testid="tab-layers"><LayersIcon className="w-4 h-4 mr-2" /> Layers</TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-features"><MapPin className="w-4 h-4 mr-2" /> Features</TabsTrigger>
          <TabsTrigger value="imports" data-testid="tab-imports"><Upload className="w-4 h-4 mr-2" /> Imports</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories"><Tags className="w-4 h-4 mr-2" /> Categories</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit"><History className="w-4 h-4 mr-2" /> Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="mt-4"><LayersTab /></TabsContent>
        <TabsContent value="features" className="mt-4"><FeaturesTab /></TabsContent>
        <TabsContent value="imports" className="mt-4"><ImportsTab /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoriesTab /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCount({ layerId }: { layerId: string }) {
  const { data } = useQuery({
    queryKey: ["/api/geo/features", layerId, "count"],
    queryFn: () => geoApi.getFeatures({ layerId, limit: 5000 }),
  });
  return <Badge variant="outline" data-testid={`count-features-${layerId}`}>{data ? data.length : "…"} features</Badge>;
}

function LayersTab() {
  const { toast } = useToast();
  const { data: layers = [], isLoading } = useLayers();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", description: "", color: "#1B6EB5", domain: "accessibility" as GeoDomain, geometryType: "Point" as MapLayer["geometryType"], visibility: "public" as MapLayer["visibility"] });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MapLayer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", color: "#1B6EB5", domains: [] as GeoDomain[], visibility: "public" as MapLayer["visibility"] });
  const [savingEdit, setSavingEdit] = useState(false);

  const beginEdit = (l: MapLayer) => {
    setEditing(l);
    setEditForm({
      name: l.name,
      description: l.description || "",
      color: l.color || "#1B6EB5",
      domains: ((l.domains || []) as GeoDomain[]).filter((d) => DOMAINS.includes(d)),
      visibility: l.visibility,
    });
  };

  const toggleEditDomain = (d: GeoDomain) => {
    setEditForm((f) => ({
      ...f,
      domains: f.domains.includes(d) ? f.domains.filter((x) => x !== d) : [...f.domains, d],
    }));
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (editForm.domains.length === 0) {
      toast({ title: "Pick at least one domain", description: "A layer must belong to a domain.", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      await geoApi.updateLayer(editing.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        color: editForm.color,
        domains: editForm.domains,
        visibility: editForm.visibility,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/layers"] });
      toast({ title: "Layer updated", description: editForm.name });
      setEditing(null);
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const create = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      toast({ title: "Missing fields", description: "Slug and name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await geoApi.createLayer({
        slug: form.slug.trim(), name: form.name.trim(), description: form.description || undefined,
        color: form.color, domains: [form.domain], geometryType: form.geometryType, visibility: form.visibility,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/layers"] });
      toast({ title: "Layer created", description: form.name });
      setForm({ slug: "", name: "", description: "", color: "#1B6EB5", domain: "accessibility", geometryType: "Point", visibility: "public" });
      setCreating(false);
    } catch (e) {
      toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (layer: MapLayer) => {
    try {
      await geoApi.updateLayer(layer.id, { defaultVisible: !layer.defaultVisible });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/layers"] });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const remove = async (layer: MapLayer) => {
    try {
      await geoApi.deleteLayer(layer.id);
      queryClient.invalidateQueries({ queryKey: ["/api/geo/layers"] });
      toast({ title: "Layer deleted", description: layer.name });
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating((v) => !v)} data-testid="button-toggle-create-layer"><Plus className="w-4 h-4 mr-2" /> New layer</Button>
      </div>

      {creating && (
        <Card data-testid="card-create-layer">
          <CardHeader><CardTitle className="text-base">Create layer</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="layer-slug">Slug</Label>
              <Input id="layer-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="accessible-toilets" data-testid="input-layer-slug" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="layer-name">Name</Label>
              <Input id="layer-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Accessible Toilets" data-testid="input-layer-name" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="layer-desc">Description</Label>
              <Input id="layer-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-layer-description" />
            </div>
            <div className="space-y-1">
              <Label>Domain</Label>
              <Select value={form.domain} onValueChange={(v) => setForm({ ...form, domain: v as GeoDomain })}>
                <SelectTrigger data-testid="select-layer-domain"><SelectValue /></SelectTrigger>
                <SelectContent>{DOMAINS.map((d) => <SelectItem key={d} value={d}>{DOMAIN_LABELS[d]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Geometry</Label>
              <Select value={form.geometryType} onValueChange={(v) => setForm({ ...form, geometryType: v as MapLayer["geometryType"] })}>
                <SelectTrigger data-testid="select-layer-geometry"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Point">Point</SelectItem>
                  <SelectItem value="LineString">LineString</SelectItem>
                  <SelectItem value="Polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Visibility</Label>
              <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v as MapLayer["visibility"] })}>
                <SelectTrigger data-testid="select-layer-visibility"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="layer-color">Color</Label>
              <Input id="layer-color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20 p-1" data-testid="input-layer-color" />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreating(false)} data-testid="button-cancel-create-layer">Cancel</Button>
              <Button onClick={create} disabled={saving} data-testid="button-save-layer">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save layer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="p-6 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading layers…</div>
      ) : (
        <div className="grid gap-3">
          {layers.map((l) => (
            <Card key={l.id} data-testid={`card-layer-${l.slug}`}>
              <CardContent className="flex items-center gap-3 py-4 flex-wrap">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: l.color || "#1B6EB5" }} />
                <div className="flex-1 min-w-[160px]">
                  <div className="font-semibold flex items-center gap-2">{l.name} <code className="text-xs text-muted-foreground">{l.slug}</code></div>
                  {l.description && <div className="text-sm text-muted-foreground line-clamp-1">{l.description}</div>}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(l.domains || []).map((d) => <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>)}
                    <Badge variant="outline" className="text-xs">{l.geometryType}</Badge>
                    <Badge variant="outline" className="text-xs">{l.visibility}</Badge>
                  </div>
                </div>
                <FeatureCount layerId={l.id} />
                <div className="flex items-center gap-2">
                  <Label htmlFor={`vis-${l.id}`} className="text-xs text-muted-foreground">Default on</Label>
                  <Switch id={`vis-${l.id}`} checked={l.defaultVisible} onCheckedChange={() => toggleVisible(l)} data-testid={`switch-default-${l.slug}`} />
                </div>
                <Button variant="outline" size="sm" onClick={() => beginEdit(l)} data-testid={`button-edit-layer-${l.slug}`}>Edit</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-layer-${l.slug}`}><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete “{l.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>This permanently deletes the layer and all of its features. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete-layer">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(l)} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete-layer">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <AlertDialogContent data-testid="dialog-edit-layer">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit layer{editing ? ` — ${editing.slug}` : ""}</AlertDialogTitle>
            <AlertDialogDescription>Update name, audience visibility, colour and which domain tabs this layer appears under.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-layer-name">Name</Label>
              <Input id="edit-layer-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} data-testid="input-edit-layer-name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-layer-desc">Description</Label>
              <Textarea id="edit-layer-desc" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} data-testid="textarea-edit-layer-desc" />
            </div>
            <div className="space-y-1">
              <Label>Domains</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {DOMAINS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer" data-testid={`edit-domain-${d}`}>
                    <Checkbox checked={editForm.domains.includes(d)} onCheckedChange={() => toggleEditDomain(d)} data-testid={`checkbox-edit-domain-${d}`} />
                    {DOMAIN_LABELS[d]}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Visibility</Label>
                <Select value={editForm.visibility} onValueChange={(v) => setEditForm({ ...editForm, visibility: v as MapLayer["visibility"] })}>
                  <SelectTrigger data-testid="select-edit-layer-visibility"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-layer-color">Colour</Label>
                <Input id="edit-layer-color" type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="h-10 w-20 p-1" data-testid="input-edit-layer-color" />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-edit-layer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); saveEdit(); }} disabled={savingEdit} data-testid="button-save-edit-layer">{savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FeaturesTab() {
  const { toast } = useToast();
  const { data: layers = [] } = useLayers();
  const [layerId, setLayerId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MapFeature | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { data: features = [], isLoading } = useQuery<MapFeature[]>({
    queryKey: ["/api/geo/features", layerId, "admin"],
    queryFn: () => geoApi.getFeatures({ layerId, limit: 5000 }),
    enabled: !!layerId,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return features;
    return features.filter((f) => f.name?.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q));
  }, [features, search]);

  const beginEdit = (f: MapFeature) => {
    setEditing(f);
    setEditName(f.name || "");
    setEditDesc(f.description || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await geoApi.updateFeature(editing.id, { name: editName.trim(), description: editDesc.trim() || undefined });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/features"] });
      toast({ title: "Feature updated", description: editName });
      setEditing(null);
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const remove = async (f: MapFeature) => {
    try {
      await geoApi.deleteFeature(f.id);
      queryClient.invalidateQueries({ queryKey: ["/api/geo/features"] });
      toast({ title: "Feature deleted", description: f.name });
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card data-testid="card-features-controls">
        <CardContent className="grid gap-3 md:grid-cols-2 py-4">
          <div className="space-y-1">
            <Label>Layer</Label>
            <Select value={layerId} onValueChange={setLayerId}>
              <SelectTrigger data-testid="select-features-layer"><SelectValue placeholder="Choose a layer to manage" /></SelectTrigger>
              <SelectContent>{layers.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="feature-search">Search</Label>
            <Input id="feature-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name or description" disabled={!layerId} data-testid="input-feature-search" />
          </div>
        </CardContent>
      </Card>

      {!layerId ? (
        <div className="p-6 text-center text-muted-foreground" data-testid="text-no-layer-selected">Select a layer to view and manage its features.</div>
      ) : isLoading ? (
        <div className="p-6 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading features…</div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground" data-testid="text-no-features">No features match.</div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground" data-testid="text-feature-total">{filtered.length} feature{filtered.length === 1 ? "" : "s"}</div>
          <ScrollArea className="h-[520px]">
            <div className="grid gap-2 pr-3">
              {filtered.map((f) => (
                <Card key={f.id} data-testid={`card-feature-${f.id}`}>
                  <CardContent className="flex items-center gap-3 py-3 flex-wrap">
                    <MapPin className="w-4 h-4 text-[#1B6EB5] shrink-0" />
                    <div className="flex-1 min-w-[160px]">
                      <div className="font-medium leading-tight">{f.name || "(unnamed)"}</div>
                      {f.description && <div className="text-sm text-muted-foreground line-clamp-1">{f.description}</div>}
                      <div className="text-xs text-muted-foreground mt-0.5">{f.geometry?.type}{f.lat != null && f.lng != null ? ` · ${Number(f.lat).toFixed(4)}, ${Number(f.lng).toFixed(4)}` : ""}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => beginEdit(f)} data-testid={`button-edit-feature-${f.id}`}>Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-feature-${f.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete “{f.name}”?</AlertDialogTitle>
                          <AlertDialogDescription>This permanently deletes the feature. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete-feature">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(f)} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete-feature">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      <AlertDialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit feature</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-feature-name">Name</Label>
              <Input id="edit-feature-name" value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-feature-name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-feature-desc">Description</Label>
              <Textarea id="edit-feature-desc" rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} data-testid="textarea-edit-feature-desc" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-edit-feature">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveEdit} data-testid="button-save-edit-feature">Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ImportsTab() {
  const { toast } = useToast();
  const { data: layers = [] } = useLayers();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [layerId, setLayerId] = useState<string>("");
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState<GeoDomain>("accessibility");
  const [source, setSource] = useState<"paste" | "url">("paste");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [replace, setReplace] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    setImporting(true);
    setResult(null);
    try {
      const payload: Parameters<typeof geoApi.importGeo>[0] = { replace };
      if (mode === "existing") {
        if (!layerId) throw new Error("Select a target layer");
        payload.layerId = layerId;
      } else {
        if (!newSlug.trim() || !newName.trim()) throw new Error("New layer needs slug and name");
        payload.newLayer = { slug: newSlug.trim(), name: newName.trim(), domains: [newDomain] };
      }
      if (source === "paste") {
        if (!content.trim()) throw new Error("Paste KML or GeoJSON content");
        payload.content = content;
      } else {
        if (!url.trim()) throw new Error("Enter a URL");
        payload.url = url.trim();
      }
      const res = await geoApi.importGeo(payload);
      setResult(`Imported ${res.imported} features into layer ${res.layerId}.`);
      queryClient.invalidateQueries({ queryKey: ["/api/geo/layers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/features"] });
      toast({ title: "Import complete", description: `${res.imported} features imported.` });
    } catch (e) {
      toast({ title: "Import failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card data-testid="card-import">
      <CardHeader><CardTitle className="text-base">Import KML / GeoJSON</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Target</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
              <SelectTrigger data-testid="select-import-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">Existing layer</SelectItem>
                <SelectItem value="new">New layer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "existing" ? (
            <div className="space-y-1">
              <Label>Layer</Label>
              <Select value={layerId} onValueChange={setLayerId}>
                <SelectTrigger data-testid="select-import-layer"><SelectValue placeholder="Choose layer" /></SelectTrigger>
                <SelectContent>{layers.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:col-span-1">
              <div className="space-y-1">
                <Label htmlFor="import-slug">New slug</Label>
                <Input id="import-slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} data-testid="input-import-slug" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="import-name">New name</Label>
                <Input id="import-name" value={newName} onChange={(e) => setNewName(e.target.value)} data-testid="input-import-name" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Domain</Label>
                <Select value={newDomain} onValueChange={(v) => setNewDomain(v as GeoDomain)}>
                  <SelectTrigger data-testid="select-import-domain"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOMAINS.map((d) => <SelectItem key={d} value={d}>{DOMAIN_LABELS[d]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label>Source</Label>
          <Select value={source} onValueChange={(v) => setSource(v as "paste" | "url")}>
            <SelectTrigger className="w-48" data-testid="select-import-source"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paste">Paste content</SelectItem>
              <SelectItem value="url">Fetch from URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {source === "paste" ? (
          <div className="space-y-1">
            <Label htmlFor="import-content">KML or GeoJSON</Label>
            <Textarea id="import-content" rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="<kml>…</kml> or { &quot;type&quot;: &quot;FeatureCollection&quot;, … }" className="font-mono text-xs" data-testid="textarea-import-content" />
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="import-url">URL</Label>
            <Input id="import-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/data.kml" data-testid="input-import-url" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch id="import-replace" checked={replace} onCheckedChange={setReplace} data-testid="switch-import-replace" />
          <Label htmlFor="import-replace" className="text-sm">Replace existing features in target layer</Label>
        </div>

        {result && <div className="text-sm text-[#2EAA6E] font-medium" data-testid="text-import-result">{result}</div>}

        <div className="flex justify-end">
          <Button onClick={run} disabled={importing} data-testid="button-run-import">{importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Import</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoriesTab() {
  const { toast } = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1B6EB5");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!slug.trim() || !name.trim()) {
      toast({ title: "Missing fields", description: "Slug and name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await geoApi.createCategory({ slug: slug.trim(), name: name.trim(), color });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/categories"] });
      setSlug(""); setName(""); setColor("#1B6EB5");
      toast({ title: "Category created", description: name });
    } catch (e) {
      toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cat: MapCategory) => {
    try {
      await geoApi.deleteCategory(cat.id);
      queryClient.invalidateQueries({ queryKey: ["/api/geo/categories"] });
      toast({ title: "Category deleted", description: cat.name });
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card data-testid="card-create-category">
        <CardHeader><CardTitle className="text-base">New category</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} data-testid="input-category-slug" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-category-name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cat-color">Color</Label>
            <Input id="cat-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 p-1" data-testid="input-category-color" />
          </div>
          <Button onClick={create} disabled={saving} data-testid="button-save-category">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Add</Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="p-6 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>
      ) : categories.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground" data-testid="text-no-categories">No categories yet.</div>
      ) : (
        <div className="grid gap-2">
          {categories.map((c) => (
            <Card key={c.id} data-testid={`card-category-${c.slug}`}>
              <CardContent className="flex items-center gap-3 py-3">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.color || "#1B6EB5" }} />
                <div className="flex-1"><span className="font-medium">{c.name}</span> <code className="text-xs text-muted-foreground">{c.slug}</code></div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c)} data-testid={`button-delete-category-${c.slug}`}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab() {
  const { data = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ["/api/geo/audit"],
    queryFn: () => geoApi.getAudit(),
  });

  return (
    <Card data-testid="card-audit">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Audit log</CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-audit">
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground" data-testid="text-no-audit">No audit entries yet.</div>
        ) : (
          <ScrollArea className="h-[480px]">
            <div className="space-y-2">
              {data.map((entry, i) => (
                <div key={entry.id ?? i} className="flex items-center gap-3 text-sm border-b pb-2" data-testid={`audit-entry-${i}`}>
                  <Badge variant="secondary" className="capitalize">{entry.action}</Badge>
                  <span className="text-muted-foreground">{entry.entity}</span>
                  <code className="text-xs truncate flex-1">{entry.entityId}</code>
                  <span className="text-xs text-muted-foreground">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
