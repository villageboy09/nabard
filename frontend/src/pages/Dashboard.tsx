import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, TrendingUp, AlertTriangle, Leaf } from 'lucide-react';
import { riskApi, alertApi } from '@/services/api';
import { FieldMap } from '@/components/maps/FieldMap';
import { AlertsList } from '@/components/alerts/AlertsList';
import { getRiskColor, getRiskBgColor } from '@/utils/risk';
import { useStore } from '@/store/useStore';
import type { FieldWithRisk } from '@/types';

export function Dashboard() {
  const { setSelectedField, setAlerts, setUnreadAlertCount } = useStore();
  const [selectedTab, setSelectedTab] = useState<'map' | 'alerts'>('map');

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: riskApi.getDashboard,
  });

  // Fetch alerts
  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertApi.getAlerts({ limit: 50 }),
  });

  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData.alerts);
      setUnreadAlertCount(alertsData.unreadCount);
    }
  }, [alertsData, setAlerts, setUnreadAlertCount]);

  const handleFieldSelect = (field: FieldWithRisk) => {
    setSelectedField(field);
    // In a real app, navigate to field details page
    console.log('Selected field:', field);
  };

  const handleAlertRead = () => {
    refetchAlerts();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const fields = dashboardData?.fields || [];
  const alerts = alertsData?.alerts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agricultural Risk Mitigation Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">7-15 Day Forward-Looking Risk Analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
                {alertsData && alertsData.unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alertsData.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Fields</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalFields}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fields at Risk</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.fieldsAtRisk}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.averageRisk}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              <button
                onClick={() => setSelectedTab('map')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'map'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Field Map View
              </button>
              <button
                onClick={() => setSelectedTab('alerts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'alerts'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Alerts
                {alertsData && alertsData.unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {alertsData.unreadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {selectedTab === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-4 h-[600px]">
                <h2 className="text-lg font-semibold mb-4">Field Locations & Risk Heat Map</h2>
                <div className="h-[calc(100%-2rem)]">
                  <FieldMap fields={fields} onFieldSelect={handleFieldSelect} />
                </div>
              </div>
            </div>

            {/* Fields List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 max-h-[600px] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Your Fields</h2>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 cursor-pointer transition-colors"
                      onClick={() => handleFieldSelect(field)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{field.fieldCode}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Leaf className="w-4 h-4" />
                            {field.currentCrop || 'No crop'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{field.area} ha • {field.cropStage || 'N/A'}</p>
                        </div>
                        {field.currentRisk && (
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskBgColor(
                                field.currentRisk.riskLevel
                              )}`}
                            >
                              {field.currentRisk.riskLevel}
                            </span>
                            <p className="text-2xl font-bold mt-1" style={{ color: getRiskColor(field.currentRisk.riskLevel) }}>
                              {field.currentRisk.overallRisk.toFixed(0)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Active Alerts & Warnings</h2>
            <AlertsList alerts={alerts} onAlertRead={handleAlertRead} />
          </div>
        )}
      </div>
    </div>
  );
}
