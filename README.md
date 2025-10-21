# Disaster Relief Management System

A comprehensive web application for managing disaster relief operations, including disaster tracking, relief camps, donations, volunteers, and real-time analytics.

## 🚀 Features

### Core Functionality
- **Disaster Management**: Track active disasters with severity levels and status updates
- **Relief Camps**: Manage evacuation centers with capacity and occupancy tracking
- **Donation System**: Handle monetary and resource donations with real-time tracking
- **Volunteer Management**: Coordinate volunteer assignments and skill matching
- **Real-time Analytics**: Comprehensive statistics and dashboard insights

### Technical Features
- **Authentication**: JWT-based secure user authentication and authorization
- **API Documentation**: RESTful API with comprehensive endpoint documentation
- **Error Handling**: Global error handling with standardized response formats
- **Health Monitoring**: System health checks and component status monitoring
- **Testing**: Comprehensive test coverage for all major components

## 🛠 Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with SQLite
- **JWT Authentication**: Secure token-based authentication
- **Pydantic**: Data validation and serialization
- **Pytest**: Testing framework

### Frontend
- **React 19**: Modern React with hooks
- **React Router**: Client-side routing
- **Vite**: Fast build tool and development server
- **CSS Modules**: Scoped styling

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **npm or yarn**

### Recommended IDE Setup

**VS Code Users:**
- Install recommended extensions when prompted
- The project includes workspace-specific settings for Python and JavaScript development

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd disaster-relief-management
```

### 2. Backend Setup
```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database with demo data
python -c "
import asyncio
from app.database import create_tables, seed_demo_data
asyncio.run(create_tables())
asyncio.run(seed_demo_data())
"

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL (default: http://localhost:8000)

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔐 Authentication

### Demo Accounts
The system comes with pre-seeded demo accounts:

**Admin User:**
- Username: `admin`
- Password: `admin123`

**Regular User:**
- Username: `user`
- Password: `user123`

### Registration
New users can register through the signup page with:
- Username
- Email
- Full name
- Password

## 📊 API Endpoints

### Core Resources
- `GET /api/disasters` - List all disasters
- `GET /api/camps` - List relief camps
- `GET /api/donations` - List donations
- `GET /api/volunteers` - List volunteers

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Statistics
- `GET /api/statistics/dashboard` - Dashboard statistics
- `GET /api/statistics/disasters` - Disaster analytics
- `GET /api/statistics/recent-activity` - Recent system activity

### Health Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health

## 🧪 Testing

### Backend Tests
```bash
cd server
pytest
```

### Frontend Tests
```bash
cd client
npm test
```

## 🏗 Project Structure

```
disaster-relief-management/
├── server/                 # Backend FastAPI application
│   ├── app/
│   │   ├── routers/       # API route handlers
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── database.py    # Database configuration
│   │   ├── middleware.py  # Custom middleware
│   │   └── auth_utils.py  # Authentication utilities
│   ├── tests/             # Backend tests
│   ├── main.py           # FastAPI application entry point
│   └── requirements.txt   # Python dependencies
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   └── styles/        # CSS stylesheets
│   ├── public/           # Static assets
│   └── package.json      # Node.js dependencies
└── tests/                # Integration tests
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=sqlite:///./disaster_management.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Use a production WSGI server like Gunicorn
3. Configure a production database (PostgreSQL recommended)
4. Set up reverse proxy (Nginx recommended)

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve the `dist` folder with a web server
3. Configure API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the test files for usage examples

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Mobile application
- [ ] Advanced analytics and reporting
- [ ] Integration with external emergency services
- [ ] Multi-language support
- [ ] Offline capability