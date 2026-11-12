# Component and View Catalog: MetaSkills Frontend

This catalog documents the views, page components, layouts, and reusable component primitives within `web/src/`.

---

## 1. Application Layouts

### 1.1 `DashboardLayout`
- **File:** `web/src/layouts/DashboardLayout.jsx`
- **Purpose:** Primary shell for authenticated student users. Renders the top navigation header, user profile greeting, real-time carrot counter, streak indicators, and marathon launch shortcuts.
- **Props:** None (renders nested route components via `<Outlet />`).
- **State:**
  - `activeSubject`: Currently selected subject tab filter (e.g., `"Math"`, `"English"`).
- **API Calls:**
  - `GET /api/users/profile` (via `SessionContext` / `authService.getProfile`)
  - `GET /api/users/carrots` (via `userService.getCarrots`)
- **Child Components:** `<Nav />`, `<HeaderGreeting />`, `<PerformanceOverviewCard />`, `<Outlet />`
- **Route:** `/dashboard`, `/modules/:subject`
- **Access Control:** Authenticated Student (`AuthGuard`).

---

### 1.2 `AuthLayout`
- **File:** `web/src/layouts/AuthLayout.jsx`
- **Purpose:** Centered, distraction-free authentication wrapper featuring animated background gradients, responsive brand cards, and footer links.
- **Props:**
  - `subHeader` (string, optional): Supplementary badge text (e.g., `"Admin Portal"`).
- **State:** None (stateless layout shell).
- **API Calls:** None.
- **Child Components:** `<Outlet />`
- **Route:** `/auth`, `/auth/complete-profile`, `/admin/login`
- **Access Control:** Public.

---

### 1.3 `QuizPanelLayout`
- **File:** `web/src/layouts/QuizPanelLayout.jsx`
- **Purpose:** High-focus full-screen assessment view managing timed quiz attempts, question pagination, answer submission, immediate pedagogical feedback, and completion modals.
- **Props:** None (extracts `moduleId` from `useParams`).
- **State:**
  - `currentQuestionIndex` (number): Active question pointer in the sequence.
  - `selectedAnswers` (object): Map of question IDs to student selected options or text answers.
  - `timer` (number): Elapsed time in seconds for the active question.
  - `isSubmitted` (boolean): Flag indicating whether the active question has been evaluated.
  - `showSummary` (boolean): Flag toggling the post-module completion review modal.
- **API Calls:**
  - `GET /api/quiz/module/:moduleId` (via `quizService.getQuestionsByModule`)
  - `POST /api/quiz/submit` (via `quizService.submitAnswer`)
  - `POST /api/users/addCarrots` (via `userService.addCarrots`)
- **Child Components:** `<QuestionBlock />`, `<OptionsGrid />`, `<SmartBlankInput />`, `<SlateRenderer />`, `<Latex />`, `<QuizResultDisplay />`, `<Confetti />`
- **Route:** `/attempt/:moduleId`
- **Access Control:** Authenticated Student (`AuthGuard`).

---

## 2. Student Views & Pages

### 2.1 `HomePage`
- **File:** `web/src/pages/HomePage.jsx`
- **Purpose:** Public landing page presenting the value proposition, gamification mechanics, interactive sample questions, and login CTA.
- **Props:** None.
- **State:** None (relies on scroll-driven animations via `useProgressiveFade`).
- **API Calls:** None. Redirects to `/dashboard` if student session is active.
- **Child Components:** `<HeroSection />`, `<FeaturesSection />`, `<TailoredSection />`, `<MarathonSection />`, `<GamificationSection />`, `<CTASection />`, `<FooterSection />`
- **Route:** `/`
- **Access Control:** Public.

---

### 2.2 `AuthPage`
- **File:** `web/src/pages/AuthPage.jsx`
- **Purpose:** Student login and signup interface hosting Google One-Tap / OAuth popup authentication.
- **Props:** None.
- **State:**
  - `isLoading` (boolean): Network transit state.
  - `authError` (string | null): Error banner message.
- **API Calls:**
  - `POST /api/users/google-auth` (exchanges Google credential for JWT cookie)
- **Child Components:** `<GoogleAuth />`, `<SurfaceCard />`
- **Route:** `/auth`
- **Access Control:** Public (redirects to `/dashboard` if authenticated).

---

### 2.3 `GradeSelectionPage`
- **File:** `web/src/pages/GradeSelectionPage.jsx`
- **Purpose:** First-time onboarding screen where newly registered students select their target academic grade level.
- **Props:** None.
- **State:**
  - `selectedGrade` (string | number): Picked grade value.
- **API Calls:**
  - `PUT /api/users/profile` (updates grade level preference)
- **Child Components:** `<GradeSelector />`, `<SurfaceCard />`
- **Route:** `/auth/complete-profile`
- **Access Control:** Authenticated Student missing grade preference.

---

### 2.4 `ModuleStartPage`
- **File:** `web/src/pages/ModuleStartPage.jsx`
- **Purpose:** Pre-quiz briefing card displaying module title, description, question count, difficulty level, and student high scores before starting.
- **Props:** None (extracts `moduleId` from `useParams`).
- **State:**
  - `moduleData` (object | null): Hydrated module details.
- **API Calls:**
  - `GET /api/quiz/module/:moduleId` (via `quizService.getQuestionsByModule`)
- **Child Components:** `<StartPage />`, `<BackLink />`, `<ModuleStartSkeleton />`
- **Route:** `/module/:moduleId`
- **Access Control:** Authenticated Student.

---

### 2.5 `AnalyticsPage`
- **File:** `web/src/pages/AnalyticsPage.jsx`
- **Purpose:** In-depth personal learning dashboard plotting accuracy over time, total questions answered, carrots earned, and topic mastery.
- **Props:** None (optional `moduleId` param).
- **State:**
  - `timeRange` (string): Active filter (`"week"`, `"month"`, `"all"`).
- **API Calls:**
  - `GET /api/quiz/user/analytics` (via `quizService.getUserAnalytics`)
- **Child Components:** `<ChartWidget />`, `<DashboardCard />`, `<AnalyticsSkeleton />`
- **Route:** `/analytics`, `/analytics/:moduleId`
- **Access Control:** Authenticated Student.

---

### 2.6 `MarathonPage` & Sub-Marathons
- **Files:**
  - `web/src/pages/MarathonPage.jsx` (Hub)
  - `web/src/pages/MarathonEnglishPage.jsx` (Reading & Vocabulary)
  - `web/src/pages/MathMarathonPage.jsx` (Procedural Mathematics)
  - `web/src/pages/MarathonSentencePracticePage.jsx` (Grammar Reconstruction)
- **Purpose:** Endless practice mode presenting continuous questions until threshold errors or time limit, featuring real-time streak multipliers.
- **Props:** None.
- **State:**
  - `streak` (number): Consecutive correct answer count.
  - `lives` (number): Remaining allowed mistakes.
  - `currentScore` (number): Cumulative session points.
- **API Calls:**
  - `GET /api/passages/marathon/questions` (reading drills)
  - `GET /api/math/generate` (procedural math equations)
  - `POST /api/quiz/submit` (answer verification)
- **Child Components:** `<MarathonStatusScreen />`, `<MarathonQuiz />`, `<MathMarathonQuiz />`, `<InputFactory />`
- **Route:** `/marathon`, `/marathon/english`, `/marathon/math`, `/marathon/english/sentences`
- **Access Control:** Authenticated Student.

---

### 2.7 `ErrorReportPage`
- **File:** `web/src/pages/ErrorReportPage.jsx`
- **Purpose:** Standalone student diagnostic screen to report question typos, rendering defects, or math inconsistencies, with automated screen capture.
- **Props:** None.
- **State:**
  - `description` (string): Student problem explanation.
  - `screenshot` (string | null): Base64 screenshot captured via `html2canvas`.
- **API Calls:**
  - `POST /api/errors/report` (persists error report and uploads screenshot to GCS)
- **Child Components:** `<ReportErrorModal />`, `<SurfaceCard />`
- **Route:** `/report-issue`
- **Access Control:** Authenticated Student.

---

## 3. Administrative Views & Pages

### 3.1 `AdminLoginPage`
- **File:** `web/src/pages/admin/AdminLoginPage.jsx`
- **Purpose:** Dedicated administrator portal login screen requiring admin username and password.
- **Props:** None.
- **State:**
  - `username` (string), `password` (string), `error` (string | null).
- **API Calls:**
  - `POST /api/admin/login`
- **Child Components:** `<FormInput />`, `<SurfaceCard />`
- **Route:** `/admin/login`
- **Access Control:** Public.

---

### 3.2 `AdminDashboardPage`
- **File:** `web/src/pages/admin/AdminDashboardPage.jsx`
- **Purpose:** System health and executive operations center showing total active users, live questions, database status, and backup controls.
- **Props:** None.
- **State:**
  - `overviewStats` (object): Total students, questions, modules, and error reports count.
- **API Calls:**
  - `GET /api/admin/analytics/overview`
  - `POST /api/backup/trigger`
- **Child Components:** `<AdminDashboardView />`, `<AdminTabs />`, `<RunScripts />`
- **Route:** `/admin`
- **Access Control:** Authenticated Admin (`ProtectedAdminRoute`).

---

### 3.3 `QuestionsViewPage` & `AllQuestionsViewPage`
- **Files:** `web/src/pages/admin/QuestionsViewPage.jsx`, `web/src/pages/admin/AllQuestionsViewPage.jsx`
- **Purpose:** Searchable and filterable question repository utilizing virtual scrolling for high-density navigation.
- **Props:** None.
- **State:**
  - `filterModule` (string), `searchQuery` (string), `difficultyFilter` (string).
- **API Calls:**
  - `GET /api/quiz/questions`
  - `DELETE /api/quiz/questions/:id` (soft-delete to trash)
- **Child Components:** `<SearchAndFilter />`, `<QuestionItemCard />`, `<QuestionActionDialogs />`
- **Route:** `/admin/questions`, `/admin/all-questions`
- **Access Control:** Authenticated Admin.

---

### 3.4 `QuestionEntryPage`
- **File:** `web/src/pages/admin/QuestionEntryPage.jsx`
- **Purpose:** Multi-step question authoring wizard supporting rich text Slate stems, Mathlive formulas, option lists, and automated AI explanation generation.
- **Props:** None.
- **State:**
  - `questionData` (object): Form state holding stem, type, options, answer, and explanation.
  - `currentStep` (number): Wizard step index (1: Stem, 2: Options/Answer, 3: Explanation/Meta).
- **API Calls:**
  - `POST /api/quiz/questions` (create question)
  - `POST /api/genai/explain` (generate AI explanation)
- **Child Components:** `<CustomStepper />`, `<Editor />`, `<MathField />`, `<AIExplanationGenerator />`, `<QuestionPreview />`
- **Route:** `/admin/addQuestions`
- **Access Control:** Authenticated Admin.

---

### 3.5 `PassagesViewPage`
- **File:** `web/src/pages/admin/PassagesViewPage.jsx`
- **Purpose:** Reading comprehension passage authoring, sentence segmentation, and vocabulary linking interface.
- **Props:** None.
- **State:**
  - `selectedPassage` (object | null): Active passage for editing.
- **API Calls:**
  - `GET /api/passages`
  - `POST /api/passages`
  - `PUT /api/passages/:id`
  - `DELETE /api/passages/:id`
- **Child Components:** `<PassagesList />`, `<PassageEditor />`, `<PassageModals />`, `<VocabularyList />`
- **Route:** `/admin/view-passages`
- **Access Control:** Authenticated Admin.

---

### 3.6 `ActiveSessionsPage`
- **File:** `web/src/pages/admin/ActiveSessionsPage.jsx`
- **Purpose:** Real-time monitoring of connected student sessions with IP, user agent, login time, and forced disconnection triggers.
- **Props:** None.
- **State:**
  - `sessions` (array): Active session objects.
- **API Calls:**
  - `GET /api/admin/sessions/active`
  - `DELETE /api/admin/sessions/:sessionId`
- **Child Components:** `<AdminItemCard />`, `<AdminTabs />`
- **Route:** `/admin/active-sessions`
- **Access Control:** Authenticated Admin.

---

### 3.7 `ErrorReportsPage`
- **File:** `web/src/pages/admin/ErrorReportsPage.jsx`
- **Purpose:** Administrative inbox displaying student-submitted bug reports, captured screenshots, and resolution status toggles.
- **Props:** None.
- **State:**
  - `reports` (array): Reported error items.
  - `statusFilter` (string): `"open"` | `"resolved"` | `"all"`.
- **API Calls:**
  - `GET /api/errors`
  - `PATCH /api/errors/:id`
- **Child Components:** `<SurfaceCard />`, `<CustomImage />`
- **Route:** `/admin/error-reports`
- **Access Control:** Authenticated Admin.

---

## 4. Key Reusable Components

### 4.1 `SlateRenderer`
- **File:** `web/src/components/SlateRenderer.jsx`
- **Purpose:** Read-only AST renderer converting Slate JSON structures into styled React DOM nodes (paragraphs, bold, italic, code, blockquotes, and math blocks).
- **Props:**
  - `value` (Array<object>): Slate JSON node tree.
- **State:** None.

---

### 4.2 `Latex`
- **File:** `web/src/components/Latex.jsx`
- **Purpose:** Typesets mathematical LaTeX strings into accessible HTML using KaTeX.
- **Props:**
  - `children` (string): Raw LaTeX string.
  - `displayMode` (boolean, default: `false`): Render inline or block equation.
- **State:** None.

---

### 4.3 `MathField`
- **File:** `web/src/components/MathField.jsx`
- **Purpose:** Interactive mathematical formula input wrapping the Mathlive virtual math keyboard.
- **Props:**
  - `value` (string): LaTeX string value.
  - `onChange` (function): Change event emitter.
- **State:** Managed by underlying `<math-field>` custom element.

---

### 4.4 `Carrot`
- **File:** `web/src/components/Carrot.jsx`
- **Purpose:** Animated carrot counter badge reflecting student reward currency with celebration pulse animations.
- **Props:**
  - `count` (number): Current carrot balance.
  - `animated` (boolean, default: `true`): Trigger spring animation on balance change.
- **State:** Internal Framer Motion spring controls.

---

### 4.5 `TokenQuestionRenderer`
- **File:** `web/src/components/TokenQuestionRenderer.jsx`
- **Purpose:** Renders an interactive sentence split into clickable tokens/words for grammatical identification tasks.
- **Props:**
  - `tokens` (Array<string>): Sentence word tokens.
  - `selectedTokenIndex` (number | null): Current student selection.
  - `onSelect` (function): Selection callback.
- **State:** None.
