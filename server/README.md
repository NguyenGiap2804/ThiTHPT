# Backend Server - SQL Server Setup Guide

## 📋 Prerequisites

Before setting up the backend, make sure you have:

1. **Node.js** (v18+) - [Download](https://nodejs.org/)
2. **SQL Server** - Choose one:
   - **SQL Server 2022 Express** (Free) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
   - **SQL Server 2019 Express** (Free) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-2019-editions)
   - **Azure Data Studio** (Optional but recommended) - [Download](https://azure.microsoft.com/en-us/products/data-studio)

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
cd server
npm install
```

### Step 2: Setup SQL Server

#### Option A: Using SQL Server Express (Default)

1. **Download & Install** SQL Server Express
2. **During installation**, choose:
   - Instance name: `SQLEXPRESS` (default)
   - Authentication: **Mixed Mode** (SQL Server and Windows Authentication)
   - SA password: Set a strong password (e.g., `YourPassword123!`)
   - TCP/IP: Enabled

3. **Verify Connection** using Azure Data Studio:
   - Server: `localhost` or `localhost\SQLEXPRESS`
   - Authentication: SQL Login
   - Username: `sa`
   - Password: Your SA password

#### Option B: Using LocalDB (Lightweight)

```bash
# Install SQL Server LocalDB
sqlcmd -S (localdb)\mssqllocaldb -Q "SELECT @@VERSION"

# Create a LocalDB instance
sqllocaldb create ThiptDB
sqllocaldb start ThiptDB
```

Then update `.env`:
```
MSSQL_SERVER=(localdb)\ThiptDB
MSSQL_USERNAME=
MSSQL_PASSWORD=
MSSQL_DATABASE=ThiptExamDB
```

### Step 3: Configure Environment

1. **Copy example config:**
   ```bash
   copy .env.example .env
   ```

2. **Edit `.env` with your SQL Server details:**

   ```env
   # SQL Server Connection
   MSSQL_SERVER=localhost        # or localhost\SQLEXPRESS
   MSSQL_DATABASE=ThiptExamDB
   MSSQL_USERNAME=sa             # SQL Server user
   MSSQL_PASSWORD=YourPassword123!  # Your SA password
   MSSQL_PORT=1433               # Default port

   # JWT Secret (change in production!)
   JWT_SECRET=dev-secret-key-change-me-in-production
   JWT_EXPIRY=7d

   # Server
   PORT=3001
   NODE_ENV=development

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

### Step 4: Initialize Database

Run the database schema initialization:

```bash
npm run db:migrate
```

You should see:
```
✅ Database initialized successfully!
✅ Subjects data inserted!
```

### Step 5: Seed Sample Data (Optional)

Insert test users and exams:

```bash
npm run db:check
```

**Sample Test Accounts Created:**
- **Admin:** `admin@thpt.edu.vn` / `admin123`
- **Student:** `student@thpt.edu.vn` / `student123`

---

## 📊 Database Structure

The database includes the following tables:

### Core Tables:
- **Users** - Student and admin accounts
- **Subjects** - Subject categories (Math, English, Physics, etc.)
- **Exams** - Exam records with metadata
- **ExamImages** - Image pages for each exam
- **QuestionStructures** - Question definitions
- **AnswerKeys** - Correct answers for questions
- **Explanations** - Explanations/solutions for questions
- **Attempts** - Student exam submissions
- **AttemptAnswers** - Individual answers per attempt

### Relationships:
```
Users (1) ──┬─ Exams (many)
            └─ Attempts (many) ─── AttemptAnswers (many)

Subjects (1) ── Exams (many) ──┬─ ExamImages (many)
                                ├─ QuestionStructures (many) ─┬─ AnswerKeys (1)
                                │                              ├─ Explanations (1)
                                │                              └─ AttemptAnswers (many)
                                └─ Explanations (many)
```

---

## 🔍 Database Connection Test

To verify SQL Server is connected correctly:

```bash
npm run dev
```

Watch for this message:
```
✅ SQL Server connected successfully
Server running on http://localhost:3001
```

---

## 🛠️ Troubleshooting

### Connection Refused / Cannot Connect

**Problem:** `ERROR: Connection refused to localhost:1433`

**Solutions:**
1. Check SQL Server is running
2. Verify correct server address in `.env`
3. Verify TCP/IP is enabled (SQL Server Configuration Manager)
4. Check firewall isn't blocking port 1433

### Authentication Failed

**Problem:** `Error: Login failed for user 'sa'`

**Solutions:**
1. Verify correct username/password in `.env`
2. Ensure **Mixed Mode** authentication is enabled
3. Try resetting SA password via SQL Server Management Studio

### Database Already Exists

**Problem:** `CREATE DATABASE failed. The database already exists.`

**Solution:**
```bash
# Drop existing database
sqlcmd -S localhost -U sa -P YourPassword123! -Q "DROP DATABASE ThiptExamDB"

# Re-run init
npm run db:migrate
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Kill process on port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3001
kill -9 <PID>
```

---

## 📚 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.ts         # SQL Server connection pool
│   ├── db/
│   │   ├── schema.sql          # Database schema
│   │   ├── init.ts             # Initialize database
│   │   └── seed.ts             # Seed sample data
│   ├── models/
│   │   └── index.ts            # TypeScript interfaces/DTOs
│   ├── controllers/             # TODO: API business logic
│   ├── routes/                  # TODO: API route handlers
│   ├── middleware/              # TODO: Auth, validation, etc
│   └── index.ts                 # TODO: Express app entry point
├── dist/                        # Compiled JavaScript (after build)
├── .env.example                 # Example environment variables
├── .env                         # Actual env vars (NOT in git)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔐 Security Notes

⚠️ **Important for Production:**

1. **Change JWT_SECRET** to a strong random value
2. **Use environment variables** for sensitive data (never commit .env)
3. **Enable encryption** if using Azure SQL (`encrypt: true` in database.ts)
4. **Hash passwords** with bcrypt (already in package.json)
5. **Implement CORS properly** restrict to your domain
6. **Use HTTPS** in production
7. **Validate all inputs** on backend
8. **Rate limit** API endpoints

---

## 📝 Next Steps

After database is setup, the following files need to be created:

- [ ] `src/controllers/` - API business logic
- [ ] `src/routes/` - API route definitions
- [ ] `src/middleware/` - Auth middleware, validation
- [ ] `src/index.ts` - Express app initialization
- [ ] Connect frontend to backend APIs

---

## 📞 Support

If you encounter issues:

1. Check `.env` configuration
2. Verify SQL Server is running
3. Check connection string format
4. Review SQL Server error logs:
   ```bash
   # SQL Server Management Studio → View → Error Log
   ```

---

Created: April 2026
Updated: April 3, 2026
