# Authentication and Authorization Guide

## Overview

The Disaster Relief Management System implements role-based authentication with three user roles:

- **Admin**: Full system access, can manage all resources and users
- **Camp Coordinator**: Can manage camps, volunteers, and donations
- **Volunteer User**: Basic access, can view information and register as volunteer

## User Roles

### Admin (`admin`)
- Create, update, delete disasters
- Create, update, delete camps
- Manage user roles
- Delete any resource
- Full system access

### Camp Coordinator (`camp_coordinator`)
- Create and update camps
- Update volunteers and donations
- View all resources
- Cannot delete disasters or manage user roles

### Volunteer User (`volunteer_user`)
- View disasters, camps, donations, volunteers
- Register as volunteer
- Create donations
- Cannot modify existing resources (except own profile)

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "secure_password123",
  "role": "volunteer_user"  // Optional, defaults to volunteer_user
}
```

**Response:**
```json
{
  "user_id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "volunteer_user",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update Current User Profile
```http
PUT /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "full_name": "John Updated Doe",
  "email": "john.updated@example.com"
}
```

## Admin-Only Endpoints

### Get All Users
```http
GET /api/auth/users?skip=0&limit=100
Authorization: Bearer <admin_token>
```

### Update User Role
```http
PUT /api/auth/users/{user_id}/role?new_role=camp_coordinator
Authorization: Bearer <admin_token>
```

## Protected Endpoints

### Disasters
- `GET /api/disasters/` - Public (no auth required)
- `GET /api/disasters/{id}` - Public (no auth required)
- `POST /api/disasters/` - Admin only
- `PUT /api/disasters/{id}` - Camp Coordinator or Admin
- `DELETE /api/disasters/{id}` - Admin only

### Camps
- `GET /api/camps/` - Public (no auth required)
- `GET /api/camps/{id}` - Public (no auth required)
- `POST /api/camps/` - Camp Coordinator or Admin
- `PUT /api/camps/{id}` - Camp Coordinator or Admin
- `DELETE /api/camps/{id}` - Admin only

### Donations
- `GET /api/donations/` - Public (no auth required)
- `GET /api/donations/{id}` - Public (no auth required)
- `POST /api/donations/` - Public (no auth required)
- `PUT /api/donations/{id}` - Camp Coordinator or Admin
- `DELETE /api/donations/{id}` - Admin only

### Volunteers
- `GET /api/volunteers/` - Public (no auth required)
- `GET /api/volunteers/{id}` - Public (no auth required)
- `POST /api/volunteers/` - Public (no auth required)
- `PUT /api/volunteers/{id}` - Camp Coordinator or Admin
- `DELETE /api/volunteers/{id}` - Admin only

## Using Authentication in Requests

### 1. Register and Login
```bash
# Register a new user
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "password": "admin123",
    "role": "admin"
  }'

# Login to get token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "admin123"
  }'
```

### 2. Use Token in Requests
```bash
# Store token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create a disaster (admin only)
curl -X POST "http://localhost:8000/api/disasters/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hurricane Example",
    "type": "Hurricane",
    "location": "Florida",
    "severity_level": "High",
    "start_date": "2024-01-01T00:00:00"
  }'
```

## Error Responses

### Authentication Errors
```json
{
  "error": true,
  "message": "Could not validate credentials",
  "timestamp": "2024-01-01T00:00:00",
  "path": "/api/auth/me",
  "status_code": 401
}
```

### Authorization Errors
```json
{
  "error": true,
  "message": "Admin access required",
  "timestamp": "2024-01-01T00:00:00",
  "path": "/api/disasters/",
  "status_code": 403
}
```

### Validation Errors
```json
{
  "error": true,
  "message": "Validation error",
  "details": {
    "email": "field required",
    "password": "ensure this value has at least 8 characters"
  },
  "timestamp": "2024-01-01T00:00:00",
  "path": "/api/auth/register",
  "status_code": 422
}
```

## Frontend Integration

### JavaScript/React Example
```javascript
// Login function
async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  } else {
    throw new Error('Login failed');
  }
}

// Authenticated request function
async function authenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

// Create disaster (admin only)
async function createDisaster(disasterData) {
  const response = await authenticatedRequest('/api/disasters/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(disasterData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}
```

## Security Notes

1. **Token Expiration**: JWT tokens expire after 30 minutes
2. **Password Security**: Passwords are hashed using SHA256 (upgrade to bcrypt in production)
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: Store tokens securely (consider httpOnly cookies for web apps)
5. **Role Validation**: All protected endpoints validate user roles server-side

## Testing Authentication

Run the test suite to verify authentication functionality:

```bash
cd server
python -m pytest tests/test_auth.py -v
```

This will test:
- User registration and login
- Token validation
- Role-based access control
- Error handling