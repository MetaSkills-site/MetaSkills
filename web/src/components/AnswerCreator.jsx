/**
 * @file AnswerCreator.jsx
 * @description Admin component for defining the correct answer and answer format for a quiz question.
 * It supports Short Answer, Multiple Choice (MCQ), and Fill-in-the-blanks formats.
 *
 * @dependencies
 * - styled-components: For layout and grid systems.
 * - react: For state management and side effects.
 * - TextBox (Editor): Rich text editor for MCQ options.
 * - slateUtils: Utility for extracting blank identifiers from Slate JSON.
 * - Latex: Math input for Short Answer.
 * - AdminStyles: Styled components for tabs, labels, and forms.
 *
 * @exports AnswerCreator (default)
 * @interconnections Part of the question creation suite. Reads `questionSlate` to automatically handle blanks.
 */

import styled from "styled-components";
import { useEffect, useState } from "react";
import TextBox from "./Editor/Editor";
import { extractBlanks } from "../utils/slateUtils";
import classNames from "classnames";
import Latex from "./Latex";
import AdminTabs from "./admin/AdminTabs";
import { FormField, FormLabel, StyledBlankInput } from "./admin/AdminStyles";

// Constants for layout
const GRID_GAP = "20px";
const MCQ_OPTION_MIN_HEIGHT = "120px";

const MainContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 0px 40px 0px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const McqGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr;
  gap: ${GRID_GAP};
`;

const McqOptionContainer = styled.div`
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: ${MCQ_OPTION_MIN_HEIGHT};
  padding: 16px;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;

  &:hover {
    border-color: #ff5722;
    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.1);
  }

  &.disabled-selection {
    cursor: not-allowed;
    &:hover {
      border-color: #e0e0e0;
      box-shadow: none;
    }
  }

  &.selected {
    border: 2px solid #4caf50;
    background: #e6fbe8ff;
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.15);
  }
`;

const OptionLabel = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  color: #757575;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  ${McqOptionContainer}.selected & {
    background: #4caf50;
    color: white;
  }
`;

const OptionContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  /* Override Editor styles to fit nicely */
  .slate-editor {
    min-height: unset;
    padding: 0;
    border: none;
  }
`;

const SaInputContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const BlanksContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BlankItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
`;

const BlankIndex = styled.span`
  font-weight: 700;
  color: #ff5722;
  font-size: 18px;
  min-width: 40px;
`;

const InfoBox = styled.div`
  background: #e3f2fd;
  color: #1565c0;
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
  border: 1px solid #bbdefb;
`;

export default function AnswerCreator({
  options,
  setOptions,
  questionSlate,
  compact = false,
  disableShortcuts = false,
}) {
  const [answerType, setAnswerType] = useState(options.type || "SA");
  const [saValue, setSaValue] = useState(options.sa || "");
  const [blankAnswers, setBlankAnswers] = useState([]);

  // Sync internal state with the options prop when they change externally
  useEffect(() => {
    setAnswerType((prev) => {
      if (options.type && options.type !== prev) return options.type;
      return prev;
    });
    setSaValue((prev) => {
      if (options.sa !== undefined && options.sa !== prev) return options.sa;
      return prev;
    });
  }, [options.type, options.sa]);

  /**
   * Effect to handle "Fill in the Blanks" mode.
   * It scans the question text for blank patterns like [...] and extracts the content.
   * If blanks are found, it forces the answer type to "fillInTheBlanks".
   */
  useEffect(() => {
    const extractedAnswers = extractBlanks(questionSlate);
    const areBlanksEqual = (a, b) =>
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);

    if (!areBlanksEqual(extractedAnswers, blankAnswers)) {
      setBlankAnswers(extractedAnswers);
    }

    if (extractedAnswers.length > 0) {
      // Automatic switch to blanks mode if blanks are detected in text
      if (
        options.type !== "fillInTheBlanks" ||
        !areBlanksEqual(options.fillInTheBlanks, extractedAnswers)
      ) {
        setOptions((prev) => ({
          ...prev,
          fillInTheBlanks: extractedAnswers,
          type: "fillInTheBlanks",
        }));
      }
    }
  }, [
    questionSlate,
    blankAnswers,
    options.type,
    options.fillInTheBlanks,
    setOptions,
  ]);

  /**
   * Updates the global answer type.
   */
  const handleSetType = (value) => {
    if (!value) return;
    setAnswerType(value);
    setOptions((prev) => ({
      ...prev,
      type: value,
    }));
  };

  /**
   * Sets the correct option index for MCQ.
   */
  const handleCorrect = (value) => {
    if (options.mcq?.correctAnswerInExtras) return;
    const allowed = ["A", "B", "C", "D"];
    const index = allowed.indexOf(value);

    setOptions((prev) => ({
      ...prev,
      mcq: {
        ...prev.mcq,
        correct: index !== -1 ? index : prev.mcq?.correct,
      },
    }));
  };

  /**
   * Updates the text content of a specific MCQ option.
   */
  const handleSetMCQ = (key) => (value) => {
    setOptions((prev) => ({
      ...prev,
      mcq: {
        ...prev.mcq,
        [key]: {
          slate: value,
        },
      },
    }));
  };

  /**
   * Updates the correct answer for Short Answer.
   */
  const handleSaChange = (value) => {
    setSaValue(value);
    setOptions((prev) => ({ ...prev, sa: value }));
  };

  // If blanks are detected in the question editor, MCQ and SA modes are disabled to prevent data mismatch
  const isBlanksModeForced = blankAnswers.length > 0;

  return (
    <MainContainer>
      {/* Navigation Tabs for selecting answer format - Integrated AdminTabs */}
      <AdminTabs
        tabs={[
          {
            id: "SA",
            label: "Short Answer",
            style: {
              opacity: isBlanksModeForced ? 0.5 : 1,
              cursor: isBlanksModeForced ? "not-allowed" : "pointer",
            },
          },
          {
            id: "MCQ",
            label: "MCQ",
            style: {
              opacity: isBlanksModeForced ? 0.5 : 1,
              cursor: isBlanksModeForced ? "not-allowed" : "pointer",
            },
          },
          { id: "fillInTheBlanks", label: "Fill in the Blanks" },
        ]}
        activeTab={answerType}
        onChange={(id) => {
          if (id === "fillInTheBlanks") {
            handleSetType(id);
          } else if (!isBlanksModeForced) {
            handleSetType(id);
          }
        }}
        layoutId="answerFormatTabIndicator"
        containerStyle={{ margin: "0 auto", width: "fit-content" }}
        disableShortcuts={disableShortcuts}
      />

      {/* Content Area for Short Answer (SA) */}
      {answerType === "SA" && (
        <SaInputContainer>
          <FormField>
            <FormLabel>Correct Answer</FormLabel>
            <Latex
              value={saValue}
              onChange={(val) => handleSaChange(val)}
              className="ansInput"
              readOnly={false}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "18px",
                border: "2px solid #e0e0e0",
                borderRadius: "12px",
                outline: "none",
                minHeight: "50px",
                background: "#fff",
              }}
              placeholder="Enter the correct answer..."
            />
          </FormField>
        </SaInputContainer>
      )}

      {/* Content Area for Fill in the Blanks */}
      {answerType === "fillInTheBlanks" && (
        <BlanksContainer>
          {blankAnswers.length === 0 ? (
            <div
              style={{ textAlign: "center", color: "#666", padding: "40px" }}
            >
              No blanks found. Insert blanks <b>[...]</b> in the Question
              Editor.
            </div>
          ) : (
            <>
              <InfoBox>
                Correct answers are automatically extracted from your question
                text.
              </InfoBox>
              {blankAnswers.map((ans, index) => (
                <BlankItem key={index}>
                  <BlankIndex>#{index + 1}</BlankIndex>
                  <StyledBlankInput
                    value={ans}
                    readOnly
                    disabled
                    style={{
                      flex: 1,
                      textAlign: "left",
                      background: "#f5f5f5",
                      color: "#333",
                      cursor: "default",
                    }}
                  />
                </BlankItem>
              ))}
            </>
          )}
        </BlanksContainer>
      )}

      {/* Content Area for Multiple Choice (MCQ) */}
      {answerType === "MCQ" && (
        <McqGrid>
          {["A", "B", "C", "D"].map((option, index) => {
            const isSelected = options.mcq?.correct === index;
            return (
              <McqOptionContainer
                key={option}
                className={classNames({
                  selected: isSelected,
                  "disabled-selection": options.mcq?.correctAnswerInExtras,
                })}
                onClick={() => handleCorrect(option)}
              >
                <OptionLabel>{option}</OptionLabel>
                <OptionContent onClick={(e) => e.stopPropagation()}>
                  <TextBox
                    value={
                      options.mcq?.[option] || {
                        slate: [
                          { type: "paragraph", children: [{ text: "" }] },
                        ],
                      }
                    }
                    onChange={handleSetMCQ(option)}
                    compact={compact}
                    placeholder={`Option ${option}`}
                  />
                </OptionContent>
              </McqOptionContainer>
            );
          })}
        </McqGrid>
      )}
    </MainContainer>
  );
}
