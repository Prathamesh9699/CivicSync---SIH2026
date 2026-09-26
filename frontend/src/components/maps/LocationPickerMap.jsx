import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      background-color: #16a34a;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 18px rgba(22, 163, 74, 0.45);
      border: 3px solid white;
      cursor: grab;
    ">
      <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Map Controller for click events and programmatic flyTo
const MapController = ({ onLocationChange, onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
    locationfound(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng, e.accuracy);
      map.flyTo(e.latlng, 17, { animate: true, duration: 1.0 });
    }
  });

  return null;
};

// Common Pune area presets for 1-click precision selection
const PUNE_PRESETS = [
  { name: "Mangalwar Peth", lat: 18.5249, lng: 73.8644, ward: "Ward 02 - Mangalwar Peth / Somwar Peth" },
  { name: "Somwar Peth", lat: 18.5230, lng: 73.8680, ward: "Ward 02 - Mangalwar Peth / Somwar Peth" },
  { name: "Kasba Peth", lat: 18.5195, lng: 73.8580, ward: "Ward 02 - Mangalwar Peth / Somwar Peth" },
  { name: "Guruwar Peth", lat: 18.5085, lng: 73.8565, ward: "Ward 03 - Guruwar Peth / Swargate" },
  { name: "Shivaji Nagar", lat: 18.5314, lng: 73.8446, ward: "Ward 12 - Shivaji Nagar" },
  { name: "Deccan Gymkhana", lat: 18.5167, lng: 73.8415, ward: "Ward 14 - Deccan" },
  { name: "Kothrud", lat: 18.5074, lng: 73.8077, ward: "Ward 07 - Kothrud" },
  { name: "Swargate", lat: 18.5018, lng: 73.8585, ward: "Ward 03 - Guruwar Peth / Swargate" }
];

export const LocationPickerMap = ({ latitude, longitude, onChange, onAddressFound, onWardSuggested, height = "280px" }) => {
  const currentLat = latitude || 18.5249;
  const currentLng = longitude || 73.8644;

  const [mapInstance, setMapInstance] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState({ type: 'default', text: 'Click Use Current Location or click on map to set pin' });

  // Reverse geocode to get street name & landmark
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.street || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
          const locality = addr.suburb || addr.city_district || addr.county || addr.city || addr.town || '';
          const city = addr.city || addr.state_district || addr.state || '';
          const addressString = [road, locality, city].filter(Boolean).join(', ');
          
          if (onAddressFound && addressString) {
            onAddressFound(addressString, addr);
          }
          return addressString;
        }
      }
    } catch (e) {
      console.log('[Geocoding Notice] Could not reverse geocode', e.message);
    }
    return null;
  };

  const handleLocationChange = async (lat, lng, accuracy = null, customLabel = null) => {
    const fixedLat = parseFloat(lat.toFixed(5));
    const fixedLng = parseFloat(lng.toFixed(5));
    
    if (onChange) {
      onChange(fixedLat, fixedLng);
    }

    if (mapInstance) {
      try {
        mapInstance.flyTo([fixedLat, fixedLng], 17, { animate: true, duration: 0.8 });
      } catch (err) {
        // Ignore
      }
    }

    if (customLabel) {
      setGpsStatus({
        type: 'success',
        text: `Location: ${customLabel}`
      });
      if (onAddressFound) {
        onAddressFound(customLabel, {});
      }
    } else if (accuracy) {
      setGpsStatus({
        type: 'success',
        text: `📍 GPS Live: ±${Math.round(accuracy)}m accuracy`
      });
      await reverseGeocode(fixedLat, fixedLng);
    } else {
      setGpsStatus({
        type: 'manual',
        text: `Pinned at: ${fixedLat}, ${fixedLng}`
      });
      await reverseGeocode(fixedLat, fixedLng);
    }
  };

  // High-Precision Real Device Current Location
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setGpsStatus({ type: 'loading', text: 'Acquiring high-precision GPS position...' });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = pos.coords.accuracy;
          handleLocationChange(lat, lng, acc);
        },
        (error) => {
          console.warn('[High-accuracy GPS attempt failed, trying standard precision]', error.message);
          // Try Leaflet native locate
          if (mapInstance) {
            mapInstance.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true });
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setIsLocating(false);
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const acc = pos.coords.accuracy;
              handleLocationChange(lat, lng, acc);
            },
            (err2) => {
              console.error('[Geolocation denied or unavailable]', err2.message);
              setIsLocating(false);
              if (err2.code === 1) {
                setGpsStatus({ type: 'warning', text: 'Location access blocked in browser. Click on map to set pin.' });
              } else {
                setGpsStatus({ type: 'warning', text: 'GPS signal timed out. Please click on map or pick a Peth below.' });
              }
            },
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 0
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 0
        }
      );
    } else {
      setIsLocating(false);
      setGpsStatus({ type: 'error', text: 'Geolocation is not supported by your browser.' });
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Quick 1-Click Area Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0">Quick Peths:</span>
        {PUNE_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              handleLocationChange(p.lat, p.lng, null, `${p.name}, Pune`);
              if (onWardSuggested) onWardSuggested(p.ward);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] whitespace-nowrap transition-all border cursor-pointer ${
              Math.abs(currentLat - p.lat) < 0.003 && Math.abs(currentLng - p.lng) < 0.003
                ? "bg-brand-600 text-white border-brand-600 shadow-xs font-bold"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Map Display */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0">
        <div style={{ height }}>
          <MapContainer
            center={[currentLat, currentLng]}
            zoom={17}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController 
              onLocationChange={handleLocationChange} 
              onMapReady={(map) => setMapInstance(map)} 
            />
            <Marker 
              position={[currentLat, currentLng]} 
              icon={pinIcon} 
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const latlng = e.target.getLatLng();
                  handleLocationChange(latlng.lat, latlng.lng);
                }
              }}
            />
          </MapContainer>
        </div>

        {/* GPS Pin Toolbar */}
        <div className="bg-slate-900 text-white p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>LAT: <strong className="text-white">{currentLat}</strong></span>
              <span>LNG: <strong className="text-white">{currentLng}</strong></span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
            <span className={`text-[11px] font-sans flex items-center gap-1 ${
              gpsStatus.type === 'success' ? 'text-emerald-400' :
              gpsStatus.type === 'warning' ? 'text-amber-400' :
              gpsStatus.type === 'loading' ? 'text-cyan-400' : 'text-slate-400'
            }`}>
              {gpsStatus.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
              {gpsStatus.type === 'warning' && <AlertCircle className="w-3 h-3" />}
              {gpsStatus.type === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{gpsStatus.text}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-sans font-bold shadow-md cursor-pointer flex-shrink-0"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Acquiring GPS...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5" />
                <span>Use Current Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
