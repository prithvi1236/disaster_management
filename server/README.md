# Disaster Management System - FastAPI Backend

## Overview

This is the FastAPI backend for the Disaster Management System, providing REST API endpoints for managing disasters, relief camps, donations, and volunteers.

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip or poetry

### Installation

```bash
cd server
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the server directory:

```
DATABASE_URL=sqlite:///./disaster_management.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Disasters

- `GET /api/disasters` - Get all disasters
- `GET /api/disasters/:id` - Get disaster by ID
- `POST /api/disasters` - Create new disaster
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

### Relief Camps

- `GET /api/camps` - Get all camps
- `GET /api/camps/:id` - Get camp by ID
- `GET /api/camps?disaster_id=:id` - Get camps by disaster
- `POST /api/camps` - Create new camp
- `PUT /api/camps/:id` - Update camp
- `DELETE /api/camps/:id` - Delete camp

### Donations

- `GET /api/donations` - Get all donations
- `GET /api/donations/:id` - Get donation by ID
- `GET /api/donations?disaster_id=:id` - Get donations by disaster
- `POST /api/donations` - Create new donation
- `PUT /api/donations/:id` - Update donation
- `DELETE /api/donations/:id` - Delete donation

### Volunteers

- `GET /api/volunteers` - Get all volunteers
- `GET /api/volunteers/:id` - Get volunteer by ID
- `POST /api/volunteers` - Register new volunteer
- `PUT /api/volunteers/:id` - Update volunteer
- `DELETE /api/volunteers/:id` - Delete volunteer

## Database Schema

See `docs/database-schema.md` for detailed database structure.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
