import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../api';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './auth.css';

const AuthPage = ({ setUser }) => {
  const [form, setForm] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const navigate = useNavigate();

  const toggleForm = () => setForm(form === 'login' ? 'signup' : 'login');
  const toggleAbout = () => setShowAbout(!showAbout);

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{7,}$/;

    if (!emailRegex.test(formData.email)) {
      toast.error('Email must be a valid Gmail address.');
      return false;
    }
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 7 characters, contain one uppercase letter and one special character.');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form === 'signup' && !validateInputs()) return;

    try {
      const url = form === 'login' ? apiUrl('/api/auth/login') : apiUrl('/api/auth/signup');
      const payload =
        form === 'login'
          ? { username: formData.username, password: formData.password }
          : formData;

      const response = await axios.post(url, payload);

      if (form === 'login') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success('Login successful! Redirecting...');
        // Navigate immediately to avoid any timing issues
        navigate('/home');
      } else {
        toast.success('Signup successful! Please login.');
        setForm('login');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  useEffect(() => {
    if (redirect) {
      const timer = setTimeout(() => navigate('/home'), 1800);
      return () => clearTimeout(timer);
    }
  }, [redirect, navigate]);

  return (
    <div className="auth-wrapper">

      {!showAbout ? (
        <div className="auth-container auth-grid">
          <div className="hero-box animated-fade">
            <div className="hero-head">
              <img className="hero-logo" src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" />
              <div>
                <h2 className="hero-title">NutriTrack</h2>
                <p className="hero-sub"> ➡️ Sign up / Sign in with your details and give your weight & height and start working out.</p>
                <p className="hero-desc"> 🌐Easy to use and navigate , Simple and user friendly.</p>
                <p className="hero-desc"> 💪Motivating streaks and progress tracking to keep you on track.</p>
                <p className="hero-desc"> 🤖 Quick tips from our AI agent — anytime you need.</p>
                <p className="hero-desc"> 🍳 Easy recipes and workouts designed for busy schedules.</p>
                <p className="hero-desc"> 🍴 Have the best meal plan from our AI agent.</p>
                <p className="hero-desc"> 🤸‍♀️Included beginner exercises to , All in one place.</p>
                <p className="hero-desc"> 🎯 Start your health journey today , and see your progress.</p>
              </div>
            </div>
           
           {/* ➡️ Made By container */}
<div className="hero-box animated-fade">
  {/* ...all your hero content... */}
  {/* "Made by" as a badge */}
  <span className="made-by-badge">
    Made by{' '}
    <a
      href="https://karthik564125.github.io/myportfolio/"
      target="_blank"
      rel="noopener noreferrer"
    >
      Karthik
    </a>
  </span>
</div>
            
            {/* inline explore removed */}
          </div>
          <div className="auth-card animated-fade">
            <div className={`flip-card-inner ${form === 'signup' ? 'flipped' : ''}`}>
              <div className="flip-face flip-login">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                  <input name="username" placeholder="Username" required onChange={handleChange} value={formData.username} />
                  <div className="password-wrapper">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" required onChange={handleChange} value={formData.password} />
                    <span className="password-toggle" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? '🙈' : '👁️'}</span>
                  </div>
                  <button type="submit">Login</button>
                </form>
                <p className="switch-link" onClick={() => setForm('signup')} tabIndex={0} role="button">Don't have an account? Signup</p>
              </div>
              <div className="flip-face flip-signup">
                <h2>Signup</h2>
                <form onSubmit={handleSubmit}>
                  <input name="name" placeholder="Name" required onChange={handleChange} value={formData.name} />
                  <input name="email" type="email" placeholder="Gmail Address" required onChange={handleChange} value={formData.email} />
                  <input name="dob" type="date" required onChange={handleChange} value={formData.dob} />
                  <select name="gender" required onChange={handleChange} value={formData.gender}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input name="username" placeholder="Username" required onChange={handleChange} value={formData.username} />
                  <div className="password-wrapper">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" required onChange={handleChange} value={formData.password} />
                    <span className="password-toggle" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? '🙈' : '👁️'}</span>
                  </div>
                  <button type="submit">Signup</button>
                </form>
                <p className="switch-link" onClick={() => setForm('login')} tabIndex={0} role="button">Already have an account? Login</p>
              </div>
            </div>
          </div>
        </div>
     ) : (
  <div className="about-container glass-box animated-fade">
  </div>
)}


      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default AuthPage;