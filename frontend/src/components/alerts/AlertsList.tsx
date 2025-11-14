import { AlertCircle, Bell, CheckCircle, Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/risk';
import { alertApi } from '@/services/api';
import type { Alert } from '@/types';

interface Props {
  alerts: Alert[];
  onAlertRead?: (alertId: string) => void;
}

export function AlertsList({ alerts, onAlertRead }: Props) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200';
      case 'WARNING':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await alertApi.markAsRead(alertId);
      onAlertRead?.(alertId);
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 ${getSeverityBg(alert.severity)} ${
            !alert.readAt ? 'border-l-4' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                {!alert.readAt && (
                  <span className="flex-shrink-0 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
              {alert.actionable && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">Recommended Actions:</p>
                  <p className="text-sm text-gray-700 mt-1">{alert.actionable}</p>
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(alert.createdAt)}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {alert.alertType.replace(/_/g, ' ')}
                </span>
              </div>
              {!alert.readAt && (
                <button
                  onClick={() => handleMarkAsRead(alert.id)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
