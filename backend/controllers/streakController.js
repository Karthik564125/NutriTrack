import db from '../db/db.js';

// ✅ Format to YYYY-MM-DD in LOCAL time
const formatDate = (date) => {
  if (!date) return null;
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

export const getStreak = async (req, res) => {
  const { userId, streakType } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM user_streaks WHERE user_id = ? AND streak_type = ?',
      [userId, streakType]
    );

    if (rows.length === 0) {
      // Create a default streak row
      await db.execute(
        'INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_completed_date) VALUES (?, ?, 0, 0, NULL)',
        [userId, streakType]
      );
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null
      });
    }

    res.json({
      currentStreak: rows[0].current_streak,
      longestStreak: rows[0].longest_streak,
      lastCompletedDate: formatDate(rows[0].last_completed_date)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streak', details: err.message });
  }
};

export const updateStreak = async (req, res) => {
  const { userId, streakType } = req.params;
  const today = formatDate(new Date());

  try {
    const [rows] = await db.execute(
      'SELECT * FROM user_streaks WHERE user_id = ? AND streak_type = ?',
      [userId, streakType]
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let lastCompletedDate = null;

    if (rows.length > 0) {
      currentStreak = rows[0].current_streak;
      longestStreak = rows[0].longest_streak;
      lastCompletedDate = formatDate(rows[0].last_completed_date);
    }

    // ✅ Already completed today
    if (lastCompletedDate === today) {
      return res.json({
        currentStreak,
        longestStreak,
        lastCompletedDate,
        message: 'Already completed today!'
      });
    }

    let newStreak = 1; // First day of streak

    if (lastCompletedDate) {
      const diffDays = Math.floor(
        (new Date(today) - new Date(lastCompletedDate)) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else {
        // Missed days → reset streak to 1
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(newStreak, longestStreak);

    if (rows.length > 0) {
      await db.execute(
        'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_completed_date = ? WHERE user_id = ? AND streak_type = ?',
        [newStreak, newLongestStreak, today, userId, streakType]
      );
    } else {
      await db.execute(
        'INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_completed_date) VALUES (?, ?, ?, ?, ?)',
        [userId, streakType, newStreak, newLongestStreak, today]
      );
    }

    res.json({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: today,
      message: 'Streak updated successfully!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update streak', details: err.message });
  }
};

export const resetStreak = async (req, res) => {
  const { userId, streakType } = req.params;

  try {
    await db.execute(
      'UPDATE user_streaks SET current_streak = 0, longest_streak = 0, last_completed_date = NULL WHERE user_id = ? AND streak_type = ?',
      [userId, streakType]
    );

    res.json({
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      message: 'Streak reset successfully!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset streak', details: err.message });
  }
};
