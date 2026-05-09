# Technical Requirements: Tracks Feature

## 1. Database & Schema
*   **Track Model (`models/Track.model.js`)**
    *   `title` (String, required, unique per subject)
    *   `subject` (String, enum: `["english", "maths"]`, required)
    *   `modulelist` (Array of `mongoose.Schema.Types.ObjectId`, ref: `"Module"`)
    *   Timestamps enabled.
*   **Module Deletion Hook (`models/Module.model.js`)**
    *   Requires a `pre('findOneAndDelete')` or `pre('deleteOne')` hook to cascade delete its reference from any `Track.modulelist`.

## 2. Admin API Endpoints (`routes/admin.routes.js` or `routes/track.admin.routes.js`)
*   **POST `/api/admin/tracks`**: Create a new Track.
*   **GET `/api/admin/tracks`**: List all Tracks (with pagination, filtering by subject).
*   **GET `/api/admin/tracks/:id`**: Get single Track details, populating `modulelist`.
*   **PUT `/api/admin/tracks/:id`**: Update Track metadata (title, subject).
*   **DELETE `/api/admin/tracks/:id`**: Delete a Track.
*   **PUT `/api/admin/tracks/:id/modules`**: Add or remove a module ID to/from the `modulelist`.
*   **PUT `/api/admin/tracks/:id/reorder`**: Accept an array of Module IDs to completely replace and reorder the `modulelist`.

## 3. Student API Endpoints (`routes/quiz.routes.js` or new `routes/track.routes.js`)
*   **GET `/api/tracks` (List Tracks)**
    *   **Logic:** Fetch all tracks. For each track, populate `modulelist` (filtering out nulls or deleted modules).
    *   Filter the `modulelist` where `module.grades` includes `req.user.grade`.
    *   Discard tracks where the filtered `modulelist` length is 0.
    *   Query `Responses` for the user to calculate high-level progress (e.g., `completedModules / totalAllowedModules`) for each track.
*   **GET `/api/tracks/:id` (Track Details)**
    *   **Logic:** Fetch the specific track, filter its `modulelist` based on `req.user.grade`.
    *   Apply dynamic locking logic mimicking `getModulesWithProgress` in `controllers/quiz.controller.js`:
        *   Find the user's `Responses` for the modules in the track.
        *   Iterate sequentially through the allowed `modulelist`.
        *   Mark modules as `"completed"` if all active questions are answered.
        *   Mark the *first* non-completed module as `"unlocked"`.
        *   Mark all subsequent non-completed modules as `"locked"`.

## 4. Logical Constraints
*   **Dynamic Grade Progress:** Progress must not be hardcoded as a number on the User schema. It must be evaluated dynamically by counting completed modules against the *current* allowed modules for the student's grade.
*   **Resilience against nulls:** `populate` calls on `modulelist` must handle edge cases where a module ID exists but the document does not (e.g., manual DB deletion).