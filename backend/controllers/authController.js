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
      await sendEmail(
        email,
        'Welcome to Our App!',
        `Hi ${name},\n\nThank you for signing up to our app!`
      );
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
