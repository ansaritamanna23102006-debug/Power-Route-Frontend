'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths which get corrupted by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Leaflet Icons
const createDotIcon = (color, size = 16, border = 'white') => L.divIcon({
  html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border-radius: 50%; border: 2px solid ${border}; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center;"></div>`,
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

const userIcon = createDotIcon('#10B981', 18, '#ffffff'); // emerald dot

const stationIcon = L.divIcon({
  html: `
    <div style="background-color: #8b5cf6; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(139,92,246,0.4);">
      <span style="color: white; font-size: 13px;">⚡</span>
    </div>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const activeStationIcon = L.divIcon({
  html: `
    <div style="
      background-color: #d946ef; 
      width: 34px; height: 34px; 
      border-radius: 50%; 
      border: 2.5px solid white; 
      display: flex; align-items: center; justify-content: center; 
      box-shadow: 0 0 15px #d946ef;
    ">
      <span style="color: white; font-size: 16px;">⚡</span>
    </div>
  `,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
});

// Map View synchronizer
function MapUpdater({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.flyTo(center, 13);
    }
  }, [center, bounds, map]);
  return null;
}

export default function MapComponent({ userCoord, stations, targetStation, onSelectStation, routeCoords }) {
  const mapCenter = [userCoord.latitude, userCoord.longitude];

  const mapBounds = React.useMemo(() => {
    if (routeCoords && routeCoords.length > 0) return routeCoords;
    if (targetStation) {
      return [
        [userCoord.latitude, userCoord.longitude],
        [targetStation.latitude, targetStation.longitude]
      ];
    }
    return null;
  }, [routeCoords, targetStation, userCoord]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater center={mapCenter} bounds={mapBounds} />

        {/* User Marker */}
        <Marker position={mapCenter} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* EV Stations */}
        {stations.map((s) => {
          const isActive = targetStation && s.id === targetStation.id;
          return (
            <Marker 
              key={s.id} 
              position={[s.latitude, s.longitude]} 
              icon={isActive ? activeStationIcon : stationIcon}
              eventHandlers={{
                click: () => onSelectStation(s)
              }}
            >
              <Popup>
                <div className="text-black font-sans">
                  <h4 className="font-bold">{s.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{s.availablePorts} ports available</p>
                  <p className="text-xs text-violet-600 font-bold">{s.maxKw} kW Speed</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route line */}
        {routeCoords && routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="#a855f7" weight={4} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
}
