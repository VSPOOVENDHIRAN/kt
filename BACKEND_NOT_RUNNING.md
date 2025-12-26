# 🚨 BACKEND NOT RUNNING - FIX NOW

## The Problem
Your backend server is **NOT RUNNING**. That's why you see:
- "Cannot reach server"
- OTP not working
- Trade page errors
- History page errors

## ✅ SOLUTION - Start Backend Server

### Option 1: Double-click this file
```
START_BACKEND.bat
```

### Option 2: Manual command
```bash
cd backend
npm run dev
```

### Option 3: PowerShell
```powershell
cd backend
npm run dev
```

---

## ✅ Verify Backend is Running

You should see:
```
Backend running on port 5001
http://localhost:5001
MongoDB connected
✓ Twilio Verify API initialized
```

---

## 🔍 Check if Backend is Running

Open: http://localhost:5001

Should show: "P2P Energy Trading API running."

---

## ⚠️ Common Issues

### MongoDB not running
**Error:** `MongoServerError: connect ECONNREFUSED`
**Fix:** Start MongoDB service

### Port 5001 already in use
**Error:** `EADDRINUSE`
**Fix:** 
```bash
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Missing .env file
**Error:** `Cannot find module dotenv`
**Fix:** Create `backend/.env` with:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_VERIFY_SERVICE_SID=your_service_sid
```

---

## 📝 Summary

**BEFORE you use the app:**
1. ✅ Start backend: `npm run dev` in backend folder
2. ✅ Verify: Open http://localhost:5001
3. ✅ Then use frontend

**The backend MUST be running for:**
- Login/Register
- OTP verification
- Trade (Buy/Sell)
- History
- Government Ledger
- Profile

---

## 🎯 Quick Start (Copy-Paste)

```bash
cd c:\Users\study\Downloads\kt\backend
npm run dev
```

Keep this terminal window open!
