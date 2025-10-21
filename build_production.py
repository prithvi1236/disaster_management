#!/usr/bin/env python3
"""
Production Build Script for Disaster Relief Management System

This script automates the production build process for both frontend and backend.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a shell command and handle errors."""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)

def check_prerequisites():
    """Check if required tools are installed."""
    print("Checking prerequisites...")
    
    # Check Node.js
    try:
        result = run_command("node --version")
        print(f"Node.js version: {result.stdout.strip()}")
    except:
        print("Error: Node.js is not installed or not in PATH")
        sys.exit(1)
    
    # Check Python
    try:
        result = run_command("python --version")
        print(f"Python version: {result.stdout.strip()}")
    except:
        print("Error: Python is not installed or not in PATH")
        sys.exit(1)
    
    print("Prerequisites check passed!")

def build_frontend():
    """Build the frontend application."""
    print("\n=== Building Frontend ===")
    
    client_dir = Path("client")
    if not client_dir.exists():
        print("Error: client directory not found")
        sys.exit(1)
    
    # Install dependencies
    print("Installing frontend dependencies...")
    run_command("npm install", cwd=client_dir)
    
    # Run linting
    print("Running frontend linting...")
    run_command("npm run lint", cwd=client_dir, check=False)
    
    # Build for production
    print("Building frontend for production...")
    run_command("npm run build:prod", cwd=client_dir)
    
    # Check if build was successful
    dist_dir = client_dir / "dist"
    if not dist_dir.exists():
        print("Error: Frontend build failed - dist directory not found")
        sys.exit(1)
    
    print("Frontend build completed successfully!")
    return dist_dir

def prepare_backend():
    """Prepare the backend for production."""
    print("\n=== Preparing Backend ===")
    
    server_dir = Path("server")
    if not server_dir.exists():
        print("Error: server directory not found")
        sys.exit(1)
    
    # Check if virtual environment exists
    venv_dir = server_dir / "venv"
    if not venv_dir.exists():
        print("Creating virtual environment...")
        run_command("python -m venv venv", cwd=server_dir)
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip"
        python_cmd = "venv/bin/python"
    
    print("Installing backend dependencies...")
    run_command(f"{python_cmd} -m pip install --upgrade pip", cwd=server_dir, check=False)
    run_command(f"{pip_cmd} install -r requirements.txt", cwd=server_dir)
    
    # Check if production environment file exists
    env_file = server_dir / ".env"
    env_prod_file = server_dir / ".env.production"
    
    if not env_file.exists() and env_prod_file.exists():
        print("Copying production environment template...")
        shutil.copy(env_prod_file, env_file)
        print("WARNING: Please update the .env file with your production values!")
    
    print("Backend preparation completed!")

def create_deployment_package():
    """Create a deployment package."""
    print("\n=== Creating Deployment Package ===")
    
    # Create deployment directory
    deploy_dir = Path("deployment")
    if deploy_dir.exists():
        shutil.rmtree(deploy_dir)
    deploy_dir.mkdir()
    
    # Copy frontend build
    frontend_dir = deploy_dir / "frontend"
    shutil.copytree("client/dist", frontend_dir)
    
    # Copy backend files
    backend_dir = deploy_dir / "backend"
    backend_dir.mkdir()
    
    # Copy essential backend files
    backend_files = [
        "main.py",
        "requirements.txt",
        "setup_db.py",
        ".env.production",
        "app/"
    ]
    
    for file_path in backend_files:
        src = Path("server") / file_path
        dst = backend_dir / file_path
        
        if src.is_file():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        elif src.is_dir():
            shutil.copytree(src, dst)
    
    # Copy deployment documentation
    shutil.copy("PRODUCTION_DEPLOYMENT.md", deploy_dir)
    
    # Create deployment info file
    info_file = deploy_dir / "deployment_info.txt"
    with open(info_file, 'w') as f:
        f.write("Disaster Relief Management System - Production Build\n")
        f.write("=" * 50 + "\n\n")
        f.write("Build Date: " + subprocess.check_output(["date"]).decode().strip() + "\n")
        f.write("Git Commit: " + subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip() + "\n\n")
        f.write("Deployment Instructions:\n")
        f.write("1. Read PRODUCTION_DEPLOYMENT.md for detailed instructions\n")
        f.write("2. Update backend/.env with your production values\n")
        f.write("3. Deploy frontend/ contents to your web server\n")
        f.write("4. Deploy backend/ to your application server\n")
        f.write("5. Set up database and run migrations\n")
        f.write("6. Configure web server (nginx) with provided configs\n")
    
    print(f"Deployment package created in: {deploy_dir.absolute()}")

def main():
    """Main build process."""
    print("Disaster Relief Management System - Production Build")
    print("=" * 55)
    
    # Check prerequisites
    check_prerequisites()
    
    # Build frontend
    build_frontend()
    
    # Prepare backend
    prepare_backend()
    
    # Create deployment package
    create_deployment_package()
    
    print("\n" + "=" * 55)
    print("Production build completed successfully!")
    print("\nNext steps:")
    print("1. Review the deployment/ directory")
    print("2. Read PRODUCTION_DEPLOYMENT.md for deployment instructions")
    print("3. Update environment variables for your production environment")
    print("4. Deploy to your production servers")

if __name__ == "__main__":
    main()