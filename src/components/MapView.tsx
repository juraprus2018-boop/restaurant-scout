import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function FlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}
