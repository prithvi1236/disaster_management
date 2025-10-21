# Disaster Relief Management System - User Guide

## 🚀 Quick Start

### 1. Access the System
- Open your browser and go to: **http://localhost:5173**
- The system should load with a landing page

### 2. Login with Demo Accounts

#### Admin User (Full Access)
- **Username**: `admin`
- **Password**: `admin123`
- **Capabilities**: Create disasters, manage users, delete resources, full system access

#### Camp Coordinator (Management Access)
- **Username**: `coordinator1`
- **Password**: `coord123`
- **Capabilities**: Manage camps, update volunteers/donations, view all data

#### Volunteer User (Basic Access)
- **Username**: `volunteer_user`
- **Password**: `user123`
- **Capabilities**: View data, register as volunteer, create donations

## 📱 Testing Different User Roles

### As Admin User
1. **Login** with admin credentials
2. **Dashboard**: View comprehensive system statistics with admin panel button
3. **Admin Panel**: Click "Admin Panel" to access:
   - **Create Disasters**: Add new disasters with details
   - **Create Camps**: Set up new relief camps
   - **Manage Users**: View all users and change their roles
   - **Delete Resources**: Remove disasters (camps deletion available)
4. **View Statistics**: Check the statistics page for detailed analytics
5. **Full API Access**: All endpoints accessible with admin privileges

### As Camp Coordinator
1. **Login** with coordinator credentials
2. **Dashboard**: View management-level statistics with coordinator panel button
3. **Coordinator Panel**: Click "Coordinator Panel" to access:
   - **Manage Camps**: View camp occupancy, update occupancy rates
   - **Request Resources**: Submit resource requests for camps
   - **Assign Volunteers**: Assign volunteers to specific camps and roles
4. **Browse Data**: View disasters, camps, donations, volunteers
5. **Management Access**: Can update camps, volunteers, and donations

### As Volunteer User
1. **Login** with volunteer user credentials
2. **Dashboard**: View basic statistics
3. **Volunteer Signup**: Register as a volunteer for disasters
4. **Make Donation**: Create monetary or supply donations
5. **View Only**: Cannot modify existing data

## 🧪 Testing Features

### 1. Browse Disasters
- Navigate to "Disasters" in the header
- View the 5 seeded disasters (Kerala Floods, Uttarakhand Landslide, etc.)
- Click on individual disasters to see details

### 2. View Relief Camps
- Check camp information and occupancy rates
- See capacity utilization and facilities

### 3. Donation System
- Go to "Donate" in the header
- Fill out donation form (works without login)
- Try both monetary and supply donations

### 4. Volunteer Registration
- Go to "Volunteer" in the header
- Register as a volunteer (works without login)
- Provide skills and availability information

### 5. Statistics Dashboard
- Login and go to "Dashboard"
- View real-time statistics:
  - 5 disasters (3 active)
  - 9 relief camps
  - 30+ donations
  - 38+ volunteers
- Check occupancy rates and capacity utilization

## 🔍 What to Look For

### ✅ Working Features
- **Authentication**: Login/logout with different roles
- **Role-Based Access**: Different capabilities per user type
- **Data Display**: All entities showing realistic Indian disaster data
- **Statistics**: Real-time dashboard with accurate counts
- **Forms**: Donation and volunteer registration working
- **Navigation**: Responsive header with role-based menu items
- **Error Handling**: Proper error messages for invalid actions

### 🎯 Key Test Scenarios

#### Scenario 1: Public User Journey
1. Visit homepage without login
2. Browse disasters and camps
3. Register as volunteer
4. Make a donation
5. Sign up for account
6. Login and access dashboard

#### Scenario 2: Admin Workflow
1. Login as admin
2. View comprehensive dashboard with admin panel access
3. Access Admin Panel and create a new disaster
4. Create a new camp for the disaster
5. View and manage user roles
6. Test full system management capabilities

#### Scenario 3: Camp Coordinator Workflow
1. Login as camp coordinator
2. Access Coordinator Panel from dashboard
3. Update camp occupancy rates
4. Submit a resource request for a camp
5. Assign volunteers to camps with specific roles
6. Test camp management capabilities

#### Scenario 4: Role-Based Access
1. Login as different user types
2. Notice different menu options and panel access
3. Try accessing restricted features (admin panel as coordinator)
4. Verify appropriate redirects and access control

## 📊 Demo Data Overview

### Disasters (5 total)
- **Kerala Floods 2024**: Active, High severity, 2 camps
- **Uttarakhand Landslide**: Active, Critical severity, 2 camps  
- **Rajasthan Drought**: Ongoing, Medium severity, 1 camp
- **Cyclone Biparjoy Impact**: Recovery, High severity, 2 camps
- **Delhi Heat Wave**: Monitoring, Medium severity, 2 camps

### Statistics to Verify
- **Total Disasters**: 5
- **Active Disasters**: 3
- **Total Camps**: 9
- **Total Donations**: 30+
- **Total Volunteers**: 38+
- **Camp Occupancy**: ~50% average

## 🐛 Known Issues & Limitations

### Expected Issues
1. **User Registration**: May fail due to enum validation (this is a known issue)
2. **Some Admin Endpoints**: May return 500 errors (authentication edge cases)
3. **Test Data**: Email duplicates may cause volunteer registration failures

### Not Implemented (Out of Scope)
- Real-time notifications
- File uploads
- Geolocation/mapping
- Email notifications
- Advanced search/filtering UI

## 🔧 Troubleshooting

### Frontend Issues
- **Page won't load**: Check if frontend server is running on port 5173
- **API errors**: Verify backend server is running on port 8000
- **Login fails**: Use exact credentials provided above

### Backend Issues
- **500 errors**: Check server logs for detailed error messages
- **CORS errors**: Verify frontend URL is in CORS allowed origins
- **Database errors**: Database should auto-create and seed on startup

### Integration Issues
- **Authentication not working**: Clear browser localStorage and try again
- **Data not loading**: Check browser network tab for API call failures
- **Role restrictions not working**: Verify JWT token is being sent in requests

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check server logs for backend errors
3. Verify both servers are running on correct ports
4. Try the integration test: `python test_integration.py`

## 🎯 Success Criteria

The system is working correctly if you can:
- ✅ Login with all three user roles
- ✅ See different dashboards and panels based on role
- ✅ Access Admin Panel (admin only) with disaster/camp creation
- ✅ Access Coordinator Panel (coordinator/admin) with resource requests
- ✅ Assign volunteers to camps with roles
- ✅ Update camp occupancy and manage resources
- ✅ View realistic disaster management data
- ✅ Create donations and volunteer registrations
- ✅ Navigate between pages without errors
- ✅ See proper statistics and analytics
- ✅ Experience comprehensive role-based access control

Enjoy exploring the Disaster Relief Management System! 🌟