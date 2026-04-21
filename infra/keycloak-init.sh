#!/bin/sh
set -e

# Wait for Keycloak to be ready
sleep 15

echo "Initializing Keycloak realm..."

# Get access token using jq if available, otherwise use sed/awk
TOKEN_RESPONSE=$(curl -s -X POST \
  "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN:-admin}&password=${KEYCLOAK_ADMIN_PASSWORD:-admin}")

# Extract access_token using sed
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get Keycloak admin token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "Got access token, creating realm..."

# Create merchant360 realm
curl -s -X POST "http://localhost:8080/admin/realms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "realm": "merchant360",
    "enabled": true,
    "displayName": "Merchant360"
  }' && echo "Realm created" || echo "Realm may already exist"

sleep 2

# Create web-client
curl -s -X POST "http://localhost:8080/admin/realms/merchant360/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "clientId": "web-client",
    "name": "Merchant360 Web",
    "enabled": true,
    "publicClient": false,
    "secret": "kc-client-secret-change-in-prod",
    "standardFlowEnabled": true,
    "redirectUris": ["http://localhost:3000/api/auth/callback", "http://localhost:3000/*"],
    "webOrigins": ["http://localhost:3000"]
  }' && echo "Client created" || echo "Client may already exist"

echo "Keycloak initialization complete!"

