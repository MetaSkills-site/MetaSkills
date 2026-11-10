/**
 * @file HeaderGreeting.jsx (Greeting)
 * @description Renders a personalized greeting for the user on the dashboard.
 * The greeting message changes based on the time of day (morning, afternoon, evening).
 *
 * @dependencies
 * - react: For useContext hook.
 * - Flex, Font: Styled components for layout and typography.
 * - SessionContext: To access the authenticated user's name.
 * - SkeletonLoader: Provides a placeholder while user data is loading.
 *
 * @exports Greeting (default)
 * @interconnections Used at the top of the User Dashboard to provide a personalized welcome.
 */

import { useContext } from "react";
import { Flex } from "../styles/Flex.style";
import { Font } from "../styles/Font.style";
import { SessionContext } from "../context/SessionProvider";
import { SkeletonText } from "./SkeletonLoader";

/**
 * Logic to determine the appropriate greeting based on the current hour.
 * 4:00 - 11:59: Morning
 * 12:00 - 16:59: Afternoon
 * 17:00 - 3:59: Evening
 */
const GREETINGS = ["morning", "afternoon", "evening"][
  ((h) => {
    return h >= 4 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : 2;
  })(new Date().getHours())
];

function Greeting() {
  const { user } = useContext(SessionContext);
  // Extract only the first name for a more personal touch
  const firstName = user.fullname?.split(" ")[0];
  return (
    <Flex>
      <Font
        $name="Dancing script, segoe ui, sans serif"
        $size="32px"
        $color="#00000080"
      >
        Good {GREETINGS},
      </Font>
      {firstName ? (
        <Font
          $name="Made, Georgia, serif, sans serif"
          $size="40px"
          $weight="200"
          $color="#00000080"
          $gradient="linear-gradient(90deg, #ff538d, #ff7b51)"
          style={{
            filter:
              "drop-shadow(14px 30px 37px #f44336) drop-shadow(60px 0px 100px #ff7200)",
          }}
        >
          {" "}
          {firstName}
        </Font>
      ) : (
        // Show skeleton loader if firstName is not yet available
        <SkeletonText
          $width="150px"
          $height="40px"
          style={{ marginLeft: "10px", borderRadius: "8px" }}
        />
      )}
    </Flex>
  );
}

export default Greeting;
