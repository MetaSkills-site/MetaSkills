/**
 * @file useSequenceManager.js
 * @description Manages the ordered sequence of educational modules for specific grades and subjects.
 *
 * DEPENDENCIES:
 * - react: useState, useEffect
 * - axios: For API communication
 * - react-hot-toast: For user feedback
 *
 * EXPORTS:
 * - useSequenceManager: Custom hook to handle module sequencing state and operations.
 *
 * INTERCONNECTIONS:
 * - Used in admin tools for reordering modules and ensuring a custom display order.
 * - Communicates with /api/quiz/sequence for fetching and saving module order.
 */

import { useState, useEffect } from "react";
import adminApiClient from "../services/adminApi";
import { API_ENDPOINTS } from "../api/requestMap";
import toast from "react-hot-toast";

/**
 * useSequenceManager Hook
 *
 * Provides state and functions to fetch, reorder, and save the sequence of modules.
 */
export const useSequenceManager = () => {
  // Current filtering state
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("english");

  // Module sequencing state
  const [sequenceModules, setSequenceModules] = useState([]);
  const [fetchingSequence, setFetchingSequence] = useState(false);
  const [savingSequence, setSavingSequence] = useState(false);
  const [hasSequenceChanged, setHasSequenceChanged] = useState(false);

  /**
   * fetchSequence
   * Retrieves the custom sequence and all available modules for synchronization.
   *
   * @param {string|number} grade - The targeted educational grade.
   * @param {string} subject      - The targeted subject.
   */
  const fetchSequence = async (grade, subject) => {
    setFetchingSequence(true);
    setSequenceModules([]); // Clear existing modules during fetch
    try {
      // 1. Fetch the explicitly ordered sequence from the database
      const seqResponse = await adminApiClient.get(
        API_ENDPOINTS.getSequence.url({ subject, grade }),
      );

      // 2. Fetch ALL relevant modules for this grade/subject to find any that are unsequenced
      const modsResponse = await adminApiClient.post(
        API_ENDPOINTS.getModulesList.url,
        { grades: [grade], subject, limit: 100 },
      );

      const allMods = modsResponse.data.data || [];
      const sequenceDoc = seqResponse.data.data;

      // Normalize ordered IDs (handling potential object vs string IDs)
      const orderedModIds =
        sequenceDoc && sequenceDoc.modules
          ? sequenceDoc.modules.map((m) => (typeof m === "object" ? m._id : m))
          : [];

      // 3. Construct the module list according to the fetched order
      const orderedModules = [];
      const usedIds = new Set();

      orderedModIds.forEach((id) => {
        const mod = allMods.find((m) => m._id === id);
        if (mod) {
          orderedModules.push(mod);
          usedIds.add(id);
        }
      });

      // 4. Append modules that exist but are not yet explicitly part of the sequence document
      allMods.forEach((mod) => {
        if (!usedIds.has(mod._id)) {
          orderedModules.push(mod);
        }
      });

      setSequenceModules(orderedModules);
      setHasSequenceChanged(false); // Reset change tracking after successful fetch
    } catch (error) {
      console.error("Fetch sequence error:", error);
      toast.error("Failed to fetch module sequence");
    } finally {
      setFetchingSequence(false);
    }
  };

  /**
   * saveSequence
   * Persists the current module order to the backend.
   */
  const saveSequence = async () => {
    if (!selectedGrade) return;
    setSavingSequence(true);
    try {
      // Map full module objects to just their IDs for the payload
      const modIds = sequenceModules.map((m) => m._id);

      await adminApiClient.put(
        API_ENDPOINTS.saveSequence.url({
          subject: selectedSubject,
          grade: selectedGrade,
        }),
        { modules: modIds },
      );

      toast.success("Sequence saved successfully");
      setHasSequenceChanged(false); // Reset change tracking after successful save
    } catch (error) {
      console.error("Save sequence error:", error);
      toast.error("Failed to save sequence");
    } finally {
      setSavingSequence(false);
    }
  };

  /**
   * Automatically trigger a re-fetch of the sequence whenever
   * the selected grade or subject is updated by the user.
   */
  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      fetchSequence(selectedGrade, selectedSubject);
    }
  }, [selectedGrade, selectedSubject]);

  /**
   * handleReorder
   * Updates local state and tracks that the sequence has changed.
   *
   * @param {Array} newOrder - The new ordered list of modules.
   */
  const handleReorder = (newOrder) => {
    setSequenceModules(newOrder);
    setHasSequenceChanged(true);
  };

  return {
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
  };
};
