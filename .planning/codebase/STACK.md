# Technology Stack

**Analysis Date:** 2024-05-18

## Languages

**Primary:**
- JavaScript (ES Modules) - Used across both Frontend and Backend
- HTML/CSS - Frontend, with CSS-in-JS via styled-components

## Runtime

**Environment:**
- Node.js
- Docker (for Backend services, configured in `docker-compose.yml`)

**Package Manager:**
- npm (both `package.json` and `package-lock.json` present)

## Frameworks

**Core:**
- Express `^5.1.0` - Backend web framework
- React `^18.3.1` - Frontend UI library
- Mongoose `^8.16.1` - MongoDB object modeling

**Testing:**
- Fast-check `^4.5.3` - Property-based testing (Backend)

**Build/Dev:**
- Vite `^6.3.5` - Frontend build tool and dev server
- Nodemon `^3.1.10` - Backend development server
- Concurrently `^9.1.2` - Monorepo-like script runner

## Key Dependencies

**Critical:**
- `styled-components` `^6.1.19` - Frontend styling
- `radix-ui` / `@radix-ui/*` - Accessible unstyled UI components
- `framer-motion` `^12.30.0` - UI animations
- `@tanstack/react-query` `^5.90.21` - Data fetching and caching
- `slate` / `slate-react` - Rich text editor framework
- `mathlive` & `katex` - Math rendering and input

**Infrastructure:**
- `bcrypt` `^6.0.0` & `jsonwebtoken` `^9.0.2` - Authentication and authorization
- `express-rate-limit` `^8.2.1` - API rate limiting
- `dotenv` `^16.6.1` - Environment variable management

## Configuration

**Environment:**
- Root `.env` file loaded via `dotenv` in `metaskills-backend/config/env.js`
- Environment variables passed to Docker via `env_file: .env` in `docker-compose.yml`

**Build:**
- Frontend: `vite.config.js` with manual chunks for optimization (`vendor-react`, `vendor-ui`, `vendor-mathlive`, etc.)
- Backend: Docker build defined in `Dockerfile` and `docker-compose.yml`

## Platform Requirements

**Development:**
- Node.js environment or Docker desktop for running the backend (`docker-compose up`)
- Uses concurrently to run Vite and Nodemon together (`npm run dev`)

**Production:**
- Frontend: Vercel (indicated by `vercel.json` and `@vercel/analytics`)
- Backend: Containerized via Docker (exposes port 3000)

---

*Stack analysis: 2024-05-18*
