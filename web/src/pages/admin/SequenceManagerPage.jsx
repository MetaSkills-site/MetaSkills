/**
 * @file SequenceManager.jsx
 * @description Administrative interface for managing the chronological order (sequencing)
 * of learning modules within specific grades and subjects. Utilizes drag-and-drop for
 * intuitive reordering.
 *
 * @dependencies
 * - framer-motion: For smooth, performant drag-and-drop reordering interactions.
 * - react-helmet-async: For managing document head metadata (page title).
 * - react-icons: For visual cues, drag handles, and status indicators.
 * - useSequenceManager: Custom hook encapsulating the sequencing logic and API calls.
 * - SequenceManager.style: Specialized styles for the reorderable list items.
 *
 * @exports
 * - SequenceManager (default): The main functional component for module sequencing.
 *
 * @interconnections
 * - Interacts with the backend via useSequenceManager to persist sequence changes.
 * - Accessible from the main Admin dashboard.
 */

import { Helmet } from "react-helmet-async";
import { Reorder } from "framer-motion";
import {
  FaSortNumericDown,
  FaGripVertical,
  FaCheckCircle,
  FaRegCircle,
} from "react-icons/fa";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import {
  ModuleListWrapper,
  ModuleItemCard,
  ModuleItemContent,
  ModuleItemTitle,
  ModuleItemMeta,
  DragHandle,
  StatusBadge,
  GradeScroller,
  GradeBadge,
} from "../../styles/SequenceManager.style";
import {
  Wrapper,
  PageContainer,
  DialogButtonGroup,
  DialogButton,
} from "../../components/admin/AdminStyles";
import AdminTabs from "../../components/admin/AdminTabs";
import AdminHeader from "../../components/admin/AdminHeader";
import { useSequenceManager } from "../../hooks/useSequenceManager";
import { SkeletonRect } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";

export default function SequenceManagerPage() {
  /**
   * Destructure sequencing state and handlers from the specialized hook.
   * Logic for fetching, reordering, and saving is encapsulated here.
   */
  const {
    selectedGrade,
    setSelectedGrade,
    selectedSubject,
    setSelectedSubject,
    sequenceModules,
    handleReorder,
    fetchingSequence,
    savingSequence,
    hasSequenceChanged,
    saveSequence,
  } = useSequenceManager();

  /**
   * Reset the selection and implicitly cancel any unsaved changes.
   */
  const handleCancel = () => {
    setSelectedGrade(null);
  };

  return (
    <Wrapper>
      <Helmet>
        <title>Manage Sequence | MetaSkills Admin</title>
      </Helmet>

      <PageContainer>
        <AdminHeader title="Module Sequencing" backPath="/admin" />

        {/* Subject selection tabs (English/Maths) */}
        <Flex
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <Font $weight="800" $size="18px" style={{ color: "#333" }}>
            Select Subject
          </Font>
          <AdminTabs
            tabs={[
              { id: "english", label: "English" },
              { id: "maths", label: "Maths" },
            ]}
            activeTab={selectedSubject}
            onChange={setSelectedSubject}
            layoutId="sequenceSubjectTabIndicator"
            containerStyle={{ margin: 0 }}
          />
        </Flex>

        {/* Horizontal scroller for selecting the target Grade/Class */}
        <div style={{ marginBottom: "20px" }}>
          <Font
            $weight="800"
            $size="18px"
            style={{ color: "#333", marginBottom: "15px" }}
          >
            Select Grade to Manage
          </Font>
          <GradeScroller>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
              <GradeBadge
                key={grade}
                $active={selectedGrade === grade}
                onClick={() => setSelectedGrade(grade)}
              >
                <span>Class</span>
                <span>{grade}</span>
              </GradeBadge>
            ))}
          </GradeScroller>
        </div>

        {/* Conditional rendering based on whether a grade is selected */}
        {selectedGrade ? (
          <div style={{ marginTop: "10px" }}>
            <Flex
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #eee",
                paddingBottom: "15px",
              }}
            >
              <Font
                $weight="800"
                $size="20px"
                style={{ color: "#ff5722", margin: 0 }}
              >
                Sequence: Class {selectedGrade}{" "}
                <span style={{ textTransform: "capitalize", color: "#333" }}>
                  ({selectedSubject})
                </span>
              </Font>
              <DialogButtonGroup style={{ marginTop: 0 }}>
                <DialogButton onClick={handleCancel}>Cancel</DialogButton>
                <DialogButton
                  $primary
                  onClick={saveSequence}
                  disabled={savingSequence || !hasSequenceChanged}
                >
                  {savingSequence ? "Saving..." : "Save Sequence"}
                </DialogButton>
              </DialogButtonGroup>
            </Flex>

            <ModuleListWrapper>
              {fetchingSequence ? (
                /* Loading skeletons during module fetch */
                <Flex style={{ flexDirection: "column", gap: "12px" }}>
                  {[1, 2, 3].map((skeleton) => (
                    <SkeletonRect
                      key={skeleton}
                      $height="76px"
                      $borderRadius="8px"
                    />
                  ))}
                </Flex>
              ) : sequenceModules.length === 0 ? (
                <div style={{ padding: "40px 0" }}>
                  <EmptyState
                    message={`No ${selectedSubject} modules found for Class ${selectedGrade}.`}
                    icon={<FaSortNumericDown size={48} />}
                  />
                </div>
              ) : (
                /* Framer Motion Reorder component for drag-and-drop functionality */
                <Reorder.Group
                  axis="y"
                  values={sequenceModules}
                  onReorder={handleReorder}
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {sequenceModules.map((item, index) => (
                    <Reorder.Item
                      key={item._id}
                      value={item}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        cursor: "grabbing",
                        zIndex: 1,
                      }}
                    >
                      <ModuleItemCard>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          {/* Drag handle specifically marked for grab actions */}
                          <DragHandle>
                            <FaGripVertical size={16} />
                          </DragHandle>
                          <ModuleItemContent>
                            <ModuleItemTitle>{item.name}</ModuleItemTitle>
                            <ModuleItemMeta>
                              <span>
                                {item.questionIds?.length || 0} Questions
                              </span>
                              <span style={{ color: "#ddd" }}>•</span>
                              <StatusBadge $complete={item.isComplete}>
                                {item.isComplete ? (
                                  <>
                                    <FaCheckCircle
                                      size={10}
                                      style={{ marginRight: "4px" }}
                                    />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <FaRegCircle
                                      size={10}
                                      style={{ marginRight: "4px" }}
                                    />
                                    Active
                                  </>
                                )}
                              </StatusBadge>
                            </ModuleItemMeta>
                          </ModuleItemContent>
                        </div>
                        {/* Visual indicator of the current position in sequence */}
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "900",
                            color: "#ccc",
                            fontFamily: "var(--font-primary)",
                          }}
                        >
                          #{index + 1}
                        </div>
                      </ModuleItemCard>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </ModuleListWrapper>
          </div>
        ) : (
          /* Initial prompt when no grade is selected */
          <Flex
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "300px",
              flexDirection: "column",
              color: "#94a3b8",
            }}
          >
            <FaSortNumericDown
              size={64}
              color="#f0f0f0"
              style={{ marginBottom: "20px" }}
            />
            <Font
              $weight="800"
              $size="20px"
              style={{ color: "#888", margin: "0 0 8px 0" }}
            >
              Select a class to manage its sequence
            </Font>
            <p style={{ margin: 0 }}>
              Choose a subject and class from the selector above to begin.
            </p>
          </Flex>
        )}
      </PageContainer>
    </Wrapper>
  );
}
