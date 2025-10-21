# Disaster Relief Management System API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Most endpoints require authentication using JWT Bearer tokens. See [AUTH_GUIDE.md](./AUTH_GUIDE.md) for details.

## Error Response Format
All errors follow this standardized format:
```json
{
  "error": true,
  "message": "Error description",
  "details": {}, // Optional additional details
  "timestamp": "2024-01-01T00:00:00",
  "path": "/api/endpoint",
  "status_code": 400
}
```

## Endpoints

### Health Check
```http
GET /health
```
Returns system health status.

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```
**Body:**
```json
{
  "username": "string",
  "email": "string",
  "full_name": "string",
  "password": "string",
  "role": "admin|camp_coordinator|volunteer_user" // Optional
}
```

#### Login User
```http
POST /api/auth/login
```
**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Current User
```http
PUT /api/auth/me
Authorization: Bearer <token>
```

#### Get All Users (Admin Only)
```http
GET /api/auth/users?skip=0&limit=100
Authorization: Bearer <admin_token>
```

#### Update User Role (Admin Only)
```http
PUT /api/auth/users/{user_id}/role?new_role=<role>
Authorization: Bearer <admin_token>
```

### Disaster Endpoints

#### Get All Disasters
```http
GET /api/disasters/?skip=0&limit=100
```
**Response:**
```json
[
  {
    "disaster_id": 1,
    "name": "Hurricane Example",
    "type": "Hurricane",
    "location": "Florida",
    "severity_level": "High",
    "status": "Active",
    "start_date": "2024-01-01T00:00:00",
    "end_date": null,
    "description": "Major hurricane affecting coastal areas",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

#### Get Disaster by ID
```http
GET /api/disasters/{disaster_id}
```

#### Create Disaster (Admin Only)
```http
POST /api/disasters/
Authorization: Bearer <admin_token>
```
**Body:**
```json
{
  "name": "string",
  "type": "string",
  "location": "string",
  "severity_level": "Low|Medium|High|Critical",
  "status": "Active|Resolved", // Optional
  "start_date": "2024-01-01T00:00:00",
  "end_date": "2024-01-01T00:00:00", // Optional
  "description": "string" // Optional
}
```

#### Update Disaster (Camp Coordinator or Admin)
```http
PUT /api/disasters/{disaster_id}
Authorization: Bearer <token>
```

#### Delete Disaster (Admin Only)
```http
DELETE /api/disasters/{disaster_id}
Authorization: Bearer <admin_token>
```

### Camp Endpoints

#### Get All Camps
```http
GET /api/camps/?skip=0&limit=100&disaster_id=1
```
**Query Parameters:**
- `skip`: Number of records to skip (pagination)
- `limit`: Maximum number of records to return
- `disaster_id`: Filter by disaster ID (optional)

#### Get Camp by ID
```http
GET /api/camps/{camp_id}
```

#### Create Camp (Camp Coordinator or Admin)
```http
POST /api/camps/
Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "string",
  "location": "string",
  "capacity": 100,
  "occupancy": 0, // Optional
  "contact_info": "string", // Optional
  "facilities": "string", // Optional
  "disaster_id": 1
}
```

#### Update Camp (Camp Coordinator or Admin)
```http
PUT /api/camps/{camp_id}
Authorization: Bearer <token>
```

#### Delete Camp (Admin Only)
```http
DELETE /api/camps/{camp_id}
Authorization: Bearer <admin_token>
```

### Donation Endpoints

#### Get All Donations
```http
GET /api/donations/?skip=0&limit=100&disaster_id=1
```

#### Get Donation by ID
```http
GET /api/donations/{donation_id}
```

#### Create Donation
```http
POST /api/donations/
```
**Body:**
```json
{
  "donor_name": "string", // Optional
  "donor_email": "string", // Optional
  "donor_phone": "string", // Optional
  "donation_type": "Money|Food|Medical|Clothing|Other",
  "amount": 1000.0, // For monetary donations
  "quantity": "string", // For supply donations
  "disaster_id": 1,
  "status": "Received|Distributed" // Optional
}
```

#### Update Donation (Camp Coordinator or Admin)
```http
PUT /api/donations/{donation_id}
Authorization: Bearer <token>
```

#### Delete Donation (Admin Only)
```http
DELETE /api/donations/{donation_id}
Authorization: Bearer <admin_token>
```

### Volunteer Endpoints

#### Get All Volunteers
```http
GET /api/volunteers/?skip=0&limit=100&disaster_id=1
```

#### Get Volunteer by ID
```http
GET /api/volunteers/{volunteer_id}
```

#### Register Volunteer
```http
POST /api/volunteers/
```
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string", // Optional
  "skills": "string", // Optional
  "availability": "string", // Optional
  "emergency_contact": "string", // Optional
  "background_check": false, // Optional
  "status": "Active|Inactive", // Optional
  "disaster_id": 1 // Optional
}
```

#### Update Volunteer (Camp Coordinator or Admin)
```http
PUT /api/volunteers/{volunteer_id}
Authorization: Bearer <token>
```

#### Delete Volunteer (Admin Only)
```http
DELETE /api/volunteers/{volunteer_id}
Authorization: Bearer <admin_token>
```

### Statistics Endpoints

#### Get Dashboard Statistics
```http
GET /api/statistics/dashboard
```
**Response:**
```json
{
  "total_disasters": 5,
  "active_disasters": 3,
  "total_camps": 15,
  "total_volunteers": 120,
  "total_donations": 250,
  "total_donation_amount": 50000.0,
  "pending_resource_requests": 8
}
```

#### Get Disaster Statistics
```http
GET /api/statistics/disasters
```

#### Get Recent Activity
```http
GET /api/statistics/recent-activity?limit=10
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error
- `503` - Service Unavailable (database error)

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Pagination

List endpoints support pagination using `skip` and `limit` query parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100, max: 1000)

## Filtering

Some endpoints support filtering:
- Camps: Filter by `disaster_id`
- Donations: Filter by `disaster_id`
- Volunteers: Filter by `disaster_id`

## CORS

CORS is enabled for:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)

## WebSocket Support

Currently not implemented. Consider adding for real-time updates.

## API Versioning

Current API is version 1.0. Future versions should use URL versioning (e.g., `/api/v2/`).