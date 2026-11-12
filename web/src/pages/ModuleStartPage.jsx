/**
 * @file ModuleStartPage.jsx
 * @description Module introduction and overview page displaying metadata, progress, and question statistics before starting an attempt.
 * @architecture Mounted at `/module/:moduleId`, retrieves user module progress via TanStack Query and renders the shared StartPage presentation component.
 * @agent_note Extracts `moduleId` from route params and requires authenticated SessionContext to query module progress and navigate to `/attempt/:moduleId`.
 */
import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SessionContext } from "../context/SessionProvider";
import toast from "react-hot-toast";
import StartPage from "../components/common/StartPage";
import ModuleStartSkeleton from "../components/skeletons/ModuleStartSkeleton.jsx";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";

/**
 * Module intro and launch screen component presenting module details, accuracy rates, and attempt controls.
 * @component
 * @returns {JSX.Element}
 */
function ModuleStartPage() {
  const { moduleId } = useParams();
  const { user } = useContext(SessionContext);
  const navigate = useNavigate();

  /**
   * DATA FETCHING LOGIC
   * Fetches the user's progress across all modules to find the specific current module.
   * This ensures that even if deep-linked, we have the latest status/accuracy.
   */
  const {
    data: modules = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["modules-progress-all", user?._id],
    enabled: !!user?._id && !!moduleId,
    queryFn: async () => {
      if (!user?._id) {
        throw new Error("User authentication is missing");
      }
      const res = await apiClient.post(API_ENDPOINTS.getModulesProgress.url, {
        userId: user._id,
      });

      const json = res.data;
      if (!json.success)
        throw new Error(
          `API error: ${json.message || json.error || "Failed to load modules"}`,
        );
      return json.data;
    },
    staleTime: 60 * 1000, // Cache valid for 1 minute
  });

  // Find the specific module in the fetched array
  const module = modules.find((m) => m._id === moduleId);

  /**
   * SIDE EFFECT: ERROR & VALIDATION HANDLING
   * If the module isn't found or the API fails, redirect the user back home
   * to prevent a broken UI state.
   */
  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "An unexpected error occurred");
      navigate("/", { replace: true });
    } else if (!isLoading && modules.length > 0 && !module) {
      toast.error("Module not found");
      // Intelligently navigate back or to home based on history depth.
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isLoading, isError, error, modules, module, navigate]);

  // Loading state: use the bespoke skeleton.
  if (isLoading) return <ModuleStartSkeleton />;

  if (!module) return null;

  // DERIVED STATE: Handle completion vs progress percentage fallback.
  const isCompleted = module.status === "completed";
  const progressPercent =
    module.progressPercent !== undefined
      ? module.progressPercent
      : isCompleted
        ? 100
        : 0;

  /* ─── Presentation Configuration ─── */

  // Theme: Subjective "Orange/Pink" palette for engagement.
  const theme = {
    gradient: "linear-gradient(90deg, #ff9800, #ff3f80)",
    primary: "#ff3f80",
    secondary: "#e74307b0",
    hoverBg: "#db5b281f",
  };

  // Stats: Formats raw module data into a list of display objects.
  const stats = [
    {
      label: "Questions",
      value: module.questionIds?.length || 0,
      color: "#ff3f80",
    },
    { label: "Progress", value: `${progressPercent}%`, color: "#ff9800" },
    {
      label: "Accuracy",
      value: module.accuracy !== undefined ? `${module.accuracy}%` : "0%",
      color: "#2196f3",
    },
  ];

  return (
    <StartPage
      title={module.name}
      stats={stats}
      progress={progressPercent}
      onStart={() => navigate(`/attempt/${moduleId}`)}
      onBack={() => {
        const backPath = module?.subject ? `/modules/${module.subject}` : "/";
        navigate(backPath);
      }}
      startLabel="Dive in"
      theme={theme}
    />
  );
}

export default ModuleStartPage;
