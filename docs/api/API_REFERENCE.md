# API Reference

## 🌐 REST API Documentation

**Base URL**: `https://api.devicetracker.com/v1`  
**Protocol**: HTTPS only (TLS 1.3)  
**Format**: JSON  
**Authentication**: JWT Bearer tokens

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Devices](#devices)
3. [Tracking](#tracking)
4. [Security Events](#security-events)
5. [Alerts](#alerts)
6. [Remote Actions](#remote-actions)
7. [AI Analysis](#ai-analysis)
8. [User Management](#user-management)

---

## 🔐 Authentication

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201):**
```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "message": "Registration successful. Please verify your email."
}
```

---

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "requiresTwoFactor": true,
  "tempToken": "temp-token-for-2fa"
}
```

**Or if 2FA disabled:**
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### POST /auth/verify-2fa

Verify 2FA code and complete login.

**Headers:**
```
Authorization: Bearer <temp-token>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response (200):**
```json
{
  "accessToken": "new-jwt-access-token",
  "expiresIn": 900
}
```

---

### POST /auth/logout

Revoke current session.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/enable-2fa

Enable two-factor authentication.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "secret": "base32-secret",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["code1", "code2", "..."]
}
```

---

## 📱 Devices

### POST /devices/pair

Initiate device pairing.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceName": "My iPhone",
  "deviceType": "ios",
  "osVersion": "17.2",
  "appVersion": "1.0.0",
  "deviceModel": "iPhone 15 Pro",
  "deviceUuid": "device-generated-uuid",
  "publicKey": "base64-encoded-public-key"
}
```

**Response (201):**
```json
{
  "deviceId": "uuid",
  "pairingCode": "ABC123",
  "expiresAt": "2026-02-27T12:00:00Z",
  "serverPublicKey": "base64-encoded-server-public-key"
}
```

---

### GET /devices

Get all paired devices for current user.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive devices

**Response (200):**
```json
{
  "devices": [
    {
      "id": "uuid",
      "deviceName": "My iPhone",
      "deviceType": "ios",
      "osVersion": "17.2",
      "deviceModel": "iPhone 15 Pro",
      "isActive": true,
      "isTrackingEnabled": true,
      "stealthMode": false,
      "pairedAt": "2026-02-20T10:30:00Z",
      "status": {
        "isOnline": true,
        "lastSeenAt": "2026-02-27T11:45:00Z",
        "batteryLevel": 85,
        "isCharging": false,
        "networkType": "wifi",
        "currentLocation": {
          "latitude": 40.7128,
          "longitude": -74.0060,
          "updatedAt": "2026-02-27T11:45:00Z"
        }
      }
    }
  ],
  "total": 1
}
```

---

### GET /devices/:deviceId

Get specific device details.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "deviceName": "My iPhone",
  "deviceType": "ios",
  "osVersion": "17.2",
  "appVersion": "1.0.0",
  "deviceModel": "iPhone 15 Pro",
  "isActive": true,
  "isTrackingEnabled": true,
  "stealthMode": false,
  "pairedAt": "2026-02-20T10:30:00Z",
  "createdAt": "2026-02-20T10:30:00Z",
  "settings": {
    "locationUpdateInterval": 60,
    "photoCaptureEnabled": true,
    "failedLoginThreshold": 3
  },
  "status": {
    "isOnline": true,
    "lastSeenAt": "2026-02-27T11:45:00Z",
    "batteryLevel": 85,
    "isCharging": false,
    "networkType": "wifi",
    "simStatus": "present",
    "airplaneMode": false,
    "isRootedJailbroken": false,
    "currentLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "updatedAt": "2026-02-27T11:45:00Z"
    }
  }
}
```

---

### PATCH /devices/:deviceId

Update device settings.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceName": "Updated Name",
  "isTrackingEnabled": false,
  "stealthMode": true,
  "settings": {
    "locationUpdateInterval": 120,
    "failedLoginThreshold": 2
  }
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "deviceName": "Updated Name",
  "isTrackingEnabled": false,
  "stealthMode": true,
  "updatedAt": "2026-02-27T12:00:00Z"
}
```

---

### DELETE /devices/:deviceId

Unpair and remove device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "message": "Device unpaired successfully"
}
```

---

## 📍 Tracking

### POST /tracking/location

Update device location (called by mobile app).

**Headers:**
```
Authorization: Bearer <device-token>
X-Device-ID: uuid
```

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "altitude": 50.5,
  "speed": 0,
  "heading": 180,
  "activity": "stationary",
  "batteryLevel": 85,
  "recordedAt": "2026-02-27T11:45:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "locationId": "bigint-id"
}
```

---

### POST /tracking/location/batch

Upload multiple location points (offline sync).

**Headers:**
```
Authorization: Bearer <device-token>
X-Device-ID: uuid
```

**Request Body:**
```json
{
  "locations": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "recordedAt": "2026-02-27T11:00:00Z"
    },
    {
      "latitude": 40.7130,
      "longitude": -74.0062,
      "accuracy": 15,
      "recordedAt": "2026-02-27T11:15:00Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "processed": 2,
  "failed": 0
}
```

---

### GET /tracking/location/history/:deviceId

Get location history for a device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `startDate` (ISO8601, required): Start of date range
- `endDate` (ISO8601, required): End of date range
- `limit` (integer, optional, default: 1000): Max results
- `offset` (integer, optional, default: 0): Pagination offset

**Response (200):**
```json
{
  "locations": [
    {
      "id": "bigint-id",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "altitude": 50.5,
      "speed": 0,
      "heading": 180,
      "activity": "stationary",
      "recordedAt": "2026-02-27T11:45:00Z"
    }
  ],
  "total": 1500,
  "hasMore": true
}
```

---

### GET /tracking/location/current/:deviceId

Get current location of a device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "deviceId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "updatedAt": "2026-02-27T11:45:00Z",
  "batteryLevel": 85,
  "isOnline": true
}
```

---

## 🚨 Security Events

### POST /security/events

Report a security event (called by mobile app).

**Headers:**
```
Authorization: Bearer <device-token>
X-Device-ID: uuid
```

**Request Body:**
```json
{
  "eventType": "failed_login",
  "severity": "high",
  "description": "3 failed login attempts detected",
  "metadata": {
    "attemptCount": 3,
    "lastAttemptTime": "2026-02-27T11:30:00Z",
    "incorrectPasswords": ["****", "****", "****"]
  },
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "photoBase64": "base64-encoded-image",
  "occurredAt": "2026-02-27T11:30:00Z"
}
```

**Response (201):**
```json
{
  "eventId": "uuid",
  "photoUrl": "https://s3.amazonaws.com/bucket/photo.jpg",
  "alertCreated": true
}
```

---

### GET /security/events/:deviceId

Get security events for a device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `startDate` (ISO8601, optional): Filter by start date
- `endDate` (ISO8601, optional): Filter by end date
- `eventType` (string, optional): Filter by event type
- `severity` (string, optional): Filter by severity
- `unacknowledged` (boolean, optional): Only unacknowledged events
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response (200):**
```json
{
  "events": [
    {
      "id": "uuid",
      "eventType": "failed_login",
      "severity": "high",
      "description": "3 failed login attempts detected",
      "metadata": {
        "attemptCount": 3,
        "lastAttemptTime": "2026-02-27T11:30:00Z"
      },
      "latitude": 40.7128,
      "longitude": -74.0060,
      "photoUrl": "https://s3.amazonaws.com/bucket/photo.jpg",
      "acknowledged": false,
      "occurredAt": "2026-02-27T11:30:00Z"
    }
  ],
  "total": 25,
  "hasMore": false
}
```

---

### PATCH /security/events/:eventId/acknowledge

Acknowledge a security event.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "acknowledged": true,
  "acknowledgedAt": "2026-02-27T12:00:00Z"
}
```

---

## 🔔 Alerts

### GET /alerts

Get alerts for current user.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `unreadOnly` (boolean, optional): Only unread alerts
- `deviceId` (uuid, optional): Filter by device
- `alertType` (string, optional): Filter by type
- `priority` (string, optional): Filter by priority
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response (200):**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "title": "Failed Login Attempts",
      "message": "3 failed login attempts detected on My iPhone",
      "alertType": "security",
      "priority": "high",
      "deviceId": "uuid",
      "deviceName": "My iPhone",
      "securityEventId": "uuid",
      "isRead": false,
      "dismissed": false,
      "createdAt": "2026-02-27T11:30:00Z"
    }
  ],
  "total": 10,
  "unreadCount": 3
}
```

---

### PATCH /alerts/:alertId/read

Mark alert as read.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "isRead": true,
  "readAt": "2026-02-27T12:00:00Z"
}
```

---

### PATCH /alerts/:alertId/dismiss

Dismiss an alert.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "dismissed": true,
  "dismissedAt": "2026-02-27T12:00:00Z"
}
```

---

### PATCH /alerts/read-all

Mark all alerts as read.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "updatedCount": 5
}
```

---

## 🎮 Remote Actions

### POST /actions/lock

Send lock command to device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceId": "uuid",
  "message": "Device locked remotely"
}
```

**Response (200):**
```json
{
  "actionId": "uuid",
  "status": "pending",
  "expiresAt": "2026-02-27T12:05:00Z"
}
```

---

### POST /actions/alarm

Trigger alarm on device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceId": "uuid",
  "duration": 30
}
```

**Response (200):**
```json
{
  "actionId": "uuid",
  "status": "pending",
  "expiresAt": "2026-02-27T12:05:00Z"
}
```

---

### POST /actions/wipe

Wipe device data (requires additional confirmation).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceId": "uuid",
  "confirmationCode": "user-password-or-2fa"
}
```

**Response (200):**
```json
{
  "actionId": "uuid",
  "status": "pending",
  "expiresAt": "2026-02-27T12:05:00Z",
  "warning": "This action cannot be undone"
}
```

---

### POST /actions/request-photo

Request device to capture and send photo.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceId": "uuid",
  "camera": "front"
}
```

**Response (200):**
```json
{
  "actionId": "uuid",
  "status": "pending",
  "expiresAt": "2026-02-27T12:05:00Z"
}
```

---

### GET /actions/:actionId

Get action status.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "actionType": "lock",
  "deviceId": "uuid",
  "status": "executed",
  "result": {
    "success": true,
    "executedAt": "2026-02-27T12:01:00Z"
  },
  "createdAt": "2026-02-27T12:00:00Z",
  "executedAt": "2026-02-27T12:01:00Z"
}
```

---

### GET /actions/device/:deviceId

Get action history for a device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response (200):**
```json
{
  "actions": [
    {
      "id": "uuid",
      "actionType": "lock",
      "status": "executed",
      "createdAt": "2026-02-27T12:00:00Z",
      "executedAt": "2026-02-27T12:01:00Z"
    }
  ],
  "total": 15
}
```

---

## 🤖 AI Analysis

### POST /ai/analyze-image

Analyze image for AI generation and manipulation.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
image: <file>
```

**Response (200):**
```json
{
  "analysisId": "uuid",
  "imageUrl": "https://s3.amazonaws.com/bucket/analysis-image.jpg",
  "results": {
    "isAiGenerated": false,
    "aiProbability": 0.15,
    "isEdited": true,
    "editProbability": 0.75,
    "authenticityScore": 0.68,
    "confidenceLevel": "high",
    "metadataAnomalies": {
      "found": true,
      "issues": [
        "GPS coordinates don't match EXIF timestamp",
        "Software tag shows Photoshop"
      ]
    },
    "lightingInconsistencies": {
      "found": true,
      "score": 0.62,
      "details": "Multiple light sources detected with conflicting angles"
    },
    "compressionArtifacts": {
      "found": false,
      "score": 0.98
    },
    "explanation": "Image shows signs of editing with inconsistent lighting patterns. Metadata indicates Photoshop use. Low probability of AI generation based on noise patterns.",
    "detailedReport": {
      "exifData": {...},
      "colorAnalysis": {...},
      "frequencyAnalysis": {...}
    }
  },
  "processingTimeMs": 3250,
  "modelVersion": "1.2.0",
  "analyzedAt": "2026-02-27T12:00:00Z"
}
```

---

### GET /ai/analysis/:analysisId

Get previous analysis results.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "imageUrl": "https://s3.amazonaws.com/bucket/analysis-image.jpg",
  "results": {...},
  "analyzedAt": "2026-02-27T12:00:00Z"
}
```

---

### GET /ai/analysis/history

Get analysis history for current user.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `limit` (integer, optional, default: 20)
- `offset` (integer, optional, default: 0)

**Response (200):**
```json
{
  "analyses": [
    {
      "id": "uuid",
      "imageUrl": "https://s3.amazonaws.com/bucket/analysis-image.jpg",
      "authenticityScore": 0.68,
      "isAiGenerated": false,
      "isEdited": true,
      "analyzedAt": "2026-02-27T12:00:00Z"
    }
  ],
  "total": 45
}
```

---

## 👤 User Management

### GET /users/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "twoFactorEnabled": true,
  "subscriptionTier": "pro",
  "subscriptionExpiresAt": "2027-02-27T00:00:00Z",
  "createdAt": "2025-02-27T10:00:00Z"
}
```

---

### PATCH /users/me

Update user profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "phoneNumber": "+9876543210"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+9876543210",
  "updatedAt": "2026-02-27T12:00:00Z"
}
```

---

### POST /users/change-password

Change user password.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### DELETE /users/me

Delete user account (requires confirmation).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "password": "user-password",
  "confirmationText": "DELETE MY ACCOUNT"
}
```

**Response (200):**
```json
{
  "message": "Account deletion scheduled. Your data will be permanently removed within 30 days."
}
```

---

## 🌐 WebSocket Events

**Connection URL**: `wss://api.devicetracker.com/v1/ws`

**Authentication**: Send JWT token after connection
```json
{
  "type": "auth",
  "token": "jwt-access-token"
}
```

### Server → Client Events

#### location_update
```json
{
  "type": "location_update",
  "deviceId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "batteryLevel": 85,
  "timestamp": "2026-02-27T11:45:00Z"
}
```

#### security_alert
```json
{
  "type": "security_alert",
  "alertId": "uuid",
  "deviceId": "uuid",
  "severity": "high",
  "title": "Failed Login Attempts",
  "message": "3 failed login attempts detected",
  "timestamp": "2026-02-27T11:30:00Z"
}
```

#### device_status_change
```json
{
  "type": "device_status_change",
  "deviceId": "uuid",
  "status": {
    "isOnline": false,
    "lastSeenAt": "2026-02-27T11:45:00Z",
    "batteryLevel": 5
  }
}
```

#### action_result
```json
{
  "type": "action_result",
  "actionId": "uuid",
  "deviceId": "uuid",
  "status": "executed",
  "result": {
    "success": true
  }
}
```

### Client → Server Events

#### subscribe_device
```json
{
  "type": "subscribe_device",
  "deviceId": "uuid"
}
```

#### unsubscribe_device
```json
{
  "type": "unsubscribe_device",
  "deviceId": "uuid"
}
```

---

## 📊 Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Regular API endpoints**: 100 requests per minute
- **Location updates**: 1 request per second per device
- **WebSocket connections**: 10 concurrent per user

**Rate limit headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1677503400
```

---

## ❌ Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2026-02-27T12:00:00Z",
  "path": "/api/endpoint"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or expired token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| DEVICE_OFFLINE | 503 | Device not reachable |

---

**API Version**: 1.0.0  
**Last Updated**: February 2026
