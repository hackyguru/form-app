#!/bin/bash

# Storacha Diagnostic Script
# Run this to check if everything is configured correctly

echo "======================================"
echo "  Storacha Setup Diagnostic"
echo "======================================"
echo ""

# Check if server is running
echo "1. Checking if dev server is running..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 3000"
else
    echo "   ❌ Server is NOT running!"
    echo "   Run: npm run dev"
    exit 1
fi

echo ""

# Check environment file
echo "2. Checking .env.local file..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local exists"
    
    if grep -q "STORACHA_KEY=" .env.local; then
        KEY_LENGTH=$(grep "STORACHA_KEY=" .env.local | cut -d= -f2 | wc -c)
        echo "   ✅ STORACHA_KEY found (length: $KEY_LENGTH)"
    else
        echo "   ❌ STORACHA_KEY not found!"
    fi
    
    if grep -q "STORACHA_PROOF=" .env.local; then
        PROOF_LENGTH=$(grep "STORACHA_PROOF=" .env.local | cut -d= -f2 | wc -c)
        echo "   ✅ STORACHA_PROOF found (length: $PROOF_LENGTH)"
    else
        echo "   ❌ STORACHA_PROOF not found!"
    fi
else
    echo "   ❌ .env.local does NOT exist!"
    echo "   Create one with STORACHA_KEY and STORACHA_PROOF"
    exit 1
fi

echo ""

# Test health endpoint
echo "3. Testing health check endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/storacha/health 2>&1)

if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
    echo "   ✅ Health check passed"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "   ❌ Health check failed or returned non-JSON"
    echo "   Response: ${HEALTH_RESPONSE:0:200}"
fi

echo ""

# Test delegation endpoint
echo "4. Testing delegation endpoint..."
DELEGATION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/storacha/delegation \
    -H "Content-Type: application/json" \
    -d '{"did":"did:key:z6MkrZ1r5d7z6B5m3k7D8q9w3x2y1a"}' 2>&1)

if echo "$DELEGATION_RESPONSE" | grep -q '"delegation"'; then
    echo "   ✅ Delegation endpoint working!"
    echo "   Delegation length: $(echo "$DELEGATION_RESPONSE" | grep -o '"delegation":"[^"]*"' | wc -c)"
elif echo "$DELEGATION_RESPONSE" | grep -q '"error"'; then
    echo "   ❌ Delegation endpoint returned error:"
    echo "$DELEGATION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DELEGATION_RESPONSE"
else
    echo "   ❌ Delegation endpoint returned non-JSON (likely HTML error page)"
    echo "   Response (first 300 chars): ${DELEGATION_RESPONSE:0:300}"
fi

echo ""

# Summary
echo "======================================"
echo "  Summary"
echo "======================================"
echo ""
echo "If all checks passed (✅), your setup is ready!"
echo ""
echo "If any checks failed (❌), fix them and run this script again."
echo ""
echo "Next steps:"
echo "  1. Visit: http://localhost:3000/test-storacha"
echo "  2. Click 'Test Delegation API'"
echo "  3. Try creating a form at: http://localhost:3000/forms/create"
echo ""
