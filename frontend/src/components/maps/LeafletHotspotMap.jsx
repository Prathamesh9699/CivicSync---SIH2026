import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GIS_HOTSPOTS } from '../../data/hotspots';
import { ShieldAlert, ArrowRight, Activity, MapPin, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '../common/ErrorBoundary';

// Custom Leaflet Pin Icon Generator
const createCustomIcon = (color) => {
  try {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  } catch (e) {
    return null;
  }
};

// Component to dynamically re-center map if target changes without infinite loops
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  const prevKey = useRef(null);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && map) {
      const key = `${center[0]},${center[1]},${zoom}`;
      if (prevKey.current !== key) {
        prevKey.current = key;
        try {
          map.setView(center, zoom || 14);
        } catch (e) {}
      }
    }
  }, [center, zoom, map]);

  return null;
};

const LeafletInnerMap = ({ 
  hotspots = GIS_HOTSPOTS, 
  selectedHotspot, 
  onSelectHotspot, 
  height = "500px",
  center = [18.5204, 73.8567],
  zoom = 13
}) => {
  const validHotspots = (Array.isArray(hotspots) ? hotspots : []).filter(
    hs => hs && typeof hs.latitude === 'number' && typeof hs.longitude === 'number' && !isNaN(hs.latitude) && !isNaN(hs.longitude)
  );

  const safeCenter = Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])
    ? center
    : [18.5204, 73.8567];

  return (
    <div style={{ height }} className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapRecenter center={safeCenter} zoom={zoom} />
        
        {/* OpenStreetMap Base Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotspots Radius Circles & Markers */}
        {validHotspots.map((hs) => {
          const isSelected = selectedHotspot?.id === hs.id;
          const color = hs.color || (hs.severity === "Critical" ? "#dc2626" : hs.severity === "High" ? "#ea580c" : "#eab308");
          const icon = createCustomIcon(color);

          return (
            <React.Fragment key={hs.id || `${hs.latitude}-${hs.longitude}`}>
              {/* Heat/Radius Circle */}
              <Circle
                center={[hs.latitude, hs.longitude]}
                radius={hs.severity === "Critical" ? 380 : hs.severity === "High" ? 280 : 180}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: isSelected ? 0.35 : 0.2,
                  color: color,
                  weight: isSelected ? 2 : 1,
                  dashArray: isSelected ? '4, 4' : null
                }}
              />

              {/* Marker */}
              {icon && (
                <Marker
                  position={[hs.latitude, hs.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      if (onSelectHotspot) onSelectHotspot(hs);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{hs.ward}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: color }}
                        >
                          {hs.severity}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{hs.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>{hs.totalComplaints}</strong> Total Reports ({hs.activeComplaints} Active)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Primary: {hs.primaryWasteType}
                      </p>
                      {onSelectHotspot && (
                        <button
                          onClick={() => onSelectHotspot(hs)}
                          className="mt-2 w-full py-1 text-center text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>View Hotspot Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-xs flex flex-wrap items-center gap-3">
        <span className="font-bold text-slate-700">Severity:</span>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Critical</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Medium</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Clean / Normal</div>
      </div>
    </div>
  );
};

export const LeafletHotspotMap = (props) => {
  const fallbackUI = (
    <div style={{ height: props.height || "300px" }} className="w-full rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
      <MapPin className="w-8 h-8 text-slate-400 mb-2" />
      <h4 className="font-bold text-slate-800 text-sm">GIS Hotspot Map</h4>
      <p className="text-xs text-slate-500 max-w-xs mt-1">
        Interactive GIS map initialized. Pune municipal coordinates active.
      </p>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallbackUI} sectionName="Interactive GIS Map">
      <LeafletInnerMap {...props} />
    </ErrorBoundary>
  );
};
