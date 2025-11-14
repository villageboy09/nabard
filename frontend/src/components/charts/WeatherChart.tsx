import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { formatDate } from '@/utils/risk';
import type { WeatherData } from '@/types';

interface Props {
  weatherData: WeatherData[];
}

export function WeatherChart({ weatherData }: Props) {
  const data = weatherData.map((w) => ({
    date: formatDate(w.forecastDate),
    tempMax: w.tempMax,
    tempMin: w.tempMin,
    rainfall: w.rainfall,
    humidity: w.humidity,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
          <YAxis yAxisId="temp" orientation="left" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="rain" orientation="right" label={{ value: 'Rainfall (mm)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="temp" type="monotone" dataKey="tempMax" stroke="#ef4444" name="Max Temp" />
          <Line yAxisId="temp" type="monotone" dataKey="tempMin" stroke="#3b82f6" name="Min Temp" />
          <Bar yAxisId="rain" dataKey="rainfall" fill="#6366f1" name="Rainfall" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
