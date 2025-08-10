// routes/aiRoutes.js

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🥗 Diet Plan Route
router.post('/generate-diet', async (req, res) => {
  const { bmiCategory, dietType, goal } = req.body;

  const prompt = `
    You are a professional Indian nutritionist. Create a detailed 7-day ${dietType} Indian meal plan for someone who is ${bmiCategory} and wants to ${goal}.
    
    Requirements:
    - Use ONLY traditional Indian foods and dishes
    - Include Indian breakfast items like: idli, dosa, poha, upma, paratha, puri, chole bhature, vada, uttapam
    - Include Indian lunch with: dal (toor, moong, masoor), sabzi (aloo, bhindi, gobi, baingan), roti, rice, curd
    - Include Indian dinner with: khichdi, dalia, light roti, sabzi, buttermilk
    - Use Indian spices: turmeric, cumin, coriander, ginger, garlic, mustard seeds, fenugreek
    - Include Indian snacks: fruits, nuts, buttermilk, lassi, chai, roasted chana
    - Include Indian superfoods: ghee, jaggery, honey, amla, tulsi, ginger
    - NO regional directions like "North Indian" or "South Indian" - just give the actual food names
    - Keep portions appropriate for Indian dietary habits
    
    Structure the response as:
    Day 1:
    - Breakfast: [Specific Indian dish like "Idli with coconut chutney"]
    - Lunch: [Specific Indian meal like "Dal khichdi with ghee and pickle"]
    - Snack: [Specific Indian snack like "Roasted chana with tea"]
    - Dinner: [Specific Indian dinner like "Moong dal with roti and sabzi"]
    
    Continue for all 7 days with variety in Indian cuisine. Give specific dish names, not regional directions.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ plan: text });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: 'Failed to generate AI meal plan.' });
  }
});

// 🏋️ Exercise Plan Route
router.post('/generate-exercise', async (req, res) => {
  const { bmiCategory } = req.body;

  const prompt = `
    You are a certified Indian fitness trainer. Create a detailed 7-day beginner-friendly Indian workout plan for a person who falls under the "${bmiCategory}" category.
    
    Requirements:
    - Include traditional Indian exercises like Surya Namaskar, Pranayama, Yoga asanas
    - Include Indian martial arts-inspired movements like basic Kalaripayattu or Silambam stances
    - Include Indian dance-inspired cardio like basic Bhangra or Garba steps
    - Include traditional Indian strength training like Dand-Baithak (push-ups and squats)
    - Include Indian meditation and breathing exercises
    - Focus on exercises that can be done at home with minimal equipment
    - Include Indian warm-up routines like joint rotations and stretching
    - Structure each day with proper warm-up, main workout, and cool-down
    - Include Indian fitness wisdom and traditional health practices
    - NO regional directions - just give specific exercise names and descriptions
    
    Structure the response as:
    Day 1:
    - Warm-up: [Specific Indian warm-up like "Joint rotations and Surya Namaskar"]
    - Main Workout: [Specific Indian exercises like "Dand (push-ups) 3x10, Baithak (squats) 3x15"]
    - Cool-down: [Specific Indian relaxation like "Pranayama breathing exercises"]
    
    Continue for all 7 days with variety in Indian fitness routines. Give specific exercise names, not regional directions.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ plan: text });
  } catch (err) {
    console.error('Gemini API Error (Workout):', err);
    res.status(500).json({ error: 'Failed to generate AI workout plan.' });
  }
});

// 🧠 Health Q&A Chatbot Route
router.post('/health-chat', async (req, res) => {
  const { message, userId } = req.body;

  const prompt = `
    You are an Indian health and nutrition expert. Answer the following health-related question with Indian context and traditional wisdom:
    
    Question: ${message}
    
    Requirements:
    - Provide answers with Indian dietary context and traditional wisdom
    - Include Ayurvedic principles where relevant
    - Mention Indian foods, spices, and traditional remedies
    - Keep answers practical and actionable
    - Include both modern medical advice and traditional Indian health practices
    - Focus on Indian lifestyle and dietary habits
    - Keep responses concise but informative
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Save chat history to database
    if (userId) {
      try {
        const db = (await import('../db/db.js')).default;
        await db.execute(
          'INSERT INTO ai_chat_history (user_id, message_type, message) VALUES (?, ?, ?)',
          [userId, 'user', message]
        );
        await db.execute(
          'INSERT INTO ai_chat_history (user_id, message_type, message) VALUES (?, ?, ?)',
          [userId, 'ai', text]
        );
      } catch (dbError) {
        console.error('Database error saving chat:', dbError);
      }
    }

    res.json({ response: text });
  } catch (err) {
    console.error('Gemini API Error (Chat):', err);
    res.status(500).json({ error: 'Failed to generate AI response.' });
  }
});

// 📚 Get Chat History Route
router.get('/chat-history/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const db = (await import('../db/db.js')).default;
    const [rows] = await db.execute(
      'SELECT * FROM ai_chat_history WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    
    res.json({ history: rows });
  } catch (err) {
    console.error('Database error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
});

export default router;
