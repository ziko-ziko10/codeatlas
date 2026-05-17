"""
Test script for GitHub import endpoint
"""
import sys
sys.path.insert(0, '.')

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test if endpoint exists
response = client.get("/docs")
print(f"Docs endpoint: {response.status_code}")

# List all routes
print("\nAvailable routes:")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"  {route.methods} {route.path}")

# Test GitHub import endpoint
print("\nTesting GitHub import endpoint...")
try:
    response = client.post(
        "/github/import",
        json={"github_url": "https://github.com/test/test"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

# Made with Bob
