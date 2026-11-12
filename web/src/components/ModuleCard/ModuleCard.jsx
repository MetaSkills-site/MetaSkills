/**
 * @file ModuleCard.jsx
 * @description Promotional call-to-action component offering direct entry points to primary English and Math learning tracks.
 * @architecture Dashboard presentation card routing users to foundational subject module categories.
 * @agent_note Renders themed SVG icons and typographic action links directing to `/modules/english` and `/modules/maths`.
 */

/**
 * FILE PURPOSE: ModuleCard — A prominent call-to-action card for primary subject categories.
 *
 * ROLE:
 * Encourages users to start their learning journey. It provides large, themed
 * links to the core 'English' (stories) and 'Maths' (sums) modules.
 *
 * DEPENDENCIES:
 * - styles/ModuleCard: Base styles for the "Begin journey" card container.
 * - styles/Font: Standardized themed typography.
 * - styles/Flex: For column-based layout of module links.
 * - react-router-dom: Link components for route navigation.
 *
 * EXPORTS:
 * - ModuleCard (default): The functional component rendering the subject entry points.
 *
 * INTERCONNECTIONS:
 * - Featured prominently on the main Dashboard.
 */
import { CurrentModule, PageLink } from "./ModuleCard.style";
import { Font } from "../../styles/Font.style.js";
import { Flex } from "../../styles/Flex.style.js";

/**
 * @component
 * @returns {JSX.Element} The rendered learning module entry card with subject links.
 */
function ModuleCard() {
  return (
    <CurrentModule>
      {/* Prompt Text: Set in themed Quicksand font */}
      <Font $name="quicksand" $color="#383838bd" $size="16px" $weight="500">
        Begin your meta journey — with a story or a sum? 🏁
      </Font>

      <div>
        <Flex $column>
          {/* ─── English / Reading Module Link ─── */}
          <PageLink to="/modules/english">
            {/* Book Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M18.5,0H5.5C2.47,0,0,2.47,0,5.5v13c0,3.03,2.47,5.5,5.5,5.5h13c3.03,0,5.5-2.47,5.5-5.5V5.5c0-3.03-2.47-5.5-5.5-5.5Zm2.5,18.5c0,1.38-1.12,2.5-2.5,2.5H5.5c-1.38,0-2.5-1.12-2.5-2.5V5.5c0-1.38,1.12-2.5,2.5-2.5h13c1.38,0,2.5,1.12,2.5,2.5v13ZM5,6.5c0-.83,.67-1.5,1.5-1.5H14.5c.83,0,1.5,.67,1.5,1.5s-.67,1.5-1.5,1.5H6.5c-.83,0-1.5-.67-1.5-1.5Zm14,5.5c0,.83-.67,1.5-1.5,1.5H6.5c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5h11c.83,0,1.5,.67,1.5,1.5Zm-9,5.5c0,.83-.67,1.5-1.5,1.5h-2c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5h2c.83,0,1.5,.67,1.5,1.5Z"></path>
            </svg>
            <Font
              $name="Made"
              $color="#9c27b0"
              $gradient="linear-gradient(135deg, #ff8b70, #ffd280)"
              $size="25px"
            >
              Read a story
            </Font>
          </PageLink>

          {/* ─── Maths / Problem Solving Module Link ─── */}
          <PageLink to="/modules/maths">
            {/* Calculator/Math Symbols Icon SVG */}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="m22.989 17.347c-.092.761-.739 1.32-1.487 1.32-.272-.003-1.274-.161-2.502-.167-1.018 0-2.307.154-2.32.156-.811.096-1.568-.486-1.669-1.309-.1-.823.486-1.57 1.309-1.669.061-.007 1.479-.177 2.681-.177s2.62.17 2.681.177c.822.1 1.408.847 1.309 1.669zm-20.273-10.162c.013-.002 1.285-.185 2.284-.185 1.256.008 2.169.194 2.501.2.733 0 1.374-.538 1.483-1.284.119-.82-.449-1.581-1.268-1.7-.061-.009-1.497-.216-2.716-.216s-2.656.207-2.716.216c-.819.119-1.387.88-1.268 1.7.12.819.875 1.387 1.7 1.269zm18.965 12.492c-.061-.007-1.479-.177-2.681-.177s-2.62.17-2.681.177c-.822.1-1.408.847-1.309 1.669.101.823.858 1.409 1.669 1.309.014-.001 1.303-.156 2.32-.156 1.231.005 2.226.163 2.502.167.748 0 1.396-.559 1.487-1.32.1-.823-.486-1.57-1.309-1.669zm-.181-6.177c.828 0 1.5-.671 1.5-1.5s-.672-1.5-1.5-1.5h-8v-8c0-.829-.671-1.5-1.5-1.5s-1.5.671-1.5 1.5v8h-8c-.829 0-1.5.671-1.5 1.5s.671 1.5 1.5 1.5h8v8c0 .829.671 1.5 1.5 1.5s1.5-.671 1.5-1.5v-8zm-13.939 2.939c-.586-.586-1.535-.586-2.121 0l-.939.939-.939-.939c-.586-.586-1.535-.586-2.121 0-.586.585-.586 1.536 0 2.121l.939.939-.939.939c-.586.585-.586 1.536 0 2.121.586.586 1.535.586 2.121 0l.939-.939.939.939c.586.586 1.535.586 2.121 0 .586-.585.586-1.536 0-2.121l-.939-.939.939-.939c.586-.585.586-1.536 0-2.121zm9.155-9.754c.006 0 .334-.048.784-.094v.91c0 .829.672 1.5 1.5 1.5s1.5-.671 1.5-1.5v-.91c.678.066.676.097 1.001.11.733 0 1.375-.538 1.483-1.284.119-.82-.448-1.581-1.269-1.7-.036-.005-.552-.079-1.216-.139v-1.077c0-.829-.672-1.5-1.5-1.5s-1.5.671-1.5 1.5v1.077c-.664.06-1.18.133-1.216.139-.82.119-1.388.88-1.269 1.7.119.819.872 1.391 1.7 1.269z"></path>
            </svg>
            <Font
              $name="Made"
              $color="#9c27b0"
              $gradient="linear-gradient(135deg, #ff8b70, #ffd280)"
              $size="25px"
            >
              Solve a sum
            </Font>
          </PageLink>
        </Flex>
      </div>
    </CurrentModule>
  );
}

export default ModuleCard;
