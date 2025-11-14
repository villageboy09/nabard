export interface Field {
  id: string;
  fieldCode: string;
  area: number;
  latitude: number;
  longitude: number;
  boundary?: any;
  soilType?: string;
  irrigationType?: string;
  currentCrop?: string;
  cropVariety?: string;
  sowingDate?: string;
  expectedHarvest?: string;
  cropStage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskScore {
  id: string;
  fieldId: string;
  calculationDate: string;
  forecastDate: string;
  weatherRisk: number;
  ndviRisk: number;
  soilMoistureRisk: number;
  pestRisk: number;
  marketRisk: number;
  overallRisk: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  yieldImpact?: number;
  repaymentRisk?: number;
  geminiSummary?: string;
  recommendations?: string;
  confidence?: number;
}

export interface Alert {
  id: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  actionable?: string;
  validFrom: string;
  validUntil: string;
  triggered: boolean;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface WeatherData {
  date: string;
  forecastDate: string;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  heatStressIndex?: number;
}

export interface SatelliteData {
  captureDate: string;
  ndvi: number;
  evi: number;
  savi: number;
  ndwi: number;
  healthStatus: string;
  stressLevel: number;
  cloudCover: number;
}

export interface DashboardSummary {
  totalFields: number;
  fieldsAtRisk: number;
  averageRisk: string;
}

export interface FieldWithRisk extends Field {
  currentRisk: RiskScore | null;
}
