# Backend API - Testing Guide

## 🚀 Quick Start

### 1. Install dependencies (if not done)
```bash
cd server
npm install
```

### 2. Start the development server
```bash
npm run dev
```
Server will run on `http://localhost:3001`

## 📋 API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

### Authentication Endpoints

#### Login
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@thpt.edu.vn",
  "password": "admin123"
}
```

**Valid Test Accounts:**
- Admin: `admin@thpt.edu.vn` / `admin123`
- Student: `student@thpt.edu.vn` / `student123`

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@thpt.edu.vn",
    "name": "Quản trị viên",
    "role": "admin"
  }
}
```

#### Register
```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "newuser@thpt.edu.vn",
  "password": "password123",
  "name": "Nguyễn Văn B"
}
```

#### Get Profile
```bash
GET http://localhost:3001/api/auth/profile
Authorization: Bearer <token>
```

### Exam Endpoints

#### Get All Exams
```bash
GET http://localhost:3001/api/exams
```

**With Filters:**
```bash
GET http://localhost:3001/api/exams?subject=Toán&level=easy&status=published
```

#### Get Exam Detail
```bash
GET http://localhost:3001/api/exams/exam-001
```

#### Create Exam (Admin Only)
```bash
POST http://localhost:3001/api/exams
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Toán 12 - Chương 3",
  "subject": "Toán",
  "level": "hard",
  "description": "Đề thi kiểm tra chương 3",
  "duration": 60
}
```

### Attempt Endpoints

#### Submit Exam Attempt
```bash
POST http://localhost:3001/api/attempts
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "examId": "exam-001",
  "answers": [
    {"questionId": "q-001", "selectedAnswer": "opt-c"},
    {"questionId": "q-002", "selectedAnswer": "opt-b"},
    {"questionId": "q-003", "selectedAnswer": "opt-a"}
  ]
}
```

#### Get User's Attempts
```bash
GET http://localhost:3001/api/attempts
Authorization: Bearer <student-token>
```

#### Get Attempt Result
```bash
GET http://localhost:3001/api/attempts/{attemptId}
Authorization: Bearer <student-token>
```

## 🧪 Testing with cURL / Postman

### Example: Login and Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@thpt.edu.vn",
    "password": "admin123"
  }'
```

### Example: Get Profile with Token
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Notes

- **Authentication**: Most endpoints (except login/register/health) require a valid JWT token
- **Admin Routes**: Create exam (POST /api/exams) requires admin role
- **Student Routes**: Attempt routes require student role

## 🔧 Environment Variables

Check `.env` file for configuration:
```
PORT=3001
CORS_ORIGIN=http://localhost:3000
MSSQL_SERVER=DESKTOP-T11NI5C\MSSQLSERVER01
MSSQL_DATABASE=ThiptExamDB
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Change PORT in .env or run on different port
PORT=3002 npm run dev
```

### Database connection failed
Ensure SQL Server is running and `.env` has correct connection details

### Token expired
Login again to get a new token

## 📚 Next Steps

1. **Integrate with Frontend**: Update frontend API client to use these endpoints
2. **Add Real Database Queries**: Replace mock data with actual SQL Server queries using queryHelpers
3. **Add Validation**: Use express-validator for input validation
4. **Add Error Handling**: Implement custom error classes and handlers
5. **Add Logging**: Implement proper logging with winston or pino
