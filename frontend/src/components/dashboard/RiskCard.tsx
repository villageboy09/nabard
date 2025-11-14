import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getRiskColor, getRiskBgColor } from '@/utils/risk';
import type { RiskScore } from '@/types';

interface Props {
  riskScore: RiskScore;
}

export function RiskCard({ riskScore }: Props) {
  const getTrendIcon = () => {
    // In a real app, compare with previous score
    const trend = 0; // placeholder
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < -5) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="w-6 h-6"
              style={{ color: getRiskColor(riskScore.riskLevel) }}
            />
            <h3 className="text-lg font-semibold text-gray-900">Overall Risk Score</h3>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: getRiskColor(riskScore.riskLevel) }}>
                {riskScore.overallRisk.toFixed(0)}
              </span>
              <span className="text-gray-500">/100</span>
              {getTrendIcon()}
            </div>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskBgColor(riskScore.riskLevel)}`}>
                {riskScore.riskLevel} RISK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Components */}
      <div className="mt-6 space-y-3">
        <RiskComponent label="Weather" value={riskScore.weatherRisk} />
        <RiskComponent label="Crop Health" value={riskScore.ndviRisk} />
        <RiskComponent label="Soil Moisture" value={riskScore.soilMoistureRisk} />
        <RiskComponent label="Pest & Disease" value={riskScore.pestRisk} />
        <RiskComponent label="Market Price" value={riskScore.marketRisk} />
      </div>

      {/* Impact Indicators */}
      {riskScore.yieldImpact !== undefined && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Yield Impact</p>
              <p className="text-2xl font-bold text-orange-600">{riskScore.yieldImpact.toFixed(0)}%</p>
            </div>
            {riskScore.repaymentRisk !== undefined && (
              <div>
                <p className="text-sm text-gray-600">Repayment Risk</p>
                <p className="text-2xl font-bold text-red-600">{riskScore.repaymentRisk.toFixed(0)}%</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskComponent({ label, value }: { label: string; value: number }) {
  const riskLevel = value >= 75 ? 'CRITICAL' : value >= 50 ? 'HIGH' : value >= 25 ? 'MEDIUM' : 'LOW';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium" style={{ color: getRiskColor(riskLevel) }}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${value}%`,
            backgroundColor: getRiskColor(riskLevel),
          }}
        />
      </div>
    </div>
  );
}
