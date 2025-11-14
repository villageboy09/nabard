# API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints require JWT Bearer token authentication.

```http
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

---

## Risk APIs

### Get Dashboard Summary

#### GET /api/risks/dashboard

Get overview of all fields with current risk status.

**Response**:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalFields": 5,
      "fieldsAtRisk": 2,
      "averageRisk": "45.3"
    },
    "fields": [
      {
        "id": "uuid",
        "fieldCode": "FIELD-001",
        "area": 2.5,
        "cropType": "Rice",
        "cropStage": "flowering",
        "currentRisk": {
          "overallRisk": 65.5,
          "riskLevel": "HIGH",
          "weatherRisk": 70,
          "ndviRisk": 55,
          "soilMoistureRisk": 45,
          "pestRisk": 60,
          "marketRisk": 40
        }
      }
    ]
  }
}
```

### Calculate Field Risk

#### GET /api/risks/field/:fieldId/calculate

Calculate risk score for a specific field and forecast date.

**Query Parameters**:
- `forecastDate` (required): ISO date string (e.g., "2024-01-20")

**Response**:
```json
{
  "status": "success",
  "data": {
    "risk": {
      "overallRisk": 65.5,
      "riskLevel": "HIGH",
      "components": {
        "weatherRisk": 70,
        "ndviRisk": 55,
        "soilMoistureRisk": 45,
        "pestRisk": 60,
        "marketRisk": 40
      },
      "yieldImpact": 25.5,
      "repaymentRisk": 55.3,
      "confidence": 0.85
    },
    "analysis": {
      "summary": "The rice crop is experiencing high risk levels...",
      "recommendations": "- Increase irrigation frequency\n- Monitor for pest outbreak\n...",
      "actionableTips": ["Increase irrigation", "Scout for pests"],
      "urgencyLevel": "high"
    }
  }
}
```

### Get Field Risk History

#### GET /api/risks/field/:fieldId

Get historical risk scores for a field.

**Query Parameters**:
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date
- `limit` (optional): Number of records (default: 30)

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "fieldId": "uuid",
      "forecastDate": "2024-01-20",
      "overallRisk": 65.5,
      "riskLevel": "HIGH",
      "weatherRisk": 70,
      "ndviRisk": 55,
      "yieldImpact": 25.5,
      "geminiSummary": "AI-generated summary...",
      "recommendations": "AI recommendations..."
    }
  ]
}
```

### Batch Risk Calculation

#### POST /api/risks/calculate-all

Trigger risk calculation for all fields (admin only).

**Request Body**:
```json
{
  "days": 7
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "totalFields": 50,
    "processed": 48,
    "failed": 2
  }
}
```

---

## Field APIs

### List Fields

#### GET /api/fields

Get all fields for authenticated user.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "fieldCode": "FIELD-001",
      "area": 2.5,
      "latitude": 20.5937,
      "longitude": 78.9629,
      "soilType": "Clay Loam",
      "irrigationType": "Drip",
      "currentCrop": "Rice",
      "cropStage": "flowering",
      "sowingDate": "2024-01-01"
    }
  ]
}
```

### Get Field Details

#### GET /api/fields/:fieldId

Get detailed field information with risk scores, weather, and satellite data.

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "fieldCode": "FIELD-001",
    "area": 2.5,
    "currentCrop": "Rice",
    "riskScores": [...],
    "weatherData": [...],
    "satelliteData": [...],
    "soilData": [...]
  }
}
```

### Get Weather Forecast

#### GET /api/fields/:fieldId/weather

Get 7-15 day weather forecast for a field.

**Query Parameters**:
- `days` (optional): Number of days (default: 15)

**Response**:
```json
{
  "status": "success",
  "data": {
    "forecast": [
      {
        "date": "2024-01-20",
        "tempMin": 18,
        "tempMax": 32,
        "tempAvg": 25,
        "rainfall": 5,
        "humidity": 75,
        "windSpeed": 12,
        "heatStressIndex": 25
      }
    ],
    "extremeEvents": [
      {
        "type": "HEATWAVE",
        "date": "2024-01-22",
        "severity": "WARNING",
        "details": "Maximum temperature expected: 42°C"
      }
    ]
  }
}
```

### Get Satellite Data

#### GET /api/fields/:fieldId/satellite

Get NDVI and vegetation indices.

**Query Parameters**:
- `days` (optional): Historical days (default: 60)

**Response**:
```json
{
  "status": "success",
  "data": {
    "satelliteData": [
      {
        "captureDate": "2024-01-15",
        "ndvi": 0.65,
        "evi": 0.72,
        "savi": 0.58,
        "ndwi": 0.15,
        "healthStatus": "good",
        "stressLevel": 25,
        "cloudCover": 10
      }
    ],
    "trend": {
      "isDecline": false,
      "percentageChange": 5.2,
      "trend": "improving"
    }
  }
}
```

### Create Field

#### POST /api/fields

Create a new field.

**Request Body**:
```json
{
  "fieldCode": "FIELD-NEW",
  "area": 3.0,
  "latitude": 20.5937,
  "longitude": 78.9629,
  "soilType": "Sandy Loam",
  "irrigationType": "Sprinkler",
  "currentCrop": "Wheat",
  "sowingDate": "2024-01-10"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "fieldCode": "FIELD-NEW",
    ...
  }
}
```

### Update Field

#### PATCH /api/fields/:fieldId

Update field information.

**Request Body**:
```json
{
  "currentCrop": "Cotton",
  "cropStage": "vegetative"
}
```

---

## Alert APIs

### Get Alerts

#### GET /api/alerts

Get alerts for authenticated user.

**Query Parameters**:
- `status` (optional): `unread` | `all`
- `severity` (optional): `INFO` | `WARNING` | `CRITICAL`
- `type` (optional): Alert type
- `limit` (optional): Number of alerts (default: 50)

**Response**:
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "alertType": "WEATHER_EXTREME",
        "severity": "CRITICAL",
        "title": "Heatwave Alert",
        "message": "Extreme heat expected on 2024-01-22",
        "actionable": "Increase irrigation frequency...",
        "validFrom": "2024-01-22T00:00:00Z",
        "validUntil": "2024-01-23T00:00:00Z",
        "triggered": true,
        "sentAt": "2024-01-21T06:00:00Z",
        "readAt": null
      }
    ],
    "unreadCount": 5
  }
}
```

### Mark Alert as Read

#### PATCH /api/alerts/:alertId/read

Mark an alert as read.

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "readAt": "2024-01-21T10:30:00Z"
  }
}
```

### Get Alert Statistics

#### GET /api/alerts/stats

Get alert statistics for last 30 days.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "alertType": "WEATHER_EXTREME",
      "severity": "CRITICAL",
      "_count": 5
    },
    {
      "alertType": "PEST_DISEASE",
      "severity": "WARNING",
      "_count": 3
    }
  ]
}
```

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

---

## Pagination

For endpoints that return lists, use:
- `limit`: Number of items per page
- `offset`: Number of items to skip

---

## Webhooks (Future)

Webhook support for real-time alerts:
- `alert.created`
- `risk.high`
- `risk.critical`
