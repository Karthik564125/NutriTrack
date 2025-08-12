// controllers/authController.js
import db from '../db/db.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../services/email.js';

export const signup = async (req, res) => {
  const { name, username, email, password, dob, gender } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, username, email, password, dob, gender) VALUES (?, ?, ?, ?, ?, ?)';
    await db.execute(sql, [name, username, email, hashedPassword, dob, gender]);

    // Send welcome email (non-blocking for production reliability)
    try {
      const subject = '🎉 Welcome to NutriTrack! Let’s begin your health journey';
      const body = `Hey ${name} 👋\n\nWelcome to NutriTrack — your personal health companion! 🌱✨\n\nHere’s what you can do right now:\n1) Calculate your BMI ⚖️ to know your category\n2) Choose your diet type 🥗🍗 and set your goals\n3) Generate your AI Meal Plan 🤖🍽️ for 7 days\n4) Try the AI Workout Plan 💪 with guided ideas\n5) Track your daily streaks 🔥 and weekly progress 🗓️\n6) Chat with our Health Expert 🧘‍♀️ for quick tips\n\nPro tips:\n• Save and revisit your last results on Home 📊\n• Tap “Mark Today” once a day to keep the streak alive ✅\n• Stay hydrated and sleep well 💧😴\n\nWe’re excited to be part of your journey.\nStay consistent, stay healthy! 💚\n\n— Team NutriTrack`;
      await sendEmail(email, subject, body);
    } catch (emailError) {
      console.error('Email send failed (non-fatal):', emailError);
    }

    res.status(201).json({ message: 'Signup successful, email sent' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  try {
    const [results] = await db.execute(sql, [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    delete user.password;
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};
