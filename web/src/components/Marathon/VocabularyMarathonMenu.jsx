/**
 * @file VocabularyMarathonMenu.jsx
 * @description A modal overlay component that allows users to choose between two different
 * vocabulary practice modes: learning new words or applying them in sentences.
 *
 * @dependencies
 * - styled-components: For modal and overlay styling.
 * - framer-motion: For smooth modal entry/exit animations.
 * - react-icons: Icons for UI elements (FaBook, FaPenFancy, IoCloseOutline, FaQuestionCircle).
 * - react-router-dom (useNavigate): For navigating to the selected practice mode.
 * - DashboardCard: Reusable card component for the options.
 * - Tooltip: To provide detailed information about the practice modes.
 *
 * @exports VocabularyMarathonMenu - The functional modal component.
 *
 * @interconnections
 * - Triggered from the Marathon dashboard to redirect users into sub-modules.
 */

import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaBook, FaPenFancy } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../DashboardCard";
import Tooltip from "../Tooltip";
import { FaQuestionCircle } from "react-icons/fa";

// --- Styled Components ---

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e0e0e0;
    color: #333;
    transform: rotate(90deg);
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;

  h2 {
    font-size: 28px;
    color: #333;
    margin: 0 0 10px 0;
  }

  p {
    font-size: 16px;
    color: #666;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export default function VocabularyMarathonMenu({ isOpen, onClose }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {/* Ensure the modal only renders when isOpen is true for exit animations */}
      {isOpen && (
        <Overlay
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContainer
            // Prevents clicks inside the modal from closing it via the overlay's onClick
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <CloseButton onClick={onClose}>
              <IoCloseOutline />
            </CloseButton>

            <Header>
              <h2>Vocabulary Marathon</h2>
              <p>
                Choose your practice mode
                {/* Tooltip explaining the different modes in detail */}
                <Tooltip
                  text={
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            color: "#333",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Learn New Words
                        </strong>
                        <span style={{ fontSize: "12px", lineHeight: "1.4" }}>
                          Build your foundation. Review definitions and master
                          words to unlock them for sentence practice.
                        </span>
                      </div>
                      <div>
                        <strong
                          style={{
                            color: "#333",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Apply in Sentences
                        </strong>
                        <span style={{ fontSize: "12px", lineHeight: "1.4" }}>
                          Put your skills to the test. Write custom sentences
                          using your mastered words and get instant, intelligent
                          feedback.
                        </span>
                      </div>
                    </div>
                  }
                >
                  <button
                    style={{
                      display: "inline-flex",
                      color: "#aaa",
                      cursor: "help",
                      background: "none",
                      border: "none",
                      padding: "0",
                      marginLeft: "4px",
                      verticalAlign: "middle",
                    }}
                    aria-label="Vocabulary Marathon Info"
                  >
                    <FaQuestionCircle size={15} />
                  </button>
                </Tooltip>
              </p>
            </Header>

            <OptionsGrid>
              {/* Option 1: Learning Mode */}
              <DashboardCard
                variant="vertical"
                icon={<FaBook style={{ color: "#9c27b0" }} />}
                title="Learn New Words"
                description="Expand your lexicon with synonym challenges and word games."
                onClick={() => {
                  onClose();
                  navigate("/marathon/english/vocabulary");
                }}
                style={{ width: "100%", height: "250px" }}
              />
              {/* Option 2: Sentence Practice Mode */}
              <DashboardCard
                variant="vertical"
                icon={<FaPenFancy style={{ color: "#2196f3" }} />}
                title="Apply in Sentences"
                description="Practice using vocabulary words in your own sentences."
                onClick={() => {
                  onClose();
                  navigate("/marathon/english/sentences");
                }}
                style={{ width: "100%", height: "250px" }}
              />
            </OptionsGrid>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
