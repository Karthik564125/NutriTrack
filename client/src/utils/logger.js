import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getTodayStr } from './dateUtils';

/**
 * Logs data to the daily progress collection.
 * @param {string} uid - User ID
 * @param {Object} data - Data to merge into the daily log
 */
export const logDailyActivity = async (uid, data) => {
    if (!uid) return;
    const todayStr = getTodayStr();
    const logRef = doc(db, 'progress', uid, 'logs', todayStr);

    try {
        const logDoc = await getDoc(logRef);
        if (!logDoc.exists()) {
            await setDoc(logRef, {
                date: todayStr,
                ...data,
                timestamp: new Date().toISOString()
            });
        } else {
            await updateDoc(logRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error logging daily activity:', error);
    }
};
