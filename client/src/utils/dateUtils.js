/**
 * Formats a date to YYYY-MM-DD in local time.
 * @param {Date} date 
 * @returns {string}
 */
export const getTodayStr = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

/**
 * Calculates a new streak based on the last activity date and current date.
 * @param {string} lastDateStr - YYYY-MM-DD string
 * @param {number} currentStreak 
 * @returns {number} - New streak count
 */
export const calculateNewStreak = (lastDateStr, currentStreak) => {
    const todayStr = getTodayStr();
    if (!lastDateStr) return 1;

    const lastDate = new Date(lastDateStr);
    const todayDate = new Date(todayStr);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return (currentStreak || 0) + 1;
    } else if (diffDays === 0) {
        return currentStreak || 0;
    } else {
        return 1;
    }
};
