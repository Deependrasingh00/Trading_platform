# CryptoX - Crypto Trading Platform

## 🚀 Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd vite-project
npm install
npm run dev
```

### 3. Create Admin Account (first time only)
Use Postman or curl:
```bash
curl -X POST http://localhost:5000/api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. Environment Variables (backend/.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/cryptoDB
JWT_SECRET=supersecretkey123
```

## 📱 Routes
- `/login` - User login/signup
- `/home` - Dashboard (protected)
- `/graph` - Live market data
- `/businesses` - Business solutions
- `/developers` - Withdrawal page
- `/admin-login` - Admin login
- `/admin` - Admin dashboard (protected)

## ✅ Fixed Issues
- Refresh pe same page rehta hai (localStorage + ProtectedRoute)
- Admin login properly works (/api/auth/admin/login route added)
- Login hone pe /home redirect
- Already logged in → auto redirect to /home
- Withdrawal form data persist on refresh
- Step progress bar on withdrawal page
- Admin middleware protection on all admin routes
- JWT_SECRET consistent everywhere
