# Setup Checklist - Backend SQL Server

## ✅ Setup Progress

### Phase 1: Database Infrastructure ✅ COMPLETED
- [x] SQL Server connection config (mssql driver + connection pool)
- [x] Database schema (9 tables with relationships and indexes)
- [x] TypeScript models/interfaces
- [x] Database initialization script (init.ts)
- [x] Sample data seeding (seed.ts)
- [x] Comprehensive documentation

### Phase 2: Install & Configure (YOU ARE HERE)

#### Step 1: Install SQL Server
- [ ] Download SQL Server 2022 Express or 2019 Express
- [ ] Install with Mixed Mode Authentication
- [ ] Set SA password (e.g., `YourPassword123!`)
- [ ] Enable TCP/IP protocol
- [ ] Verify connection with Azure Data Studio

#### Step 2: Setup Backend Project
```bash
cd server
npm install
```

#### Step 3: Configure Environment
```bash
copy .env.example .env
# Edit .env with your SQL Server details
```

Example `.env`:
```
MSSQL_SERVER=localhost
MSSQL_DATABASE=ThiptExamDB
MSSQL_USER=sa
MSSQL_PASSWORD=YourPassword123!
MSSQL_PORT=1433
JWT_SECRET=dev-secret-key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Step 4: Initialize Database
```bash
npm run db:init
```

Expected output:
```
✅ Database initialized successfully!
```

#### Step 5: Seed Sample Data (Optional)
```bash
npm run db:seed
```

Test accounts created:
- Admin: `admin@thpt.edu.vn` / `admin123`
- Student: `student@thpt.edu.vn` / `student123`

---

### Phase 3: API Development (NEXT)

These files still need to be created:

- [ ] `src/index.ts` - Express app entry point
- [ ] `src/middleware/auth.ts` - JWT verification middleware
- [ ] `src/middleware/validation.ts` - Input validation
- [ ] `src/routes/auth.ts` - Login, register endpoints
- [ ] `src/routes/exams.ts` - Exam CRUD and retrieval
- [ ] `src/routes/attempts.ts` - Submit exam, get results
- [ ] `src/routes/users.ts` - User profiles, stats
- [ ] `src/controllers/authController.ts` - Auth logic
- [ ] `src/controllers/examController.ts` - Exam logic
- [ ] `src/controllers/attemptController.ts` - Scoring logic

---

## 📊 Database Structure Summary

9 Tables created:
1. **Subjects** - Subject categories (Math, English, Physics, etc.)
2. **Users** - Student and admin accounts
3. **Exams** - Exam records
4. **ExamImages** - Exam page images
5. **QuestionStructures** - Question definitions
6. **AnswerKeys** - Correct answers
7. **Explanations** - Solution explanations
8. **Attempts** - Exam submissions
9. **AttemptAnswers** - Individual answers per question

**Total Tables:** 9  
**Total Relationships:** 11 Foreign Keys  
**Total Indexes:** 14 for performance  

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd server
npm install

# Initialize database (creates schema + sample subjects)
npm run db:init

# Seed sample data (creates test users and exam)
npm run db:seed

# Start development server (coming in Phase 3)
npm run dev

# Type check
npm run lint

# Build for production
npm build
```

---

## 📚 File Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.ts       ✅ SQL connection pool
│   ├── db/
│   │   ├── schema.sql        ✅ Database schema
│   │   ├── init.ts           ✅ Initialize DB
│   │   └── seed.ts           ✅ Sample data
│   ├── models/
│   │   └── index.ts          ✅ TypeScript interfaces
│   ├── controllers/          ⏳ TODO
│   ├── routes/               ⏳ TODO
│   ├── middleware/           ⏳ TODO
│   └── index.ts              ⏳ TODO (Express app)
├── dist/                     (generated after npm run build)
├── .env                      (update with your config)
├── .env.example              ✅ Example config
├── DATABASE_SCHEMA.md        ✅ Detailed schema docs
├── README.md                 ✅ Setup & troubleshoot guide
├── SETUP_CHECKLIST.md        ✅ This file
├── package.json              ✅
├── tsconfig.json             ✅
└── SETUP_STEPS.md            (optional: step-by-step guide)
```

---

## 🔐 API Endpoints (TO BE IMPLEMENTED)

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new account
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Exams
- `GET /api/exams` - List all published exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams` - Create exam (admin only)
- `PUT /api/exams/:id` - Update exam (admin only)
- `DELETE /api/exams/:id` - Delete exam (admin only)

### Attempts
- `POST /api/attempts` - Submit exam attempt
- `GET /api/attempts/:id` - Get attempt result
- `GET /api/attempts/exam/:examId` - Get all attempts for exam
- `GET /api/attempts/student/:studentId` - Get student's attempt history

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id/stats` - Get student statistics
- `PUT /api/users/profile` - Update profile

### Admin
- `POST /api/admin/upload` - Upload exam images/files
- `GET /api/admin/stats` - Dashboard statistics

---

## 💡 Next Actions

1. **Now:** Complete SQL Server setup following README.md
2. **After DB is ready:** Create Express app (src/index.ts)
3. **Then:** Build API controllers and routes
4. **Finally:** Connect frontend to backend APIs

---

## 🆘 Troubleshooting

See `README.md` for detailed troubleshooting:
- Connection refused errors
- Authentication failures
- Database creation issues
- Port conflicts

---

## 📝 Notes

- **Backup your data**: Database schema can be re-created anytime with `npm run db:init`
- **Change JWT_SECRET**: Before deploying to production
- **Use strong SA password**: For production environments
- **Enable encryption**: If using Azure SQL (set `encrypt: true`)

---

Status: **Phase 2 - Configuration**  
Last Updated: April 3, 2026  
Ready for: Phase 3 - API Development
