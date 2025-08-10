import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css'; // reuse your glassmorphism styling

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="about-container glass">
        <h2>About NutriTrack</h2>
        <p>
          NutriTrack is your AI-powered health companion. We help you monitor your BMI, track your diet,
          generate exercise plans, and stay motivated through daily health streaks.
        </p>
        <p>
          Designed for all body types and dietary preferences (veg/non-veg), NutriTrack gives personalized
          health plans, supplement suggestions, and much more.
        </p>

        <div className="contact-box">
          <h4>Contact Us</h4>
          <p><strong>Name:</strong> Karthikeya Pisupati</p>
          <p><strong>Email:</strong> pisupatikarthikeyabharadwaja@gmail.com</p>
          <p><strong>Phone:</strong> +91 7075686837</p>
          <p><strong>Location:</strong> Guntur</p>

          <button className="switch-link" onClick={() => navigate('/')}>← Back to Login</button>
        </div>
      </div>
    </div>
  );
};

export default About;
