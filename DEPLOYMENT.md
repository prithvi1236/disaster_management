# Deployment Guide

## 🎯 Current Status
✅ **Development Environment Ready**
- Backend: FastAPI server running on http://localhost:8000
- Frontend: React app running on http://localhost:5173
- Database: SQLite with seeded demo data
- Authentication: JWT-based with 3 user roles
- Integration: Full frontend-backend communication tested

## 🚀 Quick Development Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 1. Clone and Setup Backend
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```

### 3. Access the System
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. Demo Credentials
- **Admin**: `admin` / `admin123` (Full system access)
- **Camp Coordinator**: `coordinator1` / `coord123` (Management access)
- **Volunteer User**: `volunteer_user` / `user123` (Basic access)

## 🔧 Environment Configuration

### Backend Environment
Copy `server/.env.production` to `server/.env` and update values:
```bash
cp server/.env.production server/.env
# Edit server/.env with your configuration
```

### Frontend Environment  
Copy `client/.env.production` to `client/.env` and update values:
```bash
cp client/.env.production client/.env
# Edit client/.env with your API URL
```

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ and pip
- PostgreSQL database
- Web server (nginx recommended)
- SSL certificate for HTTPS

### Backend Deployment

#### 1. Environment Setup
```bash
# Create production environment file
cp server/.env.example server/.env

# Update with production values
JWT_SECRET_KEY=your-super-secure-production-jwt-key-at-least-32-characters-long
DATABASE_URL=postgresql://user:password@localhost/disaster_management
DEBUG=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

#### 2. Database Setup
For production, use PostgreSQL instead of SQLite:

```bash
# Install PostgreSQL dependencies
pip install psycopg2-binary

# Create PostgreSQL database
createdb disaster_management
createuser disaster_user --pwprompt

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://disaster_user:password@localhost:5432/disaster_management

# Run migrations
python setup_db.py
```

#### 3. Production Server
```bash
# Install production server
pip install gunicorn uvicorn[standard]

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use systemd service (recommended)
# Create /etc/systemd/system/disaster-api.service
[Unit]
Description=Disaster Management API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/server
Environment=PATH=/path/to/venv/bin
ExecStart=/path/to/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend Deployment

#### 1. Environment Setup
```bash
# Create production environment file
cp client/.env.example client/.env

# Update with production API URL
VITE_API_BASE_URL=https://api.yourdomain.com
```

#### 2. Build for Production
```bash
cd client
npm install
npm run build
```

#### 3. Web Server Configuration (Nginx)

**Frontend Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    root /var/www/html;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**API Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🐳 Docker Deployment

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/disaster_management
      - JWT_SECRET_KEY=your-production-secret-key
    depends_on:
      - db

  frontend:
    build: ./client
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=disaster_management
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## ☁️ Cloud Deployment Options

### AWS Deployment
1. **Backend**: Deploy on AWS ECS or EC2 with RDS PostgreSQL
2. **Frontend**: Deploy on AWS S3 + CloudFront
3. **Database**: Use AWS RDS PostgreSQL

### Heroku Deployment
1. **Backend**: Deploy as Heroku app with PostgreSQL addon
2. **Frontend**: Deploy on Netlify or Vercel
3. **Environment**: Use Heroku config vars

### DigitalOcean Deployment
1. **Backend**: Deploy on DigitalOcean App Platform
2. **Frontend**: Deploy on DigitalOcean Spaces + CDN
3. **Database**: Use DigitalOcean Managed PostgreSQL

## 🔒 Security Checklist

### Pre-Deployment Security
- [ ] Change default JWT secret key
- [ ] Use HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Configure database user with minimal privileges
- [ ] Enable firewall and close unnecessary ports
- [ ] Update all dependencies to latest versions

### Production Security
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure log rotation
- [ ] Regular security updates
- [ ] Database backups
- [ ] Environment variable security
- [ ] API key rotation
- [ ] Input validation and sanitization
- [ ] Set up fail2ban for brute force protection

## 📊 Monitoring and Maintenance

### Health Checks
- Frontend: `https://yourdomain.com/` (should load the landing page)
- Backend: `https://api.yourdomain.com/health`

### Logs
- Application logs: Check systemd journal with `journalctl -u disaster-api`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- Database logs: PostgreSQL logs location varies by installation

### Backups
Set up automated database backups:
```bash
# Add to crontab
0 2 * * * pg_dump disaster_management | gzip > /backups/disaster_management_$(date +\%Y\%m\%d).sql.gz
```

### Updates
1. Always test updates in a staging environment first
2. Create database backup before updates
3. Use blue-green deployment for zero-downtime updates
4. Monitor application after deployment

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors**: Check ALLOWED_ORIGINS in backend .env file
2. **Database Connection**: Verify DATABASE_URL and PostgreSQL service status
3. **404 on Refresh**: Ensure nginx is configured for React Router
4. **API Errors**: Check backend logs with `journalctl -u disaster-api -f`

### Performance Optimization
1. Enable gzip compression in nginx
2. Set up CDN for static assets
3. Configure database connection pooling
4. Monitor and optimize database queries
5. Set up Redis for caching if needed

## 📞 Support

For deployment issues, check:
1. Application logs
2. Web server logs
3. Database logs
4. System resource usage (CPU, memory, disk)

Contact the development team with specific error messages and log excerpts for faster resolution.