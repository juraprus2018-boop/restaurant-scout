import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix default marker icons (Leaflet expects bundled images)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export function coloredIcon(color: "red" | "orange" | "green" | "blue") {
  return L.divIcon({
    className: "",
    html: `<div style="background:${
      { red: "hsl(0 84% 50%)", orange: "hsl(28 90% 55%)", green: "hsl(142 71% 40%)", blue: "hsl(217 91% 55%)" }[color]
    };width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -18],
  });
}

export { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents };
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const OSM_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export function FlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

export type ClusterPoint = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  address?: string | null;
};

export function ClusterLayer({ points }: { points: ClusterPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const group = (L as any).markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
    });
    for (const p of points) {
      const m = L.marker([p.lat, p.lng], { icon: coloredIcon("green") });
      const safeName = String(p.name).replace(/</g, "&lt;");
      const safeAddr = p.address ? String(p.address).replace(/</g, "&lt;") : "";
      m.bindPopup(
        `<div style="font-weight:600">${safeName}</div>` +
          (safeAddr ? `<div style="font-size:12px;color:#666">${safeAddr}</div>` : "") +
          `<a href="/restaurant/${encodeURIComponent(p.slug)}" style="font-size:12px;color:hsl(28 90% 45%);text-decoration:underline">Bekijk →</a>`,
      );
      group.addLayer(m);
    }
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, points]);
  return null;
}
