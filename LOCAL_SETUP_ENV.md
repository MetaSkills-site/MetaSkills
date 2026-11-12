# Local Setup and Environment Guide: MetaSkills Monorepo

This guide details the step-by-step procedure for provisioning a local development environment for the MetaSkills monorepo, including database connectivity, environment variable configuration, and local server execution.

---

## 1. Prerequisites

Ensure your host environment meets the following specifications before installing packages:

- **Node.js:** `v20.x` or higher (Active LTS recommended, e.g., Node 20 / 22)
- **Package Manager:** `pnpm` version `12.18.0` or higher (strictly enforced by `"preinstall": "npx --yes only-allow pnpm"`)
- **Database:** MongoDB Community Server (v6.0+) running locally or a free-tier cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Version Control:** Git `2.40+`

To install or verify `pnpm`:
```bash
corepack enable
corepack prepare pnpm@12.18.0 --activate
pnpm -v
```

---

## 2. Clone & Dependency Installation

Clone the repository and install workspace dependencies using `pnpm`:

```bash
git clone <repository-url> metaskills
cd metaskills

# Install monorepo root and all workspace packages (api/ and web/)
pnpm install
```

---

## 3. Environment Variables (`.env`)

MetaSkills loads its configuration from `.env` files in the monorepo root or package directories. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Complete Environment Variable Reference

| Variable | Environment | Required | Default / Safe Example | Description & Where to Obtain |
|---|---|---|---|---|
| `PORT` | Backend (`api`) | No | `7860` | HTTP port on which the Express server listens locally. |
| `NODE_ENV` | Backend (`api`) | Yes | `development` | Runtime environment (`development` \| `production` \| `test`). |
| `MONGODB_URI` | Backend (`api`) | Yes | `mongodb+srv://<user>:<password>@cluster.mongodb.net/metaskills` | MongoDB connection URI. Can point to a local instance (`mongodb://127.0.0.1:27017/metaskills`) or MongoDB Atlas. |
| `JWT_SECRET` | Backend (`api`) | Yes | `your_jwt_signing_secret_here` | Secret key used to sign and verify user JWT authentication cookies. Generate via `openssl rand -hex 32`. |
| `CORS_ORIGIN` | Backend (`api`) | No | `http://localhost:5173,https://metaskills.site` | Comma-separated list of allowed origins. Local dev automatically includes localhost ports. |
| `GOOGLE_CLIENT_ID` | Backend (`api`) | Yes | `your_google_oauth_client_id.apps.googleusercontent.com` | Google OAuth 2.0 Client ID for backend token verification. Obtain from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). |
| `GOOGLE_CLIENT_SECRET` | Backend (`api`) | Yes | `your_google_oauth_client_secret` | Google OAuth 2.0 Client Secret paired with the client ID above. |
| `GEMINI_API_KEY` | Backend (`api`) | Yes | `your_gemini_api_key` | Google Gemini API key for question generation and explanations. Obtain from [Google AI Studio](https://aistudio.google.com/). |
| `GROQ_API_KEY` | Backend (`api`) | No | `your_groq_api_key` | Optional fallback LLM provider key for high-speed inference. Obtain from [Groq Console](https://console.groq.com/). |
| `NVIDIA_API_KEY` | Backend (`api`) | No | `your_nvidia_api_key` | Optional secondary fallback LLM provider key. Obtain from [NVIDIA build](https://build.nvidia.com/). |
| `BREVO_API_KEY` | Backend (`api`) | No | `your_brevo_api_key` | Transactional email delivery key for system notifications. Obtain from [Brevo](https://www.brevo.com/). |
| `GCS_BUCKET_NAME` | Backend (`api`) | No | `your_gcs_bucket_name` | Google Cloud Storage bucket for reading passages and audio assets. Optional in basic local drills. |
| `GCS_SCREENSHOT_BUCKET_NAME` | Backend (`api`) | No | `your_gcs_screenshot_bucket_name` | GCS bucket for bug report screenshot captures. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Backend (`api`) | No | `./gcs-key.json` | Relative or absolute path to GCS service account JSON key file. |
| `GOOGLE_DRIVE_FOLDER_ID` | Backend (`api`) | No | `your_google_drive_folder_id` | Google Drive folder ID for automated database backups. |
| `GOOGLE_REFRESH_TOKEN` | Backend (`api`) | No | `your_google_refresh_token` | OAuth refresh token for Google Drive integration. |
| `VITE_GOOGLE_CLIENT_ID` | Frontend (`web`) | Yes | `your_google_oauth_client_id.apps.googleusercontent.com` | Google Client ID exposed to the Vite React client for the Google Login button. |

> [!TIP]
> For minimal local development without external cloud storage or email, you only need `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `GEMINI_API_KEY`.

---

## 4. Database Setup & Seeding

### 4.1 Running Local MongoDB via Docker (Optional)
If you prefer running MongoDB locally via Docker:
```bash
cd api
docker-compose up -d mongo
cd ..
```

### 4.2 Creating an Administrator Account
To access the `/admin` portal locally, run the interactive CLI creation utility:
```bash
cd api
node scripts/createAdmin.js
cd ..
```
Follow the prompt to configure your admin Google email address and role.

---

## 5. Running the Application

### 5.1 Unified Development Runner
To start both the backend API server and the frontend Vite development server concurrently:
```bash
pnpm run dev
```

- **Backend API:** Available at `http://localhost:7860`
- **Frontend SPA:** Available at `http://localhost:5173`
- **Vite Proxy:** Frontend queries to `/api/*` are automatically forwarded to `http://localhost:7860`.

### 5.2 Independent Package Runners
If you need to run packages independently:
```bash
# Start backend API only (watches changes via nodemon)
pnpm run dev:api

# Start frontend Vite server only
pnpm run dev:web
```

---

## 6. Verification and Health Probes

Verify that both tiers are active:

```bash
# Check Backend Liveness
curl http://localhost:7860/healthz/live

# Check Backend Database Readiness
curl http://localhost:7860/healthz/ready

# Check Frontend Build
pnpm run build
```

---

## 7. Common Setup Pitfalls

1. **`pnpm` is blocked with an error `npx --yes only-allow pnpm`**:
   - The repository strictly mandates `pnpm`. Running `npm install` or `yarn install` will intentionally fail. Use `pnpm install`.
2. **MongoDB Connection Fails with `Server selection timed out`**:
   - Ensure your IP address is whitelisted in your MongoDB Atlas Network Access rules, or ensure local `mongod` is listening on port `27017`.
3. **Google Sign-In fails with `Origin mismatch`**:
   - Add `http://localhost:5173` and `http://localhost:7860` to Authorized JavaScript origins in the Google Cloud Console credentials for your Client ID.
