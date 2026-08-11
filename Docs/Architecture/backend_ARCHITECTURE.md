# Project Architecture

## File Dependency Graph

### Entry Points

- `server.js`: Application bootstrap. Initializes database connection and starts the server.
  - Imports: `config/env.js`, `express.js`, `config/database.js`
- `express.js`: Express app configuration. Sets up middleware and routes.
  - Imports: `routes/*.routes.js`, `middlewares/errorHandler.js`, `middlewares/clientblock.js`

### Core Modules

#### Math Module

- **Route:** `routes/math.routes.js`
  - Mounts: `/api/math`
  - Dependencies: `controllers/math.controller.js`, `middlewares/authMiddleware.js`
- **Controller:** `controllers/math.controller.js`
  - Responsibility: Handles HTTP requests for topics, questions, and checking answers.
  - Dependencies: `services/math.service.js`, `models/user.model.js`, `config/gamification.js`
- **Service:** `services/math.service.js`
  - Responsibility: Core business logic for math questions. Manages topic hierarchy, generates questions, and verifies answers.
  - Dependencies: `services/MathQuestions.js`, `utils/math.utils.js`, `jsonwebtoken`, `mathjs`
- **Data Definition:** `services/MathQuestions.js`
  - Responsibility: Defines the available math questions, their generators, and configuration.
  - Dependencies: `mathjs`, `utils/math.utils.js`
- **Utilities:** `utils/math.utils.js`
  - Responsibility: Pure functions for mathematical comparisons (numerical, algebraic, set, sequence).

### Data Flow (Math Example)

1. **User Request:** `GET /api/math/question?id=addition`
2. **Route:** `math.routes.js` validates token (protect) and forwards to `math.controller.js`.
3. **Controller:** `math.controller.js` extracts ID and calls `mathService.generateQuestion(id)`.
4. **Service:** `math.service.js` looks up question def in `MathQuestions.js`, runs the generator to get values/display, and signs a JWT token with the payload.
5. **Response:** JSON with `token` and `question` data sent back to client.
6. **Answer Submission:** `POST /api/math/answer` with `token` and `response`.
7. **Verification:** `math.service.js` decodes token, recalculates correct answer (or generic check), and compares using `math.utils.js`.

## Critical Files

- `src/server.js`: Application entry point.
- `src/express.js`: App configuration and routing.
- `services/math.service.js`: Complex logic for question generation and validation.
- `services/MathQuestions.js`: critical "database" of question logic.
- `utils/math.utils.js`: Critical for answer verification accuracy.
