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
        setRedirect(true);
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
      <nav className="navbar">
        <div className="logo">NutriTrack</div>
        <a href="/about" className="about-box">About Us</a>
      </nav>

      {!showAbout ? (
        <div className="auth-container">
          <div className="auth-box animated-fade">
            <h2>{form === 'login' ? 'Login' : 'Signup'}</h2>
            <form onSubmit={handleSubmit}>
              {form === 'signup' && (
                <>
                  <input
                    name="name"
                    placeholder="Name"
                    required
                    onChange={handleChange}
                    value={formData.name}
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Gmail Address"
                    required
                    onChange={handleChange}
                    value={formData.email}
                  />
                  <input
                    name="dob"
                    type="date"
                    required
                    onChange={handleChange}
                    value={formData.dob}
                  />
                  <select
                    name="gender"
                    required
                    onChange={handleChange}
                    value={formData.gender}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </>
              )}

              <input
                name="username"
                placeholder="Username"
                required
                onChange={handleChange}
                value={formData.username}
              />

              <div className="password-wrapper">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  onChange={handleChange}
                  value={formData.password}
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>

              <button type="submit">{form === 'login' ? 'Login' : 'Signup'}</button>
            </form>

            <p
              onClick={toggleForm}
              className="switch-link"
              tabIndex={0}
              role="button"
              onKeyPress={e => e.key === 'Enter' && toggleForm()}
            >
              {form === 'login' ? "Don't have an account? Signup" : 'Already have an account? Login'}
            </p>
          </div>
        </div>
     ) : (
  <div className="about-container glass-box animated-fade">
    <h3>About NutriTrack</h3>
    <p>
      NutriTrack is your all-in-one wellness assistant—designed to guide users through personalized health journeys with BMI calculation,
      tailored diet charts, and goal-based exercise plans.
    </p>
    <p>
      Our mission is to empower every individual with data-driven insights and motivation to live healthier, stronger, and smarter every day.
      Backed by nutritional research and modern UI/UX, we ensure health never felt this effortless.
    </p>

    {/* ✅ Contact Info Section */}
    <div className="contact-box">
      <h4>Contact Us</h4>
      <p><strong>Name:</strong> Karthikeya Pisupati</p>
      <p><strong>Email:</strong> pisupatikarthikeyabharadwaja@gmail.com</p>
      <p><strong>Phone:</strong> +91 7075686837</p>
      <p><strong>Location:</strong> Guntur</p>
    </div>

    <button className="switch-link" onClick={toggleAbout}>← Back to Login</button>
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