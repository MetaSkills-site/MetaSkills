/**
 * @file GradeSelector.jsx
 * @description A multi-select component for choosing school grades (1-12).
 * Visualized as a grid of interactive circles.
 * @dependencies styled-components, ../../styles/Flex.style, ../admin/AdminStyles
 * @exports GradeSelector
 * @interconnections Used in administrative forms to filter or assign content to specific grade levels.
 */

import { Flex } from "../../styles/Flex.style";
import { FormField, FormLabel } from "../admin/AdminStyles";
import styled from "styled-components";

// Container for the grade circles with wrapping support
const GradesContainer = styled(Flex)`
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

// Styled button representing an individual grade level
const GradeCircle = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  border: 2px solid #ff5722;
  transition: all 0.2s;
  user-select: none;
  /* logic: Toggle colors based on whether the grade is selected */
  background: ${(props) => (props.$isSelected ? "#ff5722" : "white")};
  color: ${(props) => (props.$isSelected ? "white" : "#ff5722")};
  padding: 0;

  &:hover {
    transform: scale(1.1);
  }
`;

/**
 * Main GradeSelector component.
 * @param {Array<number>} grades - Array of currently selected grade numbers.
 * @param {function} setGrades - State setter to update the selected grades.
 */
export default function GradeSelector({ grades = [], setGrades }) {
  // logic: Toggles the presence of a grade in the selection array
  const toggleGrade = (grade) => {
    const newGrades = grades.includes(grade)
      ? grades.filter((g) => g !== grade) // Remove if already present
      : [...grades, grade]; // Add if not present
    setGrades(newGrades);
  };

  return (
    <FormField>
      <FormLabel>Grades</FormLabel>
      <GradesContainer>
        {/* Render grade circles for levels 1 through 12 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
          <GradeCircle
            key={grade}
            type="button"
            aria-label={`Select Grade ${grade}`}
            aria-pressed={grades.includes(grade)}
            onClick={() => toggleGrade(grade)}
            $isSelected={grades.includes(grade)}
          >
            {grade}
          </GradeCircle>
        ))}
      </GradesContainer>
    </FormField>
  );
}
