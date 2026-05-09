# Implementation Plan: Tracks

## Phase 1: Database Layer & Models
1.  **Create `Track.model.js`**
    *   **File:** `metaskills-backend/models/Track.model.js`
    *   **Action:** Define Mongoose schema with `title`, `subject`, and `modulelist` (Array of ObjectId references to `Module`). Add compound index on `{ title: 1, subject: 1 }`.
2.  **Add Cascade Delete to Module Model**
    *   **File:** `metaskills-backend/models/Module.model.js`
    *   **Action:** Attach a middleware hook (e.g., `post('findOneAndDelete')` and `post('deleteOne')`) that performs `Track.updateMany({ modulelist: deletedModuleId }, { $pull: { modulelist: deletedModuleId } })`.

## Phase 2: Admin Controllers & Routes
1.  **Create `track.admin.controller.js`**
    *   **File:** `metaskills-backend/controllers/track.admin.controller.js`
    *   **Action:** Implement CRUD functions (`createTrack`, `getTracks`, `getTrackById`, `updateTrack`, `deleteTrack`).
    *   **Action:** Implement `updateTrackModules` (push/pull modules) and `reorderTrackModules` (replace `modulelist` array entirely).
2.  **Register Admin Routes**
    *   **File:** `metaskills-backend/routes/admin.routes.js` (or a dedicated route file linked to `server.js`).
    *   **Action:** Add the newly created admin controller functions to the respective `POST`, `GET`, `PUT`, `DELETE` routes, ensuring `protectAdmin` middleware is applied.

## Phase 3: Student Controllers & Dynamic Progression
1.  **Create `track.student.controller.js`**
    *   **File:** `metaskills-backend/controllers/track.student.controller.js`
    *   **Action:** Implement `getStudentTracks` function.
        *   Fetch tracks, populate `modulelist` (select `_id grades`).
        *   Map and filter `modulelist` elements where `grade` matches `req.user.grade`.
        *   Filter out any tracks where `filteredModuleList.length === 0`.
        *   Calculate completion percentage based on `Responses` matching the track's allowed modules.
    *   **Action:** Implement `getStudentTrackDetails` function.
        *   Fetch track by ID, deeply populate `modulelist` (including `questionIds`).
        *   Filter `modulelist` against `req.user.grade`.
        *   Fetch user `Responses`.
        *   Apply sequential locking logic (mimicking `getModulesWithProgress` from `quiz.controller.js`): find the first incomplete module, mark as `unlocked` (`in_progress` or `not_started`), mark preceding as `completed`, mark subsequent as `locked`.
2.  **Register Student Routes**
    *   **File:** `metaskills-backend/routes/quiz.routes.js` (or a dedicated route file).
    *   **Action:** Add `/api/tracks` and `/api/tracks/:id` endpoints utilizing the `protect` middleware to ensure user context is available.

## Phase 4: Validation & Testing (Developer Checks)
1.  **Unit / Manual Tests:**
    *   Create a Track, append 3 modules.
    *   Verify a Grade 10 student only sees the track if at least 1 module has `grades: [10]`.
    *   Verify the Track hides immediately if the student's grade is changed to Grade 11 and no modules allow Grade 11.
    *   Verify that deleting a module from the DB automatically pulls it out of the Track's `modulelist`.
    *   Verify sequential locking: completing the first allowed module correctly unlocks the next allowed module in the Track.