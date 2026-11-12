# Endpoint Mapping: Frontend to Backend API Contracts

This document specifies the complete REST API interface between the React frontend client (`web/`) and the Express backend (`api/`).

---

## 1. Authentication & User Management

### 1.1 `POST /api/users/google-auth`
- **Backend Controller:** `api/controllers/user.controller.js` (`googleAuth`)
- **Auth Requirement:** Public (Subject to `loginLimiter` rate limiter)
- **Frontend Consumer:** `web/src/components/GoogleAuth.jsx`, `web/src/pages/AuthPage.jsx`
- **Mongoose Model:** `api/models/user.model.js` (`User`), `api/models/session.model.js` (`Session`)
- **Request Payload:**
  ```json
  {
    "credential": "STRING (required, Google ID Token JWT)",
    "clientId": "STRING (optional)"
  }
  ```
- **Response Shape (200 OK):** Sets HTTP-only `token` cookie and returns:
  ```json
  {
    "success": true,
    "user": {
      "_id": "673295c2e391b120",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "grade": 8,
      "carrots": 150,
      "streak": 5,
      "role": "user"
    }
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "message": "Invalid Google credentials"
  }
  ```

---

### 1.2 `GET /api/users/getProfile`
- **Backend Controller:** `api/controllers/user.controller.js` (`read`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/services/authService.js` (`getProfile`), `web/src/context/SessionProvider.jsx`
- **Mongoose Model:** `api/models/user.model.js`
- **Request Payload:** None (JWT cookie attached automatically)
- **Response Shape (200 OK):**
  ```json
  {
    "_id": "673295c2e391b120",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "grade": 8,
    "carrots": 150,
    "elo": 1240,
    "active": true
  }
  ```

---

### 1.3 `PUT /api/users/complete-profile`
- **Backend Controller:** `api/controllers/user.controller.js` (`completeProfile`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/pages/GradeSelectionPage.jsx`
- **Mongoose Model:** `api/models/user.model.js`
- **Request Payload:**
  ```json
  {
    "grade": "NUMBER (required, 1-12)"
  }
  ```
- **Response Shape (200 OK):** Returns updated user profile JSON object.

---

### 1.4 `GET /api/users/carrots`
- **Backend Controller:** `api/controllers/user.controller.js` (`getCarrots`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/services/userService.js` (`getCarrots`), `web/src/components/Carrot.jsx`
- **Mongoose Model:** `api/models/user.model.js`
- **Response Shape (200 OK):**
  ```json
  {
    "carrots": 150
  }
  ```

---

### 1.5 `POST /api/admin/login`
- **Backend Controller:** `api/controllers/admin.auth.controller.js` (`adminLogin`)
- **Auth Requirement:** Public (Admin password protected)
- **Frontend Consumer:** `web/src/pages/admin/AdminLoginPage.jsx`
- **Mongoose Model:** `api/models/admin.model.js` (`Admin`)
- **Request Payload:**
  ```json
  {
    "username": "STRING (required)",
    "password": "STRING (required)"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "admin": {
      "username": "admin",
      "role": "superadmin"
    }
  }
  ```

---

## 2. Curriculum & Assessment Engine

### 2.1 `POST /api/quiz/modules/get`
- **Backend Controller:** `api/controllers/quiz.controller.js` (`getModules`)
- **Auth Requirement:** Authenticated Student or Admin (`protectUserOrAdmin`)
- **Frontend Consumer:** `web/src/services/quizService.js` (`getModules`), `web/src/components/ModuleList.jsx`
- **Mongoose Model:** `api/models/Module.model.js` (`Module`)
- **Request Payload:**
  ```json
  {
    "subject": "STRING (optional, e.g. 'Math', 'English')",
    "grade": "NUMBER (optional, e.g. 8)"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  [
    {
      "_id": "673295c2e391b121",
      "name": "Linear Equations",
      "subject": "Math",
      "grade": 8,
      "questionCount": 10,
      "isComplete": false
    }
  ]
  ```

---

### 2.2 `POST /api/quiz/questions/get`
- **Backend Controller:** `api/controllers/quiz.controller.js` (`getQuestions`)
- **Auth Requirement:** Authenticated Student or Admin (`protectUserOrAdmin`)
- **Frontend Consumer:** `web/src/services/quizService.js` (`getQuestionsByModule`), `web/src/layouts/QuizPanelLayout.jsx`
- **Mongoose Model:** `api/models/Questions.model.js` (`Questions`)
- **Request Payload:**
  ```json
  {
    "moduleId": "STRING (required, ObjectId)",
    "page": "NUMBER (optional, default 1)",
    "limit": "NUMBER (optional, default 50)"
  }
  ```
- **Response Shape (200 OK):** Array of question objects containing stem Slate AST, options, type, and difficulty ratings.

---

### 2.3 `POST /api/quiz/submit`
- **Backend Controller:** `api/controllers/quiz.controller.js` (`submitAnswer`)
- **Auth Requirement:** Authenticated Student (`protect`, `idempotencyGuard`)
- **Frontend Consumer:** `web/src/services/quizService.js` (`submitAnswer`), `web/src/hooks/useQuizSubmit.js`
- **Mongoose Model:** `api/models/Responses.model.js` (`Responses`), `api/models/user.model.js` (`User`), `api/models/Idempotency.model.js`
- **Request Payload:**
  ```json
  {
    "questionId": "STRING (required, ObjectId)",
    "moduleId": "STRING (required, ObjectId)",
    "selectedAnswer": "STRING | NUMBER | ARRAY (required)",
    "timeTaken": "NUMBER (required, seconds)"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "isCorrect": true,
    "correctAnswer": "A",
    "explanation": "Slope represents rate of change.",
    "carrotsEarned": 2,
    "totalCarrots": 152,
    "newElo": 1252
  }
  ```

---

### 2.4 `GET /api/quiz/analytics/daily`
- **Backend Controller:** `api/controllers/quiz.controller.js` (`getDailyAnalytics`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/services/quizService.js` (`getUserAnalytics`), `web/src/pages/AnalyticsPage.jsx`
- **Mongoose Model:** `api/models/Responses.model.js`
- **Response Shape (200 OK):**
  ```json
  {
    "labels": ["2026-11-05", "2026-11-06", "2026-11-07"],
    "accuracy": [80, 85, 92],
    "questionsAttempted": [12, 18, 25]
  }
  ```

---

## 3. Reading Passages & Lexical Practice

### 3.1 `GET /api/passages/generate/passage`
- **Backend Controller:** `api/controllers/passages.controller.js` (`generatePassageQuiz`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/pages/MarathonEnglishPage.jsx`
- **Mongoose Model:** `api/models/Passages.model.js`, `api/models/Questions.model.js`
- **Response Shape (200 OK):**
  ```json
  {
    "passage": {
      "_id": "673295c2e391b135",
      "title": "The Renaissance of Artificial Intelligence",
      "text": "In the mid-twenty-first century...",
      "readingLevel": "Grade 9"
    },
    "questions": [
      {
        "_id": "673295c2e391b136",
        "question": "What is the primary thesis of the author?",
        "options": ["Option A", "Option B", "Option C", "Option D"]
      }
    ]
  }
  ```

---

### 3.2 `POST /api/passages/bulk-sentences`
- **Backend Controller:** `api/controllers/passages.controller.js` (`createBulkSentences`)
- **Auth Requirement:** Authenticated Admin (`protectAdmin`)
- **Frontend Consumer:** `web/src/components/admin/passages/SentencesList.jsx`
- **Mongoose Model:** `api/models/Passages.model.js`
- **Request Payload:**
  ```json
  {
    "passageId": "STRING (required)",
    "sentences": ["ARRAY of STRING sentences"]
  }
  ```
- **Response Shape (201 Created):** `{ "success": true, "count": 24 }`

---

## 4. Spaced Repetition Vocabulary (SRS)

### 4.1 `GET /api/vocabulary/quiz`
- **Backend Controller:** `api/controllers/vocabulary.controller.js` (`getVocabularyQuiz`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/services/passagesService.js` (`getVocabQuiz`)
- **Mongoose Model:** `api/models/Vocabulary.model.js`, `api/models/VocabProgress.model.js`
- **Response Shape (200 OK):** Array of lexical items due for student review scheduled by Leitner box priority.

---

### 4.2 `POST /api/vocabulary/answer`
- **Backend Controller:** `api/controllers/vocabulary.controller.js` (`submitVocabAnswer`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/components/AudioWord.jsx`
- **Mongoose Model:** `api/models/VocabProgress.model.js`
- **Request Payload:**
  ```json
  {
    "vocabId": "STRING (required)",
    "isCorrect": "BOOLEAN (required)"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "vocabId": "673295c2e391b140",
    "previousBox": 2,
    "newBox": 3,
    "nextReviewDate": "2026-11-19T00:00:00.000Z"
  }
  ```

---

## 5. Procedural Mathematics Engine

### 5.1 `GET /api/math/question`
- **Backend Controller:** `api/controllers/math.controller.js` (`getQuestion`)
- **Auth Requirement:** Authenticated Student (`protect`)
- **Frontend Consumer:** `web/src/pages/MathMarathonPage.jsx`
- **Query Parameters:** `?topic=algebra&difficulty=medium`
- **Response Shape (200 OK):**
  ```json
  {
    "id": "gen-math-91823",
    "topic": "algebra",
    "latexPrompt": "3x + 7 = 22",
    "expectedAnswer": "x = 5",
    "acceptedForms": ["5", "x=5", "x = 5"]
  }
  ```

---

### 5.2 `POST /api/math/answer`
- **Backend Controller:** `api/controllers/math.controller.js` (`checkAnswer`)
- **Auth Requirement:** Authenticated Student (`protect`, `idempotencyGuard`)
- **Frontend Consumer:** `web/src/components/Marathon/Inputs/MathInput.jsx`
- **Request Payload:**
  ```json
  {
    "questionId": "STRING (required)",
    "studentLatex": "STRING (required, e.g. 'x = 5')"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "isCorrect": true,
    "canonicalAnswer": "x = 5"
  }
  ```

---

## 6. Generative AI Services

### 6.1 `POST /api/genai/explanation`
- **Backend Controller:** `api/controllers/genai.controller.js` (`generateExplanation`)
- **Auth Requirement:** Authenticated Student or Admin (`protectUserOrAdmin`)
- **Frontend Consumer:** `web/src/components/admin/AIExplanationGenerator.jsx`, `web/src/components/ExplanationWriter.jsx`
- **Request Payload:**
  ```json
  {
    "question": "STRING (required)",
    "correctAnswer": "STRING (required)",
    "subject": "STRING (optional)"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "explanation": "The step-by-step resolution proceeds by subtracting 7 from both sides..."
  }
  ```

---

## 7. Media Storage & Cloud Uploads

### 7.1 `POST /api/upload/signed-url`
- **Backend Controller:** `api/routes/upload.routes.js`
- **Auth Requirement:** Authenticated Student or Admin (`protectUserOrAdmin`)
- **Frontend Consumer:** `web/src/services/uploadService.js` (`getSignedUrl`)
- **Request Payload:**
  ```json
  {
    "filename": "diagram-geometry.png",
    "contentType": "image/png"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "success": true,
    "signedUrl": "https://storage.googleapis.com/metaskills/diagram-geometry.png?GoogleAccessId=...",
    "publicUrl": "https://storage.googleapis.com/metaskills/diagram-geometry.png",
    "filename": "1731405600000-diagram-geometry.png"
  }
  ```

---

## 8. Telemetry & Bug Reporting

### 8.1 `POST /api/errors/report`
- **Backend Controller:** `api/controllers/error.controller.js` (`reportError`)
- **Auth Requirement:** Authenticated Student (`protect`, `idempotencyGuard`)
- **Frontend Consumer:** `web/src/components/common/ReportErrorModal.jsx`, `web/src/pages/ErrorReportPage.jsx`
- **Mongoose Model:** `api/models/Errors.model.js` (`Errors`)
- **Request Payload:**
  ```json
  {
    "description": "STRING (required)",
    "questionId": "STRING (optional, ObjectId)",
    "screenshotUrl": "STRING (optional, GCS public URL)",
    "deviceInfo": {
      "userAgent": "STRING",
      "screenResolution": "1920x1080"
    }
  }
  ```
- **Response Shape (201 Created):**
  ```json
  {
    "success": true,
    "reportId": "673295c2e391b150"
  }
  ```

---

## 9. Security & Probes

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/healthz/live` | `GET` | Public | Kubernetes/Vercel Liveness probe |
| `/healthz/ready` | `GET` | Public | Readiness probe checking MongoDB connection health |
| `/api/csrf-token` | `GET` | Public | Issues cryptographic double-submit CSRF cookie & header token |
