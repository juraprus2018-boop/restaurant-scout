import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { previewArea, importArea, deleteRestaurant } from "@/lib/restaurants.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Trash2, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PlaceResults" }] }),
  component: AdminPage,
});

type Marker = { lat: number; lng: number } | null;
type Poi = {
  osm_id: number;
  name: string;
  lat: number;
  lng: number;
  amenity: string;
  exists: boolean;
};

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [marker, setMarker] = useState<Marker>(null);
  const [radius, setRadius] = useState(1000);
  const [pois, setPois] = useState<Poi[]>([]);
  const [previewStats, setPreviewStats] = useState<{ total: number; newCount: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  const previewFn = useServerFn(previewArea);
  const importFn = useServerFn(importArea);
  const deleteFn = useServerFn(deleteRestaurant);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: u }) => {
      if (!u.user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!data);
    });
    loadRecent();
  }, []);

  async function loadRecent() {
    const { data } = await supabase
      .from("restaurants")
      .select("id,name,slug,city,imported_at")
      .order("imported_at", { ascending: false })
      .limit(20);
    setRecent(data ?? []);
  }

  async function doPreview() {
    if (!marker) return;
    setLoadingPreview(true);
    setPois([]);
    setPreviewStats(null);
    try {
      const res = await previewFn({ data: { lat: marker.lat, lng: marker.lng, radius } });
      setPois(res.pois);
      setPreviewStats({ total: res.total, newCount: res.newCount });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function doImport() {
    if (!marker) return;
    setImporting(true);
    try {
      const res = await importFn({ data: { lat: marker.lat, lng: marker.lng, radius } });
      toast.success(`${res.inserted} nieuwe restaurants geïmporteerd!`);
      setPois([]);
      setPreviewStats(null);
      loadRecent();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  async function doDelete(id: string) {
    if (!confirm("Verwijderen?")) return;
    await deleteFn({ data: { id } });
    loadRecent();
    toast.success("Verwijderd");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === false) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold">Geen admin-rechten</h1>
        <p className="text-muted-foreground mt-2">Je account heeft geen admin-rol.</p>
        <Button onClick={signOut} className="mt-4">Uitloggen</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Toaster />
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold">🍽️ PlaceResults Admin</Link>
          <span className="text-xs text-muted-foreground">Klik op de kaart → importeer restaurants uit OSM</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Uitloggen</Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-96 border-r overflow-y-auto p-4 space-y-4 bg-muted/20">
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Import-instellingen</h2>
            <div>
              <label className="text-sm text-muted-foreground">Straal</label>
              <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">500 meter</SelectItem>
                  <SelectItem value="1000">1 km</SelectItem>
                  <SelectItem value="2000">2 km</SelectItem>
                  <SelectItem value="5000">5 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {marker ? (
                <>Gekozen: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}</>
              ) : (
                "Klik op de kaart om een locatie te kiezen"
              )}
            </div>
            <Button onClick={doPreview} disabled={!marker || loadingPreview} className="w-full">
              {loadingPreview ? "Zoeken..." : "Preview restaurants"}
            </Button>
            {previewStats && (
              <div className="text-sm bg-muted p-2 rounded">
                <div>Gevonden: <strong>{previewStats.total}</strong></div>
                <div>Nieuw: <strong className="text-green-700">{previewStats.newCount}</strong></div>
                <div>Al in DB: {previewStats.total - previewStats.newCount}</div>
              </div>
            )}
            {previewStats && previewStats.newCount > 0 && (
              <Button onClick={doImport} disabled={importing} className="w-full">
                {importing ? "Importeren..." : `Importeer ${previewStats.newCount} nieuwe`}
              </Button>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">Recent geïmporteerd</h2>
            <ul className="space-y-1 text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-1 border-b last:border-0">
                  <Link to="/restaurant/$slug" params={{ slug: r.slug }} className="hover:underline truncate flex-1">
                    {r.name}
                    {r.city && <span className="text-muted-foreground"> · {r.city}</span>}
                  </Link>
                  <button onClick={() => doDelete(r.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
              {recent.length === 0 && <li className="text-muted-foreground">Nog niks geïmporteerd.</li>}
            </ul>
          </Card>
        </aside>

        <main className="flex-1 relative">
          <ClientOnly fallback={<div className="h-full bg-muted" />}>
            <AdminMap marker={marker} radius={radius} pois={pois} onClick={setMarker} />
          </ClientOnly>
        </main>
      </div>
    </div>
  );
}

function AdminMap({
  marker,
  radius,
  pois,
  onClick,
}: {
  marker: Marker;
  radius: number;
  pois: Poi[];
  onClick: (m: Marker) => void;
}) {
  const [mod, setMod] = useState<typeof import("@/components/MapView") | null>(null);
  useEffect(() => {
    import("@/components/MapView").then(setMod);
  }, []);
  if (!mod) return <div className="h-full grid place-items-center text-muted-foreground bg-muted">Kaart laden...</div>;
  const { MapContainer, TileLayer, Marker: M, Circle, Popup, useMapEvents, OSM_ATTRIBUTION, OSM_TILES, coloredIcon } = mod;

  function ClickHandler() {
    useMapEvents({
      click(e: any) {
        onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  return (
    <MapContainer center={[52.3676, 4.9041]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      <ClickHandler />
      {marker && (
        <>
          <M position={[marker.lat, marker.lng]} icon={coloredIcon("blue")} />
          <Circle center={[marker.lat, marker.lng]} radius={radius} pathOptions={{ color: "hsl(217 91% 55%)", fillOpacity: 0.1 }} />
        </>
      )}
      {pois.map((p) => (
        <M key={p.osm_id} position={[p.lat, p.lng]} icon={coloredIcon(p.exists ? "green" : "orange")}>
          <Popup>
            <strong>{p.name}</strong>
            <div className="text-xs">{p.amenity}</div>
            <div className="text-xs">{p.exists ? "✓ Al in database" : "Nieuw"}</div>
          </Popup>
        </M>
      ))}
    </MapContainer>
  );
}

