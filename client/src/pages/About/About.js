import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Home/home.css';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="logo">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" style={{ height: 28, width: 28 }} />
          <span>NutriTrack</span>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate(-1)} className="nav-pill secondary">← Back</button>
        </div>
      </nav>

      <div className="about-hero" style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #059669, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
          Empowering Your Health Journey
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
          NutriTrack combines advanced BMI analytics with personalized AI coaching to help you live a healthier, happier life.
        </p>
      </div>

      <div style={{ padding: '0 2rem', marginBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>

          <div className="glass-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥗</div>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem' }}>Smart Diet Planning</h3>
            <p style={{ color: '#64748b' }}>
              Get AI-generated meal plans tailored to your BMI category and dietary preferences, focusing on nutritious Indian cuisine.
            </p>
          </div>

          <div className="glass-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💪</div>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem' }}>Personalized Workouts</h3>
            <p style={{ color: '#64748b' }}>
              Whether you need fat loss or muscle gain, our verified routines guide you with clear visual instructions.
            </p>
          </div>

          <div className="glass-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem' }}>AI Health Expert</h3>
            <p style={{ color: '#64748b' }}>
              Have a question? Chat with our AI expert for instant advice on nutrition, exercises, and traditional remedies.
            </p>
          </div>

          <div className="glass-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💧</div>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem' }}>Daily Trackers</h3>
            <p style={{ color: '#64748b' }}>
              Keep tabs on your water intake and sleep patterns with intuitive tracking logs to maintain peak performance.
            </p>
          </div>

          <div className="glass-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem' }}>BMI Analytics</h3>
            <p style={{ color: '#64748b' }}>
              Understand your body metrics with our advanced calculator that tracks your progress categories over time.
            </p>
          </div>

          <div className="glass-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</div>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem' }}>Smart Recipes</h3>
            <p style={{ color: '#64748b' }}>
              Search for healthy recipes based on what's in your fridge. Our AI suggests nutritious meals instantly.
            </p>
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4rem 2rem', marginTop: 'auto', borderTop: '1px solid #e2e8f0' }}>
        <p style={{
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontSize: '0.8rem',
          marginBottom: '2rem',
          fontWeight: 700
        }}>
          DESIGNED & DEVELOPED BY
        </p>

        {/* Developer Card - Clean & Integrated */}
        <div onClick={() => window.open('https://karthik-portfolio-blond.vercel.app/', '_blank')} className="glass-box" style={{
          padding: '1.5rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          maxWidth: '450px',
          width: '100%',
          border: '2px solid rgba(5, 150, 105, 0.1)'
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(5, 150, 105, 0.1)'}
        >
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#0f172a', fontWeight: 800 }}>Karthik</h2>
            <p style={{ margin: '5px 0 0', color: '#059669', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 700 }}>VISIT PORTFOLIO</p>
          </div>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(5, 150, 105, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
