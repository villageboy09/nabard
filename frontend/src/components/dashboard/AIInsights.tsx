import { Brain, Lightbulb, TrendingDown } from 'lucide-react';
import type { RiskScore } from '@/types';

interface Props {
  riskScore: RiskScore;
}

export function AIInsights({ riskScore }: Props) {
  if (!riskScore.geminiSummary && !riskScore.recommendations) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Risk Analysis</h3>
        {riskScore.confidence && (
          <span className="ml-auto text-sm text-gray-600">
            Confidence: {(riskScore.confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {riskScore.geminiSummary && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Risk Summary</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {riskScore.geminiSummary}
          </p>
        </div>
      )}

      {riskScore.recommendations && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-gray-900">Recommendations</h4>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed space-y-2 whitespace-pre-line">
            {riskScore.recommendations}
          </div>
        </div>
      )}

      {riskScore.yieldImpact !== undefined && riskScore.yieldImpact > 10 && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                Expected Yield Impact: {riskScore.yieldImpact.toFixed(0)}%
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Taking preventive action now can help minimize crop losses
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
