import express from 'express';
import { saveBMI, getLatestBMI } from '../controllers/bmiController.js';
const router = express.Router();

router.post('/save', saveBMI);
router.get('/latest/:id', getLatestBMI);

export default router;
