/**
 * @file attendance.controller.js
 * @description Manages user attendance tracking based on daily logins.
 * @architecture Updates user activity state upon request, supporting streak or daily tracking features.
 */
import expressAsyncHandler from "express-async-handler";
import User from "../models/user.model.js";

Date.prototype.getWeek = function () {
  const date = new Date(this);
  const CURRENT = date.getDate();
  date.setDate(1);
  return Math.floor((CURRENT + date.getDay() - 1) / 7) + 1;
};

/**
 * @desc    Update user attendance for the current day and week
 * @route   GET /api/attendance
 * @access  Private (User)
 */
export const attendance = expressAsyncHandler(async (req, res) => {
  try {
    const oldDate = new Date(req.user.lastSeen);
    let { days, week } = req.user;
    const newDate = new Date();
    if (
      oldDate.getMonth() === newDate.getMonth() &&
      oldDate.getWeek() === newDate.getWeek()
    ) {
      days[newDate.getDay()] = 1;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            days,
            week,
            lastSeen: Date.now(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
      res.json({
        days: user.days,
        week: user.week,
      });
    } else {
      days.fill(-1);
      const day = newDate.getDay();
      if (day) {
        days.fill(0, day - 1);
        days[day] = 1;
      } else {
        days[0] = 1;
      }
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            days,
            week: ++week,
            lastSeen: Date.now(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
      res.json({ days: user.days, week: user.week });
    }
  } catch (err) {
    res.status(500);
    throw new Error("Something went wrong\n\n" + err.message, { cause: err });
  }
});
