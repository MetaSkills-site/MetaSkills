/**
 * @file main.jsx
 * @description Application entry point that bootstraps the React DOM tree, sets up query caching, configures browser routing, and handles PWA service worker registration.
 * @architecture Serves as the client-side root combining React Query, React Router, Google OAuth, Helmet SEO, and Session providers around the App component.
 * @agent_note When modifying route trees or global contexts, preserve route protection wrappers (ProtectedRoute, ProtectedAdminRoute) and skeleton suspense fallbacks.
 */

/**
 * PURPOSE: Application bootstrap, router configuration, and root-level service providers.
 *
 * DEPENDENCIES:
 * - react-router-dom: Core routing engine and path definitions.
 * - @tanstack/react-query: Data fetching, caching, and state management.
 * - @react-oauth/google: Google authentication integration.
 * - @vercel/analytics: User engagement tracking.
 * - react-helmet-async: SEO and document head management.
 * - ModuleContext: Provides unit/module state (INTERCONNECT: Wraps admin routes).
 * - SessionProvider: Manages user session and authentication state.
 * - GlobalStyles: Injects base CSS-in-JS design tokens.
 *
 * EXPORTS:
 * - None (Main application entry point).
 *
 * INTERCONNECTIONS:
 * - Orchestrates the entire application by wrapping the root in various context providers.
 * - Manages the routing hierarchy, including public, protected, and administrative sections.
 */

import "../src/styles/App.css";
import "katex/dist/katex.min.css";
import { lazy, Suspense } from "react";

import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";

// Lazy Loaded Components for code splitting and optimized initial load.
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout.jsx"));
const AnalyticsStudent = lazy(() => import("./pages/AnalyticsPage.jsx"));
const ModuleHistoryPage = lazy(() => import("./pages/ModuleHistoryPage.jsx"));
const QuizPanelLayout = lazy(() => import("./layouts/QuizPanelLayout.jsx"));
const ModuleList = lazy(() => import("./components/ModuleList.jsx"));
const ModuleStartPage = lazy(() => import("./pages/ModuleStartPage.jsx"));
const UserHistoryPage = lazy(() => import("./pages/admin/UserHistoryPage.jsx"));
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const MarathonPage = lazy(() => import("./pages/MarathonPage.jsx"));
const MarathonEnglishPage = lazy(
  () => import("./pages/MarathonEnglishPage.jsx"),
);
const MarathonStartPage = lazy(() => import("./pages/MarathonStartPage.jsx"));
const MarathonSentencePracticePage = lazy(
  () => import("./pages/MarathonSentencePracticePage.jsx"),
);
const MarathonQuiz = lazy(() => import("./components/MarathonQuiz.jsx"));
const MathMarathonPage = lazy(() => import("./pages/MathMarathonPage.jsx"));
const MathMarathonQuiz = lazy(
  () => import("./components/MathMarathonQuiz.jsx"),
);

// Lazy Admin Components: These are dynamically loaded only when needed for administrative tasks.
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminAddQuestions = lazy(() => import("./pages/admin/QuestionEntryPage"));
const ModulesViewPage = lazy(() => import("./pages/admin/ModulesViewPage"));
const QuestionsViewPage = lazy(() => import("./pages/admin/QuestionsViewPage"));
const UsersViewPage = lazy(() => import("./pages/admin/UsersViewPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const TrashQuestionsPage = lazy(
  () => import("./pages/admin/TrashQuestionsPage"),
);
const NotificationsManagementPage = lazy(
  () => import("./pages/admin/NotificationsManagementPage"),
);
const ModulesQuestionsViewPage = lazy(
  () => import("./pages/admin/ModulesQuestionsViewPage"),
);
const AllQuestionsViewPage = lazy(
  () => import("./pages/admin/AllQuestionsViewPage"),
);
const AdminActiveSessions = lazy(
  () => import("./pages/admin/ActiveSessionsPage"),
);
const ContextAttachmentsViewPage = lazy(
  () => import("./pages/admin/ContextAttachmentsViewPage"),
);
const MarathonManagementPage = lazy(
  () => import("./pages/admin/MarathonManagementPage"),
);
const PassagesViewPage = lazy(() => import("./pages/admin/PassagesViewPage"));
const ErrorReportsPage = lazy(() => import("./pages/admin/ErrorReportsPage"));
const SequenceManagerPage = lazy(
  () => import("./pages/admin/SequenceManagerPage"),
);
const BulkImportPage = lazy(() => import("./pages/admin/BulkImportPage"));
const ErrorReportPage = lazy(() => import("./pages/ErrorReportPage.jsx"));

// Page Skeletons — statically imported for immediate feedback during navigation.
// These replace the full-screen <SplashPage /> during within-app navigations.
import DashboardSkeleton from "./components/skeletons/DashboardSkeleton.jsx";
import AnalyticsSkeleton from "./components/skeletons/AnalyticsSkeleton.jsx";
import ModuleListSkeleton from "./components/skeletons/ModuleListSkeleton.jsx";
import ModuleStartSkeleton from "./components/skeletons/ModuleStartSkeleton.jsx";
import GenericPageSkeleton from "./components/skeletons/GenericPageSkeleton.jsx";

// Core contexts and layout wrappers required for application logic and state.
import { ModuleProvider } from "./context/ModuleContext";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import GradeSelectionPage from "./pages/GradeSelectionPage.jsx";
import { GlobalStyle } from "./styles/GlobalStyles.jsx";
import SessionProvider from "./context/SessionProvider.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import SplashPage from "./pages/SplashPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import OfflinePage from "./pages/OfflinePage.jsx";
import UpdateBlocker from "./components/UpdateBlocker.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Single shared QueryClient instance created outside the render tree for global state management.
 * staleTime: 60s - Admin data remains fresh for a minute.
 * refetchOnWindowFocus: false - Prevents unnecessary network requests when shifting focus.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Router definition: Defines the path structure, layout wrappers, and protected access levels.
 * The hierarchy ensures that only authenticated users can access core features.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <SessionProvider>
          <UpdateBlocker />
          <App />
        </SessionProvider>
      </GoogleOAuthProvider>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SplashPage />}>
            <HomePage />
          </Suspense>
        ),
      },
      // Protected user routes requiring a session to access.
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "report-issue",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <ErrorReportPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<AnalyticsSkeleton />}>
              <AnalyticsStudent />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics/:moduleId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<AnalyticsSkeleton />}>
              <ModuleHistoryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Marathon paths: Gamified/Timed quiz sessions.
      {
        path: "marathon",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/grammar",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonStartPage subCategory="grammar" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/history",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonStartPage subCategory="history" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/grammar/attempt",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonQuiz subCategory="grammar" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/history/attempt",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonQuiz subCategory="history" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/vocabulary",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonStartPage subCategory="vocabulary" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/sentences",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonStartPage subCategory="sentences" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/sentences/attempt",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonSentencePracticePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/vocabulary/attempt",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonQuiz subCategory="vocabulary" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonEnglishPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/english/attempt",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MarathonQuiz subCategory="history" />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/math",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MathMarathonPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "marathon/math/attempt/:questionId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<GenericPageSkeleton />}>
              <MathMarathonQuiz />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Module and quiz routes for structured learning paths.
      {
        path: "modules/:subject",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<ModuleListSkeleton />}>
              <ModuleList />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "module/:moduleId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<ModuleStartSkeleton />}>
              <ModuleStartPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "attempt/:moduleId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SplashPage />}>
              <QuizPanelLayout />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Admin-only paths requiring privileged access.
      {
        path: "admin/login",
        element: <AuthLayout subHeader="Admin Portal" />,
        children: [
          {
            index: true,
            element: <AdminLoginPage />,
          },
        ],
      },
      {
        path: "admin",
        element: (
          <ProtectedAdminRoute>
            <ModuleProvider>
              <Outlet />
            </ModuleProvider>
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: "addQuestions",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <AdminAddQuestions />
              </Suspense>
            ),
          },
          {
            path: "modules",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <ModulesViewPage />
              </Suspense>
            ),
          },
          {
            path: "bulk-import",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <BulkImportPage />
              </Suspense>
            ),
          },
          {
            path: "questions",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <QuestionsViewPage />
              </Suspense>
            ),
          },
          {
            path: "viewUsers",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <UsersViewPage />
              </Suspense>
            ),
          },
          {
            path: "analytics",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <AnalyticsPage />
              </Suspense>
            ),
          },
          {
            path: "trash",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <TrashQuestionsPage />
              </Suspense>
            ),
          },
          {
            path: "notifications",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <NotificationsManagementPage />
              </Suspense>
            ),
          },
          {
            path: "view-content",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <ModulesQuestionsViewPage />
              </Suspense>
            ),
          },
          {
            path: "all-questions",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <AllQuestionsViewPage />
              </Suspense>
            ),
          },
          {
            path: "users/:userId/history",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <UserHistoryPage />
              </Suspense>
            ),
          },
          {
            path: "active-sessions",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <AdminActiveSessions />
              </Suspense>
            ),
          },
          {
            path: "context-attachments",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <ContextAttachmentsViewPage />
              </Suspense>
            ),
          },
          {
            path: "manage-marathon",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <MarathonManagementPage />
              </Suspense>
            ),
          },
          {
            path: "view-passages",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <PassagesViewPage />
              </Suspense>
            ),
          },
          {
            path: "error-reports",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <ErrorReportsPage />
              </Suspense>
            ),
          },
          {
            path: "sequence-manager",
            element: (
              <Suspense fallback={<GenericPageSkeleton />}>
                <SequenceManagerPage />
              </Suspense>
            ),
          },
        ],
      },
      // Public authentication and profile completion routes.
      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <AuthPage />,
          },
          {
            path: "complete-profile",
            element: <GradeSelectionPage />,
          },
        ],
      },
      {
        path: "/offline",
        element: <OfflinePage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

/**
 * Root injection point for the React application.
 * Providers are layered based on their scope (data fetching -> document head -> global styling -> routing).
 */
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <GlobalStyle />
      <RouterProvider router={router} />
      <Analytics />
    </HelmetProvider>
    {/* DevTools only included in development builds — tree-shaken in production */}
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>,
);

/**
 * Service Worker Registration logic for PWA capabilities.
 * Manages caching, offline reliability, and automated update checks.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope,
        );

        // Check for updates periodically (every 60 seconds) to ensure fresh content.
        setInterval(() => {
          registration.update();
        }, 60000);

        // Event listener for identifying when a background update is available.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "New service worker available. Triggering update blocker.",
              );
              window.dispatchEvent(new CustomEvent("sw-update-found"));
            }
          });
        });
      })
      .catch(async (error) => {
        console.error("ServiceWorker registration failed: ", error);

        // Critical fallback: If ServiceWorker fails, clear caches to avoid corrupted state.
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => {
              console.log(`Clearing cache due to SW error: ${cacheName}`);
              return caches.delete(cacheName);
            }),
          );
          console.log("All caches cleared after service worker error");
        } catch (cacheError) {
          console.error("Failed to clear caches:", cacheError);
        }
      });
  });

  // Global listener for runtime Service Worker errors, ensuring cache integrity.
  navigator.serviceWorker.addEventListener("error", async (error) => {
    console.error("Service Worker error:", error);
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log("Caches cleared due to service worker error");
    } catch (err) {
      console.error("Failed to clear caches:", err);
    }
  });
}
