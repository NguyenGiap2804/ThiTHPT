# Database Schema Documentation

## 📋 Overview

SQL Server database for THPT Exam Prep System with 9 main tables and relationships.

---

## 📊 Table Schemas

### 1. **Subjects** - Subject Categories

```sql
id (PK, nvarchar)      -- Primary key (e.g., 'math', 'english')
name (nvarchar)        -- Subject name (e.g., 'Toán học')
icon (nvarchar)        -- Icon name (e.g., 'Calculator')
color (nvarchar)       -- Tailwind color class (e.g., 'bg-blue-500')
description (nvarchar) -- Subject description
createdAt (datetime)   -- Creation timestamp
updatedAt (datetime)   -- Last update timestamp
```

**Sample Records:**
| id | name | icon | color |
|-|-|-|-|
| math | Toán học | Calculator | bg-blue-500 |
| english | Tiếng Anh | Languages | bg-indigo-500 |
| physics | Vật lý | Zap | bg-orange-500 |

---

### 2. **Users** - Student & Admin Accounts

```sql
id (PK, nvarchar)      -- UUID primary key
email (uniquenvarchar) -- Email (unique, indexed)
password (nvarchar)    -- Hashed password (bcrypt)
name (nvarchar)        -- Full name
role (nvarchar)        -- 'student' or 'admin'
phone (nvarchar)       -- Phone number
avatar (nvarchar)      -- Avatar URL
isActive (bit)         -- Account active flag
createdAt (datetime)   -- Account creation date
updatedAt (datetime)   -- Last update
```

**Indexes:**
- IX_Users_Email (on email for login lookups)
- IX_Users_Role (on role for filtering)

**Sample Login:**
```
email: admin@thpt.edu.vn
password: admin123 (hashed: $2a$10$...)
```

---

### 3. **Exams** - Exam Records

```sql
id (PK, nvarchar)      -- UUID
subjectId (FK)         -- Foreign key to Subjects
title (nvarchar)       -- Exam title
examCode (nvarchar)    -- Unique exam code (e.g., '0119')
durationMinutes (int)  -- Duration (e.g., 90)
status (nvarchar)      -- 'draft', 'published', or 'hidden'
totalQuestions (int)   -- Total question count
createdBy (FK)         -- Foreign key to Users (admin)
createdAt (datetime)   -- When exam was created
updatedAt (datetime)   -- Last update
```

**Indexes:**
- IX_Exams_SubjectId
- IX_Exams_Status
- IX_Exams_ExamCode

**States:**
- `draft` - Not available to students
- `published` - Available to take
- `hidden` - Archived/hidden

---

### 4. **ExamImages** - Exam Image Pages

```sql
id (PK, nvarchar)      -- UUID
examId (FK)            -- Foreign key to Exams
pageNumber (int)       -- Page sequence (1, 2, 3, ...)
imageUrl (nvarchar)    -- URL of the image
imagePath (nvarchar)   -- Local file path (optional)
uploadedAt (datetime)  -- Upload timestamp
```

**Constraint:** UNIQUE(examId, pageNumber) - One image per page

**Usage:**
- Store URLs to exam page images
- Support multiple pages per exam
- Enable preview in ExamImageViewer component

---

### 5. **QuestionStructures** - Question Definitions

```sql
id (PK, nvarchar)      -- UUID (e.g., 'q1', 'q13')
examId (FK)            -- Foreign key to Exams
questionNumber (int)   -- Sequential number (1, 2, 3, ...)
label (nvarchar)       -- Display label (e.g., 'Câu 1', 'Câu 13a')
type (nvarchar)        -- 'single_choice', 'true_false', 'short_answer'
part (int)             -- Part 1, 2, or 3
options (nvarchar)     -- JSON: ["A", "B", "C", "D"]
subQuestions (nvarchar)-- JSON: ["a", "b", "c", "d"]
createdAt (datetime)   -- Creation timestamp
```

**Types:**
1. `single_choice` - A/B/C/D radio buttons (Part 1)
2. `true_false` - True/False for sub-items a,b,c,d (Part 2)
3. `short_answer` - Text input (Part 3)

**Example JSON:**
```json
// single_choice
options: ["A", "B", "C", "D"]

// true_false
subQuestions: ["a", "b", "c", "d"]
```

---

### 6. **AnswerKeys** - Correct Answers

```sql
id (PK, nvarchar)      -- UUID
examId (FK)            -- Foreign key to Exams
questionId (FK)        -- Foreign key to QuestionStructures
correctAnswer (nvarchar)-- JSON: answer value
scoringRules (nvarchar)-- JSON: complex scoring rules
createdAt (datetime)
updatedAt (datetime)
```

**Constraint:** UNIQUE(questionId) - One answer key per question

**Examples:**
```json
// single_choice question
correctAnswer: "C"

// true_false question
correctAnswer: {
  "a": true,
  "b": false,
  "c": true,
  "d": false
}

// short_answer question
correctAnswer: "3780"

// With fuzzy matching (future)
correctAnswer: "3780",
scoringRules: {
  "acceptVariations": ["3.780", "3780 cm3"],
  "fuzzyMatch": true,
  "tolerance": 0.1
}
```

---

### 7. **Explanations** - Question Solutions

```sql
id (PK, nvarchar)      -- UUID
examId (FK)            -- Foreign key to Exams
questionId (FK)        -- Foreign key to QuestionStructures
text (nvarchar)        -- Markdown or HTML explanation
videoUrl (nvarchar)    -- Video explanation URL (optional)
imageUrl (nvarchar)    -- Diagram/image URL (optional)
createdAt (datetime)
updatedAt (datetime)
```

**Constraint:** UNIQUE(questionId) - One explanation per question

**Usage:**
- Store explanation text (markdown supported)
- Optional video link
- Optional image/diagram
- Displayed in ResultPage after submission

---

### 8. **Attempts** - Exam Submissions

```sql
id (PK, nvarchar)      -- UUID
examId (FK)            -- Foreign key to Exams
studentId (FK)         -- Foreign key to Users (student)
score (decimal)        -- Final score (0-10)
correctCount (int)     -- Number of correct answers
wrongCount (int)       -- Number of wrong answers
emptyCount (int)       -- Number of empty/skipped
timeSpent (int)        -- Time spent in seconds
submittedAt (datetime) -- Submission timestamp
```

**Indexes:**
- IX_Attempts_ExamId (for exam stats)
- IX_Attempts_StudentId (for student history)
- IX_Attempts_SubmittedAt (for timeline queries)

**Usage:**
- Record each exam submission
- Track score and statistics
- Show in HistoryPage

---

### 9. **AttemptAnswers** - Individual Answers

```sql
id (PK, nvarchar)      -- UUID
attemptId (FK)         -- Foreign key to Attempts
questionId (FK)        -- Foreign key to QuestionStructures
selectedOption (nvarchar)  -- For single_choice: "A", "B", etc. or NULL
trueFalseAnswers (nvarchar)-- JSON: {"a": true, "b": false, ...}
shortAnswer (nvarchar) -- Text answer for short_answer type
isCorrect (bit)        -- 1=correct, 0=wrong, NULL=empty
points (decimal)       -- Points earned (0 to question_max)
createdAt (datetime)   -- When answer was recorded
```

**Indexes:**
- IX_AttemptAnswers_AttemptId (for attempt details)
- IX_AttemptAnswers_QuestionId (for question stats)

**Usage:**
- Store per-question answer data
- Calculate correctness
- Show in ResultPage with comparison

---

## 🔄 Entity Relationships Diagram

```
┌─────────────┐
│   Users     │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │ ◄─────── 'admin' or 'student'
└──────┬──────┘
       │
       ├─────────────── Creates Exams (1:Many)
       │
       └─────────────── Makes Attempts (1:Many)


┌──────────────┐         ┌─────────────┐
│   Subjects   │ ◄─┐     │    Exams    │
├──────────────┤   └──── ├─────────────┤
│ id (PK)      │   1:Many│ id (PK)     │
│ name         │         │ examCode    │
│ icon         │         │ durationMin │
│ color        │         │ status      │
└──────────────┘         └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
               1:Many        1:Many       1:Many
                    │            │            │
        ┌───────────▼──┐ ┌───────▼──────┐ ┌──▼──────────────┐
        │ ExamImages   │ │ Question     │ │ Explanations    │
        ├──────────────┤ │ Structures   │ ├─────────────────┤
        │ id           │ ├──────────────┤ │ id              │
        │ pageNumber   │ │ id           │ │ text (markdown) │
        │ imageUrl     │ │ questionNum  │ │ videoUrl        │
        │              │ │ type         │ │ imageUrl        │
        └──────────────┘ │ part         │ └─────────────────┘
                         │ options      │
                         │ subQuestions │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                1:Many      1:Many      1:Many
                    │           │           │
           ┌────────▼────┐  ┌───▼─────┐  ┌─▼──────────┐
           │ AnswerKeys  │  │Attempts ◄──┤  Users     │
           ├─────────────┤  ├─────────┤  │ student    │
           │ id          │  │ id      │  └────────────┘
           │ question_id │  │ examId  │
           │ answer      │  │ score   │
           │ scoring_rule│  └────┬────┘
           └─────────────┘       │
                            1:Many (AttemptAnswers)
                                 │
                         ┌───────▼──────────┐
                         │AttemptAnswers    │
                         ├──────────────────┤
                         │ id               │
                         │ attemptId        │
                         │ questionId       │
                         │ selectedOption   │
                         │ trueFalseAnswers │
                         │ shortAnswer      │
                         │ isCorrect        │
                         │ points           │
                         └──────────────────┘
```

---

## 💾 Sample Queries

### Get exam with questions
```sql
SELECT e.*, q.* FROM Exams e
LEFT JOIN QuestionStructures q ON e.id = q.examId
WHERE e.examCode = '0119'
ORDER BY q.questionNumber;
```

### Get student's attempts with scores
```sql
SELECT a.*, e.title, e.examCode
FROM Attempts a
JOIN Exams e ON a.examId = e.id
WHERE a.studentId = 'user-123'
ORDER BY a.submittedAt DESC;
```

### Get attempt details with answers
```sql
SELECT aa.*, qs.label, qs.type, ak.correctAnswer
FROM AttemptAnswers aa
JOIN QuestionStructures qs ON aa.questionId = qs.id
LEFT JOIN AnswerKeys ak ON qs.id = ak.questionId
WHERE aa.attemptId = 'attempt-456'
ORDER BY qs.questionNumber;
```

---

## 🔐 Data Validation Rules

| Table | Column | Rule |
|-------|--------|------|
| Users | email | Unique, valid email format |
| Users | password | Min 8 chars, hashed with bcrypt |
| Exams | examCode | Unique across all exams |
| Exams | status | Only: draft, published, hidden |
| Questions | type | Only: single_choice, true_false, short_answer |
| Questions | part | 1, 2, or 3 only |
| Attempts | score | 0-10 decimal |
| Attempts | studentId | Must reference valid user with role='student' |

---

## 📈 Indexing Strategy

Indexes created for best query performance:

| Table | Column | Purpose |
|-------|--------|---------|
| Users | email | Fast login lookups |
| Users | role | Filter students vs admins |
| Exams | subjectId | Filter by subject |
| Exams | status | Filter published exams |
| Exams | examCode | Unique lookup |
| QuestionStructures | examId | Get questions for exam |
| AnswerKeys | examId | Bulk scoring |
| AnswerKeys | questionId | Unique lookup |
| Attempts | examId | Exam statistics |
| Attempts | studentId | Student history |
| Attempts | submittedAt | Timeline queries |

---

Created: April 3, 2026
