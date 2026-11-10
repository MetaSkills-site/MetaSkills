import { motion, LayoutGroup } from "framer-motion";
import { TabContainer, Tab } from "./AdminStyles";
import useStepperShortcuts from "../../hooks/event-hooks/useStepperShortcuts";
import Tooltip from "../Tooltip";
import { Kbd } from "../InfoTooltip";

/**
 * @component AdminTabs
 * @description A unified, animated tab component for the admin dashboard.
 * Provides a smooth sliding indicator and keyboard shortcuts (Alt + . / Alt + ,).
 *
 * @param {Object[]} tabs - Array of tab objects { id: string, label: string, style?: object }
 * @param {string} activeTab - The ID of the currently active tab
 * @param {function} onChange - Callback function when a tab is clicked
 * @param {string} [layoutId="activeTabIndicator"] - Unique ID for framer-motion layout animations
 * @param {Object} [containerStyle] - Optional styles for the TabContainer
 */
export default function AdminTabs({
  tabs,
  activeTab,
  onChange,
  layoutId = "activeTabIndicator",
  containerStyle = {},
  disableShortcuts = false,
  isNextDisabled = false,
}) {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  /**
   * Navigate to the next tab in sequence, wrapping around if at the end.
   */
  const handleNext = () => {
    if (tabs.length === 0) return;
    // If no tab is currently active, default to starting with the first tab (index 0)
    const current = activeIndex === -1 ? -1 : activeIndex;
    const nextIndex = (current + 1) % tabs.length;
    onChange(tabs[nextIndex].id);
  };

  /**
   * Navigate to the previous tab in sequence, wrapping around if at the start.
   */
  const handlePrev = () => {
    if (tabs.length === 0) return;
    // If no tab is currently active, default to jumping to the last tab
    const current = activeIndex === -1 ? 0 : activeIndex;
    const prevIndex = (current - 1 + tabs.length) % tabs.length;
    onChange(tabs[prevIndex].id);
  };

  // Attach global keyboard listeners for tab navigation
  useStepperShortcuts({
    onNext: handleNext,
    onPrev: handlePrev,
    isNextDisabled,
    enabled: tabs.length > 1 && !disableShortcuts,
  });

  return (
    <LayoutGroup id={layoutId}>
      <TabContainer
        style={{ position: "relative", zIndex: 1, ...containerStyle }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          // Determine tooltip content based on tab position relative to active tab
          let tooltipText = "";
          const shortcutsEnabled = tabs.length > 1 && !disableShortcuts;

          if (!isActive && shortcutsEnabled) {
            if (activeIndex === -1) {
              tooltipText = (
                <span>
                  {!isNextDisabled && (
                    <>
                      <Kbd>Alt</Kbd> + <Kbd>.</Kbd> /{" "}
                    </>
                  )}
                  <Kbd>Alt</Kbd> + <Kbd>,</Kbd>
                </span>
              );
            } else if (index > activeIndex && !isNextDisabled) {
              tooltipText = (
                <span>
                  <Kbd>Alt</Kbd> + <Kbd>.</Kbd>
                </span>
              );
            } else if (index < activeIndex) {
              tooltipText = (
                <span>
                  <Kbd>Alt</Kbd> + <Kbd>,</Kbd>
                </span>
              );
            }
          }

          return (
            <Tooltip key={tab.id} text={tooltipText} delayDuration={500}>
              <Tab
                active={isActive}
                onClick={() => onChange(tab.id)}
                style={{
                  position: "relative",
                  color: isActive ? "#fff" : "rgba(230, 42, 9, 0.71)",
                  zIndex: 2,
                  transition: "color 0.3s ease",
                  ...tab.style,
                }}
              >
                <span style={{ position: "relative", zIndex: 2 }}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="active-tab-indicator"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(45deg, #E91E63, #FF5722)",
                      borderRadius: "12px",
                      zIndex: 1,
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                )}
              </Tab>
            </Tooltip>
          );
        })}
      </TabContainer>
    </LayoutGroup>
  );
}
