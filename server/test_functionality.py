#!/usr/bin/env python3
"""
Test script to verify the disaster relief system functionality.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_login(username, password):
    """Test user login"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ Login successful for {username}")
        return token
    else:
        print(f"❌ Login failed for {username}: {response.text}")
        return None

def test_admin_functionality(token):
    """Test admin functionality"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test getting all users
    response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
    if response.status_code == 200:
        users = response.json()
        print(f"✅ Admin can view {len(users)} users")
    else:
        print(f"❌ Admin users endpoint failed: {response.text}")
    
    # Test dashboard stats
    response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Admin dashboard stats: {stats}")
    else:
        print(f"❌ Admin dashboard failed: {response.text}")

def test_coordinator_functionality(token):
    """Test coordinator functionality"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test coordinator dashboard
    response = requests.get(f"{BASE_URL}/api/coordinator/dashboard", headers=headers)
    if response.status_code == 200:
        dashboard = response.json()
        print(f"✅ Coordinator dashboard: Camp {dashboard['camp']['name']}")
    else:
        print(f"❌ Coordinator dashboard failed: {response.text}")

def test_user_functionality(token):
    """Test user (volunteer/donor) functionality"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test viewing disasters
    response = requests.get(f"{BASE_URL}/api/user/disasters", headers=headers)
    if response.status_code == 200:
        disasters = response.json()
        print(f"✅ User can view {len(disasters)} disasters")
    else:
        print(f"❌ User disasters endpoint failed: {response.text}")
    
    # Test viewing camps
    response = requests.get(f"{BASE_URL}/api/user/camps", headers=headers)
    if response.status_code == 200:
        camps = response.json()
        print(f"✅ User can view {len(camps)} camps")
    else:
        print(f"❌ User camps endpoint failed: {response.text}")

def main():
    """Main test function"""
    print("🧪 Testing Disaster Relief System Functionality")
    print("=" * 50)
    
    # Test Admin Login and Functionality
    print("\n👑 Testing Admin Functionality:")
    admin_token = test_login("admin", "admin123")
    if admin_token:
        test_admin_functionality(admin_token)
    
    # Test Coordinator Login and Functionality
    print("\n🏕️ Testing Coordinator Functionality:")
    coord_token = test_login("coordinator1", "coord123")
    if coord_token:
        test_coordinator_functionality(coord_token)
    
    # Test User Login and Functionality
    print("\n🙋 Testing User Functionality:")
    user_token = test_login("volunteer1", "vol123")
    if user_token:
        test_user_functionality(user_token)
    
    print("\n" + "=" * 50)
    print("🎉 Testing completed!")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed: {e}")