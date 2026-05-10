# External Integrations

**Analysis Date:** 2025-02-14

## APIs & External Services

**AI & Machine Learning:**
- Google GenAI (Gemini) - Used for content generation and text analysis
  - SDK/Client: `@google/genai`
- OpenAI API - Used for AI generation features
  - SDK/Client: `openai`
- Groq / NVIDIA - High-speed inference for fallback and vision pipelines
  - Integration logic defined in `metaskills-backend/config/aiPromptConfig.js` and `metaskills-backend/services/ai.service.js`

**Email Delivery:**
- Brevo (formerly Sendinblue) - Transactional emails
  - SDK/Client: `@getbrevo/brevo`
  - Auth: `BREVO_API_KEY` (configured in `metaskills-backend/config/brevo.js`)

**File Management & Backups:**
- Google Drive API - Used for system backups
  - SDK/Client: `googleapis` (Drive v3)
  - Auth: OAuth2 with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- Google Cloud Storage - Object storage
  - SDK/Client: `@google-cloud/storage`

## Data Storage

**Databases:**
- MongoDB
  - Connection: `MONGO_URI` (configured in `metaskills-backend/config/database.js` with IPv4 fallback logic)
  - Client: `mongoose`

## Authentication & Identity

**Auth Provider:**
- Custom JWT Authentication
  - Implementation: `bcrypt` for password hashing and `jsonwebtoken` for stateless auth
- Google OAuth (SSO)
  - Implementation: Frontend uses `@react-oauth/google`, Backend verifies via `google-auth-library`

## Monitoring & Observability

**Analytics:**
- Firebase Analytics - Client-side event tracking
  - Auth: `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc. (configured in `metaskills-backend/config/firebase.js`)
- Vercel Analytics - Web vitals and visitor tracking
  - SDK/Client: `@vercel/analytics`

## CI/CD & Deployment

**Hosting:**
- Vercel (Frontend platform)
- Docker (Backend containers)

## Environment Configuration

**Required env vars:**
- `MONGO_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google GenAI authentication
- `GROQ_API_KEY` - Groq API authentication
- `NVIDIA_API_KEY` - NVIDIA NIM authentication
- `BREVO_API_KEY` - Email service authentication
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REFRESH_TOKEN` - Google OAuth refresh token for Drive integration
- `FIREBASE_*` - Firebase configuration variables

**Secrets location:**
- Stored in a root `.env` file, consumed by both the Node process and Docker Compose context.

---

*Integration audit: 2025-02-14*
