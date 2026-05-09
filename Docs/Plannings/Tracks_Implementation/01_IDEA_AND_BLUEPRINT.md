# Feature Blueprint: Tracks

## 1. Overview
The "Tracks" feature introduces a new organizational layer to group existing Modules sequentially by topic. For example, a "Word Problems" track can group relevant math modules together. This allows for curated, topic-based learning paths alongside the existing subject-based sequence.

## 2. Core Idea & Rules
- **Structure:** A Track has a title, subject, and an ordered list of module references (`modulelist`).
- **Sequential Unlocking:** Within a Track, modules unlock linearly. The next module becomes available only when the preceding allowed module is marked completed.
- **Class/Grade Allow List:** Modules retain their existing `grades` array (allow list). When a student views a Track, the system filters the `modulelist` to only include modules where the student's `grade` is in the module's `grades` array.
- **Skipping & Empty Tracks:** If a module is not allowed for a student's grade, it is seamlessly skipped in the track sequence. If a track contains *zero* allowed modules for a student, the track is hidden entirely from their dashboard.
- **Dynamic Progress Calculation:** Track progress (e.g., % completion) and locked/unlocked states are calculated dynamically at request time based on the student's current grade and `Responses`, ensuring seamless transitions during grade promotions.

## 3. Database Strategy
Based on the existing `Sequence` model (`models/Sequence.model.js`), the Track's `modulelist` will be implemented as an Array of `ObjectId`s. This leverages MongoDB's native array ordering, keeping the architecture simple and aligned with current conventions.

## 4. Workflow Blueprint
1. **Admin Creation:** An administrator creates a Track (e.g., "Advanced Algebra") and assigns a sequence of Modules to its `modulelist`. 
2. **Student Dashboard Fetch:** The frontend requests `/api/tracks`. The backend retrieves all tracks, populates the `modulelist`, filters modules based on `user.grade`, and returns only tracks with at least one allowed module, along with a top-level progress summary.
3. **Student Track Execution:** The student enters a specific Track. The backend evaluates their `Responses` against the allowed modules in the track, marking the first uncompleted module as "unlocked" and the rest as "locked".
4. **Maintenance:** If an admin deletes a module, a cascade hook automatically purges that module's ID from any Track's `modulelist` to prevent dead references.