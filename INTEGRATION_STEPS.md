# Backend-Frontend Integration Steps

## Issue Found
The `govcontroller.js` file has HTML-encoded arrow functions (`=& gt;` instead of `=>`). This is preventing the backend from running properly.

## Solution Steps

### 1. Fix govcontroller.js
The file at `c:\Users\study\Downloads\kt\backend\controllers\govcontroller.js` needs to be manually fixed.

**Current (broken):**
```javascript
exports.getAllEBBills = async(req, res) =& gt; {
```

**Should be:**
```javascript
exports.getAllEBBills = async (req, res) => {
```

**Manual Fix Required:**
Open `c:\Users\study\Downloads\kt\backend\controllers\govcontroller.js` in a text editor and:
- Replace all instances of `=& gt;` with `=>`
- Replace all instances of `=&gt;` with `=>`
- Add space after `async` before `(req, res)`

### 2. Backend Port Configuration
- Backend default port: 4000 (from server.js)
- Frontend expects: 5001 (from api.js and govledger.jsx)

**Option A:** Set PORT=5001 in backend/.env
**Option B:** Update frontend to use port 4000

### 3. Routes Added
Added new route in `backend/routes/govroutes.js`:
```javascript
router.get("/ledger", auth, govController.getGovLedger);
```

This maps to the frontend call: `GET /api/gov/ledger`

### 4. Seed Database
Run from backend directory:
```bash
node seed.js
```

This will create test data in the gov_ledger collection.

### 5. Start Backend
```bash
cd backend
set PORT=5001
node server.js
```

### 6. Start Frontend
```bash
cd frontend
npm start
```

### 7. Test
1. Login to the application
2. Navigate to "Gov Ledger" page
3. Should see list of users with their monthly units and bills

## API Endpoint Details

**Endpoint:** `GET /api/gov/ledger`
**Auth:** Required (Bearer token)
**Query Params:** 
- `search` (optional): Filter by user_id

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 3,
    "users": [
      {
        "user_id": "USER001",
        "monthly_units": 150.5,
        "monthly_bill": 977.25
      }
    ]
  }
}
```

## Files Modified
1. `backend/controllers/govcontroller.js` - Added getGovLedger method
2. `backend/routes/govroutes.js` - Added /ledger route
3. Frontend already configured correctly

## Next Steps
1. Manually fix the arrow functions in govcontroller.js
2. Set PORT=5001 in backend or update frontend to use 4000
3. Run seed.js to populate data
4. Start backend and frontend
5. Test the Gov Ledger page
