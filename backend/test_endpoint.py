import requests
import json

# Test the GitHub import endpoint
url = "http://localhost:8000/github/import"
payload = {
    "github_url": "https://github.com/octocat/Hello-World",
    "include_hidden": False,
    "max_depth": None
}

print("Testing GitHub import endpoint...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"\nError: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")

# Made with Bob
