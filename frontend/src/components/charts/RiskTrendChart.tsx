import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDate } from '@/utils/risk';
import type { RiskScore } from '@/types';

interface Props {
  riskScores: RiskScore[];
}

export function RiskTrendChart({ riskScores }: Props) {
  const data = riskScores.map((score) => ({
    date: formatDate(score.forecastDate),
    overall: score.overallRisk,
    weather: score.weatherRisk,
    crop: score.ndviRisk,
    pest: score.pestRisk,
    market: score.marketRisk,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={2} name="Overall Risk" />
          <Line type="monotone" dataKey="weather" stroke="#3b82f6" name="Weather" />
          <Line type="monotone" dataKey="crop" stroke="#22c55e" name="Crop Health" />
          <Line type="monotone" dataKey="pest" stroke="#f97316" name="Pest" />
          <Line type="monotone" dataKey="market" stroke="#eab308" name="Market" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
