import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getRiskColor } from '@/utils/risk';
import type { FieldWithRisk } from '@/types';
import 'leaflet/dist/leaflet.css';

interface Props {
  fields: FieldWithRisk[];
  onFieldSelect?: (field: FieldWithRisk) => void;
  selectedFieldId?: string;
}

function MapUpdater({ fields }: { fields: FieldWithRisk[] }) {
  const map = useMap();

  useEffect(() => {
    if (fields.length > 0) {
      const bounds = fields.map((f) => [f.latitude, f.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [fields, map]);

  return null;
}

export function FieldMap({ fields, onFieldSelect, selectedFieldId }: Props) {
  const defaultCenter: [number, number] = fields.length > 0
    ? [fields[0].latitude, fields[0].longitude]
    : [20.5937, 78.9629]; // Center of India

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater fields={fields} />

        {fields.map((field) => {
          const riskLevel = field.currentRisk?.riskLevel || 'LOW';
          const riskScore = field.currentRisk?.overallRisk || 0;
          const color = getRiskColor(riskLevel);

          return (
            <CircleMarker
              key={field.id}
              center={[field.latitude, field.longitude]}
              radius={selectedFieldId === field.id ? 12 : 8}
              pathOptions={{
                color: '#fff',
                fillColor: color,
                fillOpacity: 0.8,
                weight: selectedFieldId === field.id ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onFieldSelect?.(field),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{field.fieldCode}</h3>
                  <p className="text-sm text-gray-600">
                    Crop: {field.currentCrop || 'Not planted'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Area: {field.area} hectares
                  </p>
                  {field.currentRisk && (
                    <>
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm font-medium" style={{ color }}>
                          Risk: {riskScore.toFixed(0)} ({riskLevel})
                        </p>
                      </div>
                      <button
                        onClick={() => onFieldSelect?.(field)}
                        className="mt-2 w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        View Details
                      </button>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
