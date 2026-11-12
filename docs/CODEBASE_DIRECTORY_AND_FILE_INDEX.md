# Codebase Directory and File Index: MetaSkills Monorepo

This document provides a comprehensive, searchable structural index of all source directories, files, components, controllers, models, and utilities across the MetaSkills monorepo. Use `Ctrl+F` to search by filename, function, or domain term.

---

## 1. Monorepo Root

Root-level orchestration, configuration files, and scripts controlling multi-package build pipelines.

- **`package.json`**: Monorepo package descriptor configuring pnpm workspaces (`api`, `web`) and coordinated build, test, and lint scripts.
- **`pnpm-workspace.yaml`**: pnpm workspace topology defining member packages.
- **`pnpm-lock.yaml`**: Exact dependency resolution lockfile for deterministic installs.
- **`CONTEXT.md`**: Architectural high-level context and core monorepo command references.
- **`README.md`**: Master repository presentation, feature showcase, and deployment guide.
- **`run.sh`**: Environment orchestration script configuring ports, process supervisors, and development runners.
- **`.env.example`**: Production-safe template detailing all required backend and frontend environment variables.

---

## 2. Backend Package (`api/`)

Express 5 REST API powering authentication, curriculum state, quiz analytics, spaced repetition, mathematical parsing, and AI integrations.

### 2.1 Root API Files
- **`api/server.js`**: Standalone HTTP server bootstrapper for local development environments.
  - *Key Exports:* `start`
- **`api/express.js`**: Main Express pipeline orchestrator configuring trust proxy, CORS, CSRF, health checks, route trees, and centralized error handling.
  - *Key Exports:* `default (app)`, `stage`
- **`api/api/index.js`**: Vercel Serverless Function entrypoint wrapping the Express application instance.
  - *Key Exports:* `default (handler)`
- **`api/package.json`**: Backend dependency manifest and Jest test suite runner configuration.
- **`api/eslint.config.js`**: ESLint flat configuration for backend ES Modules.
- **`api/jest.config.js`**: Jest test harness configuration with ES Module support flags.
- **`api/docker-compose.yml`**: Docker service definitions for containerized local MongoDB and Node runtime.
- **`api/Dockerfile`**: Container image build recipe for production deployment.
- **`api/vercel.json`**: Serverless function runtime routing and headers specification.

### 2.2 Configuration (`api/config/`)
Environment variable ingestion, database pooling, and third-party service credential bindings.
- **`api/config/env.js`**: Dotenv loader and runtime environment variable validator.
- **`api/config/database.js`**: Mongoose connection manager implementing connection reuse, pool caps, and health check probes.
  - *Key Exports:* `connectDB`, `disconnectDB`, `checkDatabaseHealth`, `isServerShuttingDown`, `setShuttingDown`
- **`api/config/brevo.js`**: Brevo (Sendinblue) transactional email client configuration.
  - *Key Exports:* `apiInstance`, `sendSmtpEmail`
- **`api/config/googledriveupload.js`**: Google Drive OAuth2 backup client setup.
- **`api/config/gamification.js`**: Carrot award constants, streak thresholds, and Elo rating boundaries.
- **`api/config/aiPromptConfig.js`**: System prompt templates for Gemini and secondary LLM inference.
- **`api/config/scripts.registry.js`**: Manifest of executable admin database maintenance scripts.

### 2.3 Controllers (`api/controllers/`)
Request handling, input validation, business logic dispatch, and HTTP response serialization.
- **`api/controllers/user.controller.js`**: Student profile management, Google OAuth credential exchange, session verification, carrot rewards, and password management.
  - *Key Exports:* `loginUser`, `googleAuth`, `getProfile`, `updateProfile`, `addCarrots`, `getCarrots`
- **`api/controllers/admin.auth.controller.js`**: Administrator authentication, bcrypt password validation, and JWT issuing.
  - *Key Exports:* `adminLogin`, `verifyAdminSession`, `adminLogout`
- **`api/controllers/adminAnalytics.controller.js`**: Aggregated performance metrics, active user cohorts, and quiz attempt summaries for admin dashboards.
  - *Key Exports:* `getOverviewStats`, `getUserGrowth`, `getQuizPerformance`
- **`api/controllers/quiz.controller.js`**: Question bank CRUD, module curriculum retrieval, student answer evaluation, and quiz state tracking.
  - *Key Exports:* `getModules`, `getQuestionsByModule`, `submitAnswer`, `createQuestion`, `updateQuestion`, `deleteQuestion`
- **`api/controllers/passages.controller.js`**: Reading comprehension passage CRUD, sentence splitting, and context attachment binding.
  - *Key Exports:* `getPassages`, `getPassageById`, `createPassage`, `updatePassage`, `deletePassage`
- **`api/controllers/vocabulary.controller.js`**: Spaced Repetition System (SRS) vocabulary tracking, Leitner box transitions, and audio pronunciation lookups.
  - *Key Exports:* `getVocabularyReview`, `submitVocabAnswer`, `createVocabItem`, `getVocabProgress`
- **`api/controllers/math.controller.js`**: Procedural math question generator endpoints and algebraic expression validation.
  - *Key Exports:* `generateMathQuestions`, `verifyMathAnswer`
- **`api/controllers/genai.controller.js`**: LLM interaction endpoints generating pedagogical explanations and distractors.
  - *Key Exports:* `generateExplanation`, `generateQuestion`
- **`api/controllers/contextAttachments.controller.js`**: File attachment management, document linking, and GCS signed URL issuance.
  - *Key Exports:* `uploadAttachment`, `getAttachments`, `deleteAttachment`
- **`api/controllers/session.controller.js`**: Active session heartbeat tracking, concurrency limits, and forced session invalidation.
  - *Key Exports:* `recordHeartbeat`, `getActiveSessions`, `revokeSession`
- **`api/controllers/notification.controller.js`**: Broadcast notification publishing, in-app notifications, and read receipt tracking.
  - *Key Exports:* `getNotifications`, `markAsRead`, `broadcastNotification`
- **`api/controllers/error.controller.js`**: User-reported UI bugs and uncaught runtime exception ingestion.
  - *Key Exports:* `reportError`, `getErrorReports`, `updateErrorStatus`
- **`api/controllers/performance.controller.js`**: Student historical mastery graphs and subject-level proficiency analytics.
  - *Key Exports:* `getUserPerformance`, `getSkillMastery`
- **`api/controllers/sequence.controller.js`**: Custom pedagogical question ordering and adaptive prerequisite pathways.
  - *Key Exports:* `getSequence`, `saveSequence`
- **`api/controllers/attendance.controller.js`**: Daily streak calculations, student attendance logging, and activity heatmaps.
  - *Key Exports:* `recordAttendance`, `getAttendanceHistory`
- **`api/controllers/backup.controller.js`**: Automated MongoDB database dumps to Google Drive archives.
  - *Key Exports:* `triggerBackup`, `getBackupHistory`
- **`api/controllers/scripts.controller.js`**: Administrator execution interface for background data migrations and health audits.
  - *Key Exports:* `listScripts`, `runScript`
- **`api/controllers/migration.controller.js`**: Database schema migration trigger and verification handlers.
  - *Key Exports:* `runMigrations`, `getMigrationStatus`

### 2.4 Models (`api/models/`)
Mongoose schemas defining domain entities, validation constraints, compound indexes, and hooks.
- **`api/models/user.model.js`**: Student user schema tracking credentials, Elo ratings, carrots, daily streaks, and preferences.
- **`api/models/admin.model.js`**: Administrator credentials, permission roles, and last login timestamps.
- **`api/models/Module.model.js`**: Curriculum learning modules categorized by subject, grade level, and completion flags.
- **`api/models/Questions.model.js`**: Polymorphic assessment question schema supporting MCQ, fill-in-the-blank, grammar, math, and passage-linked items.
- **`api/models/Responses.model.js`**: Student answer submissions, completion timings, evaluation results, and awarded gamification points.
- **`api/models/Passages.model.js`**: Reading comprehension passages with rich text content, reading grade levels, and associated questions.
- **`api/models/Vocabulary.model.js`**: Vocabulary terms, part of speech, definitions, example sentences, and audio pronunciation URLs.
- **`api/models/VocabProgress.model.js`**: Student Leitner box progression, next review dates, and recall accuracy.
- **`api/models/ContextAttachments.model.js`**: Media and document metadata associated with curriculum modules or error reports.
- **`api/models/Notification.model.js`**: System announcements, achievement banners, and individual user notifications.
- **`api/models/session.model.js`**: User active session records tracking IP addresses, user agents, and heartbeat timestamps.
- **`api/models/Errors.model.js`**: Bug reports with client stack traces, browser environment data, and uploaded screenshot references.
- **`api/models/Sequence.model.js`**: Customized question sequencing rules per module or student cohort.
- **`api/models/Idempotency.model.js`**: Operation mutation keys preventing duplicate carrot awards and replayed requests.

### 2.5 Routes (`api/routes/`)
Express route definitions binding HTTP verbs and URL paths to middleware chains and controller handlers.
- **`api/routes/user.routes.js`**: Mounts `/api/users` routes.
- **`api/routes/admin.routes.js`**: Mounts `/api/admin` routes.
- **`api/routes/adminAnalytics.route.js`**: Mounts `/api/admin/analytics` routes.
- **`api/routes/quiz.routes.js`**: Mounts `/api/quiz` routes.
- **`api/routes/passages.routes.js`**: Mounts `/api/passages` routes.
- **`api/routes/vocabulary.routes.js`**: Mounts `/api/vocabulary` routes.
- **`api/routes/math.routes.js`**: Mounts `/api/math` routes.
- **`api/routes/genai.routes.js`**: Mounts `/api/genai` routes.
- **`api/routes/contextAttachments.routes.js`**: Mounts `/api/context-attachments` routes.
- **`api/routes/upload.routes.js`**: Mounts `/api/upload` routes.
- **`api/routes/error.routes.js`**: Mounts `/api/errors` routes.
- **`api/routes/backup.routes.js`**: Mounts `/api/backup` routes.

### 2.6 Middlewares (`api/middlewares/`)
Request interceptors enforcing security policies, authentication, validation, and error normalization.
- **`api/middlewares/authMiddleware.js`**: JWT verification extracting student and admin user claims from cookies and authorization headers.
  - *Key Exports:* `protect`, `adminOnly`
- **`api/middlewares/clientblock.js`**: Origin whitelist guard and CORS header attachment.
  - *Key Exports:* `default (clientblock)`, `setCorsHeaders`
- **`api/middlewares/csrfMiddleware.js`**: Double-submit CSRF token generation and validation middleware.
  - *Key Exports:* `csrfProtection`, `generateCsrfToken`
- **`api/middlewares/errorHandler.js`**: Centralized error interceptor formatting standardized JSON payloads.
  - *Key Exports:* `default (errorHandler)`
- **`api/middlewares/idempotency.js`**: Request deduplication middleware utilizing `Idempotency.model.js`.
- **`api/middlewares/rateLimit.js`**: Route-specific rate limit configurations.
- **`api/middlewares/rateLimiters.js`**: Rate limiter instances protecting login, registration, and AI generation endpoints.

### 2.7 Services (`api/services/`)
Isolated computational domain logic, procedural generators, and external AI orchestrators.
- **`api/services/quiz.service.js`**: Answer evaluation heuristics, score aggregations, and question filtering.
- **`api/services/math.service.js`**: Computer algebra engine using Mathjs and Algebrite to evaluate expression equivalency.
- **`api/services/MathQuestions.js`**: Facade dispatcher for procedural mathematics topics.
- **`api/services/genai.service.js`**: Multi-model LLM gateway managing prompts, retries, and fallback across Gemini, Groq, and NVIDIA.
- **`api/services/ai.service.js`**: Natural language parsing and text extraction helper service.
- **`api/services/math-questions/`**: Procedural generators for distinct mathematical disciplines:
  - `algebra.js`: Algebraic equations and variable expansions.
  - `arithmetic.js`: Mental math and multi-digit operations.
  - `combinatorics.js`: Permutations, combinations, and probability drills.
  - `fractions.js`: Rational number arithmetic and simplification.
  - `geometry.js`: Area, perimeter, and coordinate geometry questions.
  - `logarithms.js`: Logarithmic base conversions and laws.
  - `registry.js`: Central registry mapping subject identifiers to generators.
  - `series.js`: Arithmetic and geometric sequences.
  - `simultaneous.js`: Linear system equation solving.
  - `statistics.js`: Mean, median, mode, variance, and standard deviation.
  - `trigonometry.js`: Unit circle, trigonometric ratios, and identities.

### 2.8 Utilities (`api/utils/`)
Shared helper functions and calculations.
- **`api/utils/genToken.js`**: Signs JWT authentication tokens with configured expiry.
- **`api/utils/elo.js`**: Elo rating calculation algorithm updating student and question difficulty ratings.
- **`api/utils/accuracy.js`**: Historical accuracy metrics and moving average calculations.
- **`api/utils/encryption.js`**: Symmetric cryptography helpers for sensitive data at rest.
- **`api/utils/math.utils.js`**: Formatting and string normalization utilities for LaTeX expressions.
- **`api/utils/slateHelpers.js`**: Rich text AST serializers and plain-text extractors for Slate nodes.
- **`api/utils/storage.js`**: Google Cloud Storage file upload, deletion, and signed URL generation helpers.
- **`api/utils/screenshotStorage.js`**: Dedicated storage handler for error report screenshot captures.
- **`api/utils/textChunker.js`**: Long text chunking utility for NLP and reading passage processing.

### 2.9 Migrations & Maintenance Scripts (`api/migrations/`, `api/scripts/`)
Data transformation and schema migration scripts.
- **`api/migrations/migrateActiveField.js`**: Backfills active flags, default Elo ratings (1200), and session timestamps.
- **`api/migrations/migrateModuleUniqueIndex.js`**: Deduplicates modules and builds compound unique indexes.
- **`api/migrations/migratePassageRating.js`**: Initializes default Elo difficulty ratings for passages.
- **`api/migrations/migratePostAnalyticsFix.js`**: Seeds model schema defaults and removes deprecated analytics structures.
- **`api/migrations/migrateVocab.js`**: Backfills default Elo ratings on vocabulary items.
- **`api/migrations/removeOrderProperty.js`**: Purges obsolete `order` properties across modules and questions.
- **`api/migrations/updateModulesIsComplete.js`**: Reconciles completion boolean flags on legacy modules.
- **`api/scripts/addSkillsToQuestions.js`**: Classifies questions into pedagogical skill taxonomies.
- **`api/scripts/cleanup-sessions.js`**: Purges expired session tokens and corrects discriminator mappings.
- **`api/scripts/cleanupUploads.js`**: Garbage-collects orphaned GCS uploads older than 1 hour.
- **`api/scripts/createAdmin.js`**: CLI utility for creating privileged administrator accounts.
- **`api/scripts/integration-test-vocab-srs.js`**: E2E test runner verifying vocabulary Leitner box transitions.
- **`api/scripts/migrate-question-modules.js`**: Migrates scalar module IDs to reference arrays.
- **`api/scripts/migrateCandiesToCarrots.js`**: Converts legacy gamification currency to carrots.
- **`api/scripts/migrateCarrotsObject.js`**: Transforms scalar carrot counts into streak-tracking objects.
- **`api/scripts/migratePassagesText.js`**: Converts Slate AST nodes into plain text strings on passages.
- **`api/scripts/migrate_legacy_auth_fields.js`**: Cleans up legacy password hashes post-OAuth migration.
- **`api/scripts/populateVocabulary.js`**: Seeds vocabulary database from external lexical APIs.

---

## 3. Frontend Package (`web/`)

React 18 Single Page Application featuring interactive quiz layouts, mathematical typesetting, spaced repetition vocabulary drills, rich text editors, and an administrative control panel.

### 3.1 Application Entry & Configuration
- **`web/src/main.jsx`**: Bootstraps the React DOM root, QueryClient, Google OAuth Provider, Helmet provider, and React Router routing tree.
- **`web/src/App.jsx`**: Root component providing toast containers, global styles, and route outlets.
- **`web/vite.config.js`**: Vite configuration setting up React plugin, manual vendor chunk splitting, esbuild optimization, and proxy routes.
- **`web/eslint.config.js`**: ESLint flat configuration for React, React Hooks, and JSX.
- **`web/index.html`**: HTML shell hosting DOM root, meta tags, and font preloads.
- **`web/vercel.json`**: Vercel frontend rewrite configuration proxying `/api/*` to the backend.

### 3.2 Layouts (`web/src/layouts/`)
Top-level shell layouts wrapping routes.
- **`web/src/layouts/DashboardLayout.jsx`**: Authenticated student dashboard shell rendering navigation headers, carrot counters, and main content.
- **`web/src/layouts/AuthLayout.jsx`**: Presentation wrapper for sign-in, sign-up, and onboarding screens with background effects.
- **`web/src/layouts/QuizPanelLayout.jsx`**: Full-screen assessment container managing quiz timers, question carousels, answer submissions, and review summaries.

### 3.3 Pages (`web/src/pages/`)
Top-level route components mounted in `main.jsx`.
- **`web/src/pages/HomePage.jsx`**: Public landing page showcasing platform features, gamification, and call-to-action sections.
- **`web/src/pages/AuthPage.jsx`**: Student sign-in and Google OAuth login view.
- **`web/src/pages/GradeSelectionPage.jsx`**: Onboarding view for student grade and curriculum level selection.
- **`web/src/pages/ModuleStartPage.jsx`**: Module intro screen presenting prerequisites, question count, and past performance.
- **`web/src/pages/ModuleHistoryPage.jsx`**: Historical log of attempted modules, scores, and completion timestamps.
- **`web/src/pages/AnalyticsPage.jsx`**: Student analytics dashboard displaying accuracy trends, subject strengths, and carrot milestones.
- **`web/src/pages/MarathonPage.jsx`**: Endurance assessment hub selecting between English, Math, and Sentence marathons.
- **`web/src/pages/MarathonEnglishPage.jsx`**: Reading comprehension and vocabulary marathon test runner.
- **`web/src/pages/MathMarathonPage.jsx`**: Procedural mathematics marathon interface with real-time expression validation.
- **`web/src/pages/MarathonSentencePracticePage.jsx`**: Sentence reconstruction and grammar assessment drill.
- **`web/src/pages/MarathonStartPage.jsx`**: Marathon challenge briefing and difficulty selector.
- **`web/src/pages/SplashPage.jsx`**: App splash and initial state loading animation.
- **`web/src/pages/ErrorReportPage.jsx`**: Bug submission interface with client diagnostic capture and screenshot upload.
- **`web/src/pages/NotFoundPage.jsx`**: 404 error page.
- **`web/src/pages/OfflinePage.jsx`**: PWA offline indicator screen when network connectivity is lost.
- **`web/src/pages/ErrorPage.jsx`**: Global uncaught React Error Boundary fallback view.

### 3.4 Admin Pages (`web/src/pages/admin/`)
Restricted administrator portal views for curriculum and user management.
- **`web/src/pages/admin/AdminLoginPage.jsx`**: Dedicated administrator credential login interface.
- **`web/src/pages/admin/AdminDashboardPage.jsx`**: Executive overview displaying high-level system metrics and navigation shortcuts.
- **`web/src/pages/admin/AdminAnalyticsPage.jsx`**: Deep-dive analytics on question accuracy, drop-off rates, and cohort engagement.
- **`web/src/pages/admin/UsersViewPage.jsx`**: Student account moderation, carrot adjustment, and activity logs.
- **`web/src/pages/admin/ModulesViewPage.jsx`**: Curriculum module CRUD and reordering interface.
- **`web/src/pages/admin/QuestionsViewPage.jsx`**: Question bank manager with filtering by module, difficulty, and type.
- **`web/src/pages/admin/AllQuestionsViewPage.jsx`**: Global table view of all questions with bulk actions.
- **`web/src/pages/admin/ModulesQuestionsViewPage.jsx`**: Module-specific question list and difficulty distribution.
- **`web/src/pages/admin/QuestionEntryPage.jsx`**: Multi-step question authoring wizard supporting Slate rich text and Mathlive formulas.
- **`web/src/pages/admin/TrashQuestionsPage.jsx`**: Soft-deleted question recovery and permanent purge interface.
- **`web/src/pages/admin/PassagesViewPage.jsx`**: Reading passage creator and sentence breakdown editor.
- **`web/src/pages/admin/ContextAttachmentsViewPage.jsx`**: Media asset and attachment file manager.
- **`web/src/pages/admin/ActiveSessionsPage.jsx`**: Real-time connected user sessions monitor with remote revocation capability.
- **`web/src/pages/admin/NotificationsManagementPage.jsx`**: Broadcast announcement composer.
- **`web/src/pages/admin/ErrorReportsPage.jsx`**: Triage inbox for user error submissions and screenshots.
- **`web/src/pages/admin/SequenceManagerPage.jsx`**: Visual question sequencing and prerequisite mapping editor.
- **`web/src/pages/admin/BulkImportPage.jsx`**: PDF and JSON question ingestion parser with AI extraction.
- **`web/src/pages/admin/MarathonManagementPage.jsx`**: Marathon challenge rule, duration, and scoring configuration.
- **`web/src/pages/admin/UserHistoryPage.jsx`**: Detailed individual student drill-down and answer audit log.

### 3.5 Core Components (`web/src/components/`)
Modular UI blocks composing student assessment views.
- **`web/src/components/AuthGuard.jsx`**: Route protection wrapper redirecting unauthenticated students.
- **`web/src/components/ProtectedRoute.jsx`**: Generic route guard checking authentication and profile completion.
- **`web/src/components/GoogleAuth.jsx`**: Google OAuth login button and token handler.
- **`web/src/components/ModuleList.jsx`**: Grid of curriculum modules with progress indicators.
- **`web/src/components/ModuleCompleted.jsx`**: Celebration screen displayed upon finishing all questions in a module.
- **`web/src/components/MarathonQuiz.jsx`**: Marathon quiz coordinator managing timed loops and adaptive difficulty.
- **`web/src/components/MathMarathonQuiz.jsx`**: Specialized runner for mathematical marathon drills.
- **`web/src/components/SlateRenderer.jsx`**: Read-only renderer for Slate rich text JSON AST nodes.
- **`web/src/components/TokenQuestionRenderer.jsx`**: Interactive sentence word-token selector for grammar questions.
- **`web/src/components/ExplanationWriter.jsx`**: Pedagogical explanation display with AI expansion toggles.
- **`web/src/components/QuestionPreview.jsx`**: Real-time visual preview of authored questions.
- **`web/src/components/QuestionEditor.jsx`**: Form editor for question stems, options, and explanations.
- **`web/src/components/QuestionBlock.jsx`**: Question presentation card with responsive option layout.
- **`web/src/components/Latex.jsx`**: KaTeX wrapper rendering mathematical formulas from LaTeX strings.
- **`web/src/components/MathField.jsx`**: Interactive Mathlive virtual keyboard input field.
- **`web/src/components/Carrot.jsx`**: Animated gamification carrot icon and balance badge.
- **`web/src/components/ChartWidget.jsx`**: Chart.js wrapper rendering accuracy and progress graphs.
- **`web/src/components/DashboardCard.jsx`**: Metric presentation card used across dashboard views.
- **`web/src/components/AudioWord.jsx`**: Pronunciation audio player with word highlighting.
- **`web/src/components/SkeletonLoader.jsx`**: Shimmering placeholder loader for async content.
- **`web/src/components/Marathon/`**: Sub-components dedicated to marathon assessment modes:
  - `MarathonStatusScreen.jsx`: Score, streak, and time-remaining overlay.
  - `VocabularyMarathonMenu.jsx`: Vocabulary marathon mode and difficulty picker.
  - `Inputs/InputFactory.jsx`: Dynamic dispatcher selecting the appropriate input component.
  - `Inputs/DynamicInput.jsx`: Adaptive text/number input.
  - `Inputs/MathInput.jsx`: Mathlive formula input with virtual keyboard.
  - `Inputs/PolynomialInput.jsx`: Specialized multi-term polynomial equation editor.
  - `Renderers/MCQQuestion.jsx`: Standard multiple-choice option grid.
  - `Renderers/PassageQuestion.jsx`: Side-by-side reading passage and question split view.
  - `Renderers/GrammarQuestion.jsx`: Clickable inline word/token sentence parser.
  - `Renderers/MathQuestion.jsx`: Formula problem prompt with LaTeX rendering.
  - `Renderers/OptionsGrid.jsx`: Accessible keyboard-navigable answer options container.

### 3.6 Common & Shared Components (`web/src/components/common/`, `web/src/components/shared/`)
Reusable UI primitives and input controls.
- **`web/src/components/common/ReportErrorModal.jsx`**: Modal dialog for filing bug reports with automated screenshot capture.
- **`web/src/components/common/GeminiGenerator.jsx`**: Admin AI generator trigger for question stems and explanations.
- **`web/src/components/common/QuizResultDisplay.jsx`**: Score breakdown and answer review dialog.
- **`web/src/components/common/StartPage.jsx`**: Standard pre-quiz instruction card.
- **`web/src/components/common/Confetti.jsx`**: Canvas-based particle celebration effect for milestones.
- **`web/src/components/common/ConsentBanner.jsx`**: Cookie consent and terms agreement banner.
- **`web/src/components/common/SurfaceCard.jsx`**: Standard elevated card container.
- **`web/src/components/common/TagInput.jsx`**: Tag and category management chip input.
- **`web/src/components/shared/SmartBlankInput.jsx`**: Adaptive fill-in-the-blank input field.
- **`web/src/components/shared/InlineBlankFeedback.jsx`**: Color-coded feedback for inline sentence blanks.
- **`web/src/components/shared/HighlightedText.jsx`**: Highlighting parser for passage search terms and errors.

### 3.7 Admin Components (`web/src/components/admin/`)
Curriculum authoring and administration widgets.
- **`web/src/components/admin/ProtectedAdminRoute.jsx`**: Security guard verifying active admin session token.
- **`web/src/components/admin/AdminAuthProvider.jsx`**: React Context providing admin auth state and login/logout methods.
- **`web/src/components/admin/AdminDashboardView.jsx`**: Overview metrics cards and quick action buttons.
- **`web/src/components/admin/AdminTabs.jsx`**: Navigation bar switching between admin views.
- **`web/src/components/admin/PassageEditor.jsx`**: Rich text passage authoring interface with sentence breakdown tools.
- **`web/src/components/admin/CreatePassage.jsx`**: New reading passage creation modal.
- **`web/src/components/admin/ModuleSelector.jsx`**: Dropdown module selector with category grouping.
- **`web/src/components/admin/ContextSelector.jsx`**: File attachment selector for questions and passages.
- **`web/src/components/admin/AIExplanationGenerator.jsx`**: Inline AI widget generating explanations from question data.
- **`web/src/components/admin/SearchAndFilter.jsx`**: Debounced search bar with category and difficulty filter chips.
- **`web/src/components/admin/RunScripts.jsx`**: Admin console for running registered database maintenance scripts.
- **`web/src/components/admin/passages/PassagesList.jsx`**: Searchable table of reading comprehension passages.
- **`web/src/components/admin/passages/VocabularyList.jsx`**: Lexical terms table with difficulty levels and audio links.
- **`web/src/components/admin/passages/SentencesList.jsx`**: Extracted sentence list for sentence-practice drills.

### 3.8 Context & State (`web/src/context/`)
React Context providers managing cross-component state.
- **`web/src/context/SessionProvider.jsx`**: Student user session provider managing authentication tokens, profile data, carrot count, and Google login lifecycle.
- **`web/src/context/ModuleContext.jsx`**: Active module state, progress tracking, and current question pointers.
- **`web/src/context/EditorContext.jsx`**: Slate rich text editor state and selection history provider.

### 3.9 Services (`web/src/services/`)
Client HTTP clients communicating with backend API routes.
- **`web/src/services/api.js`**: Axios client instance configured with base URL, credentials, CSRF token handling, and GET caching.
- **`web/src/services/authService.js`**: Authentication API calls (`getProfile`, `logoutSession`).
- **`web/src/services/quizService.js`**: Module fetching, question bank queries, answer submissions, and analytics retrieval.
- **`web/src/services/userService.js`**: Student profile updates, password changes, and carrot balance queries.
- **`web/src/services/adminService.js`**: Administrative actions (metrics, user management, active sessions, backups, maintenance scripts).
- **`web/src/services/passagesService.js`**: Passage CRUD, sentence management, and vocabulary operations.
- **`web/src/services/uploadService.js`**: File and image upload service to GCS via backend endpoints.
- **`web/src/services/adminApi.js`**: Dedicated Axios client for administrative endpoints.

### 3.10 Utilities (`web/src/utils/`)
Frontend validation, formatting, and DOM helpers.
- **`web/src/utils/answerValidation.js`**: Client-side answer normalization and fill-in-the-blank grading helpers.
- **`web/src/utils/questionValidation.js`**: Multi-step question authoring validator ensuring stems, options, and answers are complete.
- **`web/src/utils/slateUtils.js`**: Slate node serialization to HTML/Markdown and blank placeholder extraction.
- **`web/src/utils/feedbackStyles.js`**: Color tokens and CSS helper functions for correct/incorrect feedback states.
- **`web/src/utils/validate.js`**: Form input validation functions.
- **`web/src/utils/adminUtils.jsx`**: Helper components for difficulty badges, formatted HTML content, and expandable question rows.

### 3.11 Custom Hooks (`web/src/hooks/`)
Encapsulated state and browser event hooks.
- **`web/src/hooks/useFetch.js`**: Generic data fetching hook with loading, error, and refetch state.
- **`web/src/hooks/useQuizSubmit.js`**: Quiz answer submission handler with optimistic updates and carrot animations.
- **`web/src/hooks/useAdminVirtualizer.js`**: Virtualized windowing hook for high-performance rendering of large question lists.
- **`web/src/hooks/useSequenceManager.js`**: Drag-and-drop question ordering and state persistence hook.
- **`web/src/hooks/useInfiniteScroll.js`**: IntersectionObserver hook for paginated list loading.
- **`web/src/hooks/useProgressiveFade.js`**: Scroll-driven opacity and parallax transition hook for landing page sections.
- **`web/src/hooks/event-hooks/useKeyboardShortcut.js`**: Keyboard shortcut listener with modifier key support.
- **`web/src/hooks/event-hooks/useBackShortcut.js`**: Escape/Backspace key handler for navigating back in quiz panels.
- **`web/src/hooks/event-hooks/useStepperShortcuts.js`**: Number key shortcuts (1-4) for rapid multiple-choice option selection.
