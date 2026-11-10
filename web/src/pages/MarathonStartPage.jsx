/**
 * @file MarathonStartPage.jsx
 * @description A specialized start page for the English MarathonPage modes.
 * It configures titles and descriptions for various subcategories like History, Grammar, Vocabulary, and Sentences.
 *
 * @dependencies
 * - react-router-dom: For navigation hooks.
 * - StartPage (common): A reusable landing page layout for quizzes.
 *
 * @exports MarathonStartPage (default)
 * @interconnections Entry point for starting an English MarathonPage session.
 */

import { useNavigate } from "react-router-dom";
import StartPage from "../components/common/StartPage";

export default function MarathonStartPage({ subCategory = "history" }) {
  const navigate = useNavigate();

  // Dynamic configuration based on the selected marathon category
  let title = "History Marathon";
  let description =
    "Immerse yourself in history and stories while practicing your reading comprehension.";

  if (subCategory === "grammar") {
    title = "Grammar Marathon";
    description =
      "Sharpen your mechanics with exercises on Tenses, Plurals, and Negatives.";
  } else if (subCategory === "vocabulary") {
    title = "Vocabulary Marathon";
    description = "Expand your lexicon with word definitions.";
  } else if (subCategory === "sentences") {
    title = "Sentence Practice Marathon";
    description =
      "Apply your vocabulary words in your own sentences and get AI-powered feedback.";
  }

  const startPath = `/marathon/english/${subCategory}/attempt`;

  // Visual theme configuration (Blue/Cyan)
  const theme = {
    gradient: "linear-gradient(90deg, #2196f3, #00bcd4)",
    primary: "#2196f3",
    secondary: "#2196f3",
    hoverBg: "#e3f2fd",
  };

  return (
    <StartPage
      title={title}
      subtitle={description}
      onStart={() => navigate(startPath)}
      onBack={() => navigate("/marathon")}
      startLabel="Start Marathon"
      theme={theme}
    />
  );
}
