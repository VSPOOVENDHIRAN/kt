// Quick API Test Script
const API = "http://localhost:5001";

console.log("🔍 Testing Backend APIs...\n");

// Test 1: Root endpoint
fetch(API)
    .then(res => res.text())
    .then(data => console.log("✅ Root:", data))
    .catch(err => console.error("❌ Root failed:", err.message));

// Test 2: Offers endpoint (requires auth)
const token = "YOUR_TOKEN_HERE"; // Replace with actual token
fetch(`${API}/api/offers/current`, {
    headers: { Authorization: `Bearer ${token}` }
})
    .then(res => res.json())
    .then(data => console.log("✅ Offers:", data))
    .catch(err => console.error("❌ Offers failed:", err.message));

// Test 3: EB Bills endpoint (requires auth)
fetch(`${API}/api/gov/eb-bills`, {
    headers: { Authorization: `Bearer ${token}` }
})
    .then(res => res.json())
    .then(data => console.log("✅ EB Bills:", data))
    .catch(err => console.error("❌ EB Bills failed:", err.message));

console.log("\n📊 Check console for results...");
