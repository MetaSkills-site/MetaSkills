/**
 * FILE PURPOSE: Logout — A navigation link component for user session termination.
 *
 * ROLE:
 * Provides a consistent UI element (label + icon) for triggering the logout process.
 * It interfaces with the SessionContext to clear user credentials and redirect to the auth flow.
 *
 * DEPENDENCIES:
 * - SessionContext: Provides the 'logout' function to clear application state.
 * - BackLink: Reuses the common styled link component for visual consistency.
 *
 * EXPORTS:
 * - Logout (default): The functional component rendering the logout link.
 *
 * INTERCONNECTIONS:
 * - Typically placed in the sidebar or user profile menu.
 */
import { useContext } from "react";
import { SessionContext } from "../context/SessionProvider";
import BackLink from "./common/BackLink";

export default function LogoutButton({ text }) {
  const { logout } = useContext(SessionContext);

  return (
    <BackLink
      onClick={logout}
      text={text || "Logout"}
      enableShortcut={false} // Shortcut disabled to prevent accidental logouts during typing
    >
      {/* Logout SVG Icon: A stylized "exit" door with an arrow */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m15.889 16.011c-.817-.099-1.57.488-1.668 1.311-.117.979-.253 1.74-.36 2.263-.483.095-1.137.204-1.86.288v-14.354c.78.119 1.458.28 1.935.413.081.416.181 1 .272 1.751.098.826.865 1.41 1.672 1.306.822-.101 1.407-.85 1.307-1.672-.233-1.893-.51-2.873-.54-2.978-.133-.455-.474-.821-.918-.986.018.009-1.903-.691-3.728-.847v-.444c0-.521-.401-.956-.921-.997-.519-.041-1.049-.065-1.579-.065-3.44 0-6.813 1-6.954 1.042-.329.099-.585.359-.677.69-.035.128-.869 3.201-.869 9.268s.824 9.619.859 9.768c.095.402.427.705.837.762.139.019 2.304.471 6.804.471 2.679 0 6.016-.664 5.976-.7.511-.131.915-.521 1.064-1.025.016-.053.386-1.312.659-3.596.099-.823-.488-1.569-1.311-1.668zm-8.889-4.011c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zm15.8 1.1c-.768 1.024-1.676 1.933-2.701 2.701-.176.132-.387.2-.6.2-.536.01-1.011-.461-1-1v-1h-3c-.828 0-1.5-.671-1.5-1.5s.672-1.5 1.5-1.5h3v-1c0-.379.214-.725.553-.895s.744-.133 1.047.094c1.024.768 1.933 1.676 2.701 2.701.266.355.266.844 0 1.199z" />
      </svg>
    </BackLink>
  );
}
