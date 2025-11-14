import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatDate } from '@/utils/risk';
import type { SatelliteData } from '@/types';

interface Props {
  satelliteData: SatelliteData[];
}

export function NDVIChart({ satelliteData }: Props) {
  const data = satelliteData.map((d) => ({
    date: formatDate(d.captureDate),
    ndvi: d.ndvi,
    evi: d.evi,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
          <YAxis domain={[-0.1, 1]} />
          <Tooltip />
          <ReferenceLine y={0.7} label="Excellent" stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine y={0.5} label="Good" stroke="#eab308" strokeDasharray="3 3" />
          <ReferenceLine y={0.3} label="Fair" stroke="#f97316" strokeDasharray="3 3" />
          <ReferenceLine y={0.2} label="Poor" stroke="#ef4444" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="ndvi" stroke="#22c55e" strokeWidth={2} name="NDVI" />
          <Line type="monotone" dataKey="evi" stroke="#3b82f6" strokeWidth={2} name="EVI" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
