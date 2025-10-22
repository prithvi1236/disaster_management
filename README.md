# Disaster Management System

A comprehensive web application for coordinating disaster response efforts, managing relief camps, volunteers, donations, and resource requests.

## 🌟 Features

### Core Functionality
- **Disaster Management**: Track active disasters with location, severity, and status
- **Relief Camp Coordination**: Manage camps with capacity, occupancy, and facilities
- **Volunteer Management**: Register volunteers, track skills, and assign to camps
- **Donation Tracking**: Record monetary and supply donations with full transparency
- **Resource Requests**: Camp coordinators can request resources with approval workflow
- **Real-time Dashboard**: Statistics and activity feeds for administrators

### User Roles
- **Admin**: Full system access, approve requests, manage all entities
- **Camp Coordinator**: Manage specific camps, create resource requests
- **Volunteer**: Access volunteer portal, view assignments and opportunities
- **Public Users**: View disasters, register as volunteers, make donations

### Technical Features
- **Authentication**: JWT-based authentication with role-based access control
- **RESTful API**: FastAPI backend with automatic OpenAPI documentation
- **Responsive Design**: Mobile-friendly React frontend
- **Real-time Data**: Live statistics and activity feeds
- **Demo Data**: Pre-populated with realistic Indian disaster scenarios

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Git

### Automated Setup
```bash
git clone <repository-url>
cd disaster_management
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### Backend Setup
```bash
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔑 Demo Credentials

The system comes pre-loaded with demo data and users:

- **Admin**: `username: admin`, `password: admin123`
- **Coordinator**: `username: coordinator1`, `password: coord123`
- **User**: `username: volunteer_user`, `password: user123`

## 📱 User Guide

### For Public Users
1. **View Disasters**: Browse active disasters and their details
2. **Register as Volunteer**: Fill out volunteer registration form
3. **Make Donations**: Contribute money or supplies to specific disasters
4. **Create Account**: Sign up for full access to the system

### For Volunteers
1. **Login**: Use your credentials to access the volunteer portal
2. **View Profile**: Check your volunteer information and status
3. **See Assignments**: View current and past assignments
4. **Find Opportunities**: Browse available volunteer positions

### For Camp Coordinators
1. **Login**: Access coordinator dashboard
2. **Manage Camps**: Update camp information and occupancy
3. **Request Resources**: Submit resource requests with priority levels
4. **Track Volunteers**: View assigned volunteers and their roles

### For Administrators
1. **Dashboard**: View system-wide statistics and recent activity
2. **Manage Disasters**: Create and update disaster information
3. **Approve Requests**: Review and approve resource requests
4. **Assign Volunteers**: Match volunteers to appropriate camps and roles

## 🏗️ Architecture

### Backend (FastAPI)
```
server/
├── app/
│   ├── routers/          # API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── disasters.py  # Disaster management
│   │   ├── camps.py      # Camp management
│   │   ├── volunteers.py # Volunteer management
│   │   ├── donations.py  # Donation tracking
│   │   └── statistics.py # Dashboard data
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py       # Database configuration
│   ├── auth.py          # Authentication utilities
│   └── seed_data.py     # Demo data generation
├── main.py              # FastAPI application
└── requirements.txt     # Python dependencies
```

### Frontend (React)
```
client/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API and auth services
│   ├── styles/         # CSS files
│   └── App.jsx         # Main application
├── package.json        # Node.js dependencies
└── vite.config.js      # Vite configuration
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Disasters
- `GET /api/disasters` - List all disasters
- `GET /api/disasters/{id}` - Get disaster details
- `POST /api/disasters` - Create disaster (Admin)

### Camps
- `GET /api/camps` - List all camps
- `GET /api/camps/{id}` - Get camp details
- `POST /api/camps` - Create camp (Admin)

### Volunteers
- `GET /api/volunteers` - List volunteers
- `POST /api/volunteers` - Register volunteer
- `PUT /api/volunteers/{id}` - Update volunteer

### Donations
- `GET /api/donations` - List donations
- `POST /api/donations` - Make donation

### Statistics
- `GET /api/statistics/dashboard` - Dashboard statistics
- `GET /api/statistics/disasters` - Per-disaster statistics

## 🗄️ Database Schema

The system uses SQLite with the following main entities:

- **Users**: Authentication and role management
- **Disasters**: Disaster information and status
- **Camps**: Relief camp details and capacity
- **Volunteers**: Volunteer profiles and skills
- **Donations**: Donation records and amounts
- **ResourceRequests**: Resource needs and approval status
- **VolunteerAssignments**: Volunteer-to-camp assignments
- **CampCoordinators**: Coordinator assignments

## 🔧 Development

### Adding New Features
1. **Backend**: Add new routes in `app/routers/`
2. **Frontend**: Create new pages in `src/pages/`
3. **Database**: Update models in `app/models.py`
4. **API**: Update schemas in `app/schemas.py`

### Running Tests
```bash
# Backend tests (when implemented)
cd server
pytest

# Frontend tests (when implemented)
cd client
npm test
```

### Building for Production
```bash
# Backend
cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd client
npm run build
```

## 🌍 Demo Data

The system includes realistic demo data featuring:
- 5 Indian disasters (Kerala Floods, Uttarakhand Landslide, etc.)
- 9 relief camps across different states
- 38 volunteers with diverse skills
- 30+ donations (monetary and supplies)
- Multiple resource requests with different priorities
- Volunteer assignments and coordinator roles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
1. Check the API documentation at `/docs`
2. Review the demo data in `server/app/seed_data.py`
3. Open an issue on GitHub

## 🎯 Future Enhancements

- Real-time notifications
- Mobile app development
- Integration with external APIs (weather, maps)
- Advanced reporting and analytics
- Multi-language support
- SMS/Email notifications
- Inventory management system
- Volunteer scheduling system