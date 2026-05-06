"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const Map = dynamic(async () => {
  const { MapContainer, TileLayer, Marker, Popup } = await import("react-leaflet");
  const L = await import("leaflet");
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  return function MapInner({ lat, lng, label }: { lat: number; lng: number; label: string }) {
    return (
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: 360, borderRadius: 8 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}><Popup>{label}</Popup></Marker>
      </MapContainer>
    );
  };
}, { ssr: false });

export function ClienteMappa({ lat, lng, label }: { lat: number | null; lng: number | null; label: string }) {
  if (lat == null || lng == null) {
    return (
      <div className="rounded-md border bg-muted/40 p-6 text-sm text-muted-foreground">
        Coordinate non disponibili. Compila l&apos;indirizzo e salva, oppure inserisci lat/lng a mano.
      </div>
    );
  }
  return <Map lat={lat} lng={lng} label={label} />;
}
