'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';

// Fix for default Leaflet marker icons in React
const customIcon = L.icon({
  iconUrl: '/markers/cache-icon.png', // Add this to your /public folder
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface CacheMapProps {
  caches: { id: string; title: string; lat: number; lng: number }[];
}

export default function CacheMap({ caches }: CacheMapProps) {
  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border">
      <MapContainer 
        center={[39.8283, -98.5795]} // Default center (US)
        zoom={4} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {caches.map((cache) => (
          <Marker 
            key={cache.id} 
            position={[cache.lat, cache.lng]} 
            icon={customIcon}
          >
            <Popup>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">{cache.title}</span>
                <Link 
                  href={`/caches/${cache.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
