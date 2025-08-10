import express from 'express';
import { getStreak, updateStreak, resetStreak } from '../controllers/streakController.js';
const router = express.Router();

router.get('/:userId/:streakType', getStreak);
router.post('/:userId/:streakType/update', updateStreak);
router.post('/:userId/:streakType/reset', resetStreak);

export default router; 