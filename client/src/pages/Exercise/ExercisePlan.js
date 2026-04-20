import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import './ExercisePlan.css';

// Data
import workoutData from './workoutData.json';
// Assets
import SeatedAbs from '../../assets/Seated Abs Circle.json';
import ToeTap from '../../assets/Press up postion toe tap.json';
import Lunge from '../../assets/Lunge.json';
import FrogPress from '../../assets/Frog Press.json';
import Cobras from '../../assets/Cobras.json';
import JumpingJack from '../../assets/Jumping Jack.json';
import WidePushUp from '../../assets/Wide_arm_push_up.json';
import TPlank from '../../assets/T Plank Exercise.json';
import Burpee from '../../assets/Burpee and Jump Exercise.json';
import SplitJump from '../../assets/Split Jump Exercise.json';

// 1. High-Relevance Mappings
const SPECIFIC_IMAGES = {
  plank: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=500&q=80',
  squat: 'https://images.unsplash.com/photo-1574680096141-9c31f2e9c0e5?w=500&q=80',
  lunge: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=500&q=80',
  pushup: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=500&q=80',
  burpee: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=500&q=80',
  run: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80',
  jump: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80',
  weight: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80',
  situp: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80',
  crunch: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80',
  knee: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=500&q=80',
  heel: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80',
  bike: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80'
};

// 2. Category Pools
const CATEGORY_POOLS = {
  abs: [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80',
    'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=500&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80',
    'https://images.unsplash.com/photo-1566241142559-40e1bfc26dd7?w=500&q=80',
    'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=500&q=80'
  ],
  legs: [
    'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=500&q=80',
    'https://images.unsplash.com/photo-1574680096141-9c31f2e9c0e5?w=500&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2adfcd?w=500&q=80'
  ],
  upper: [
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80',
    'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=500&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&q=80'
  ],
  cardio: [
    'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80',
    'https://images.unsplash.com/photo-1434609976200-bc50bb520b57?w=500&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80'
  ]
};

const getFallbackImage = (name = '', target = '', id = '0') => {
  const lowerName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const lowerTarget = target.toLowerCase();
  const safeId = String(id || '0');

  // A. Specific Keyword Check
  for (const [key, url] of Object.entries(SPECIFIC_IMAGES)) {
    if (lowerName.includes(key)) return url;
  }

  // B. Category Logic
  let pool = CATEGORY_POOLS.default;
  if (lowerTarget.includes('cardio') || lowerName.includes('cardio')) {
    pool = CATEGORY_POOLS.cardio;
  } else if (lowerTarget.includes('abs') || lowerTarget.includes('waist')) {
    pool = CATEGORY_POOLS.abs;
  } else if (lowerTarget.includes('legs') || lowerTarget.includes('quad') || lowerTarget.includes('calv')) {
    pool = CATEGORY_POOLS.legs;
  } else if (lowerTarget.includes('chest') || lowerTarget.includes('back') || lowerTarget.includes('arm') || lowerTarget.includes('shoulder')) {
    pool = CATEGORY_POOLS.upper;
  }

  // C. Deterministic Randomness
  const charCodeSum = safeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + lowerName.length;
  return pool[charCodeSum % pool.length];
};

const ExercisePlan = ({ user }) => {
  const navigate = useNavigate();
  const assetMap = {
    SeatedAbs, ToeTap, Lunge, FrogPress, Cobras, JumpingJack, WidePushUp, TPlank, Burpee, SplitJump
  };

  const [savedPlan, setSavedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Form State
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [experience, setExperience] = useState('beginner');
  const [goal, setGoal] = useState('fat_loss');
  // Although backend doesn't use activity for the split logic directly (it uses level), we keep it for consistency with Diet Modal
  const [activity, setActivity] = useState('moderate');


  const fetchUserData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCategory(data.category || 'Healthy');
        if (data.weight) setWeight(data.weight);
        if (data.age) setAge(data.age);
        if (data.gender) setGender(data.gender);
      }

      const planDoc = await getDoc(doc(db, 'plans', user.uid));
      if (planDoc.exists()) {
        const pData = planDoc.data();
        setSavedPlan(pData.exercisePlan || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const generatePlan = async () => {
    if (!weight || !age) {
      alert("Please enter weight and age.");
      return;
    }

    setLoading(true);
    try {
      // Backend request
      const response = await fetch('http://127.0.0.1:5001/exercise-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          level: experience,
          weightKg: weight || 70
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const planData = await response.json();
      setSavedPlan(planData);
      setShowConfigModal(false);

      if (user?.uid) {
        await setDoc(doc(db, 'plans', user.uid), {
          exercisePlan: planData,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update user stats if changed
        await setDoc(doc(db, 'users', user.uid), {
          weight: weight,
          age: age, // Save age if new
          gender: gender
        }, { merge: true });
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      alert(`Failed to generate plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async () => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'plans', user.uid), { exercisePlan: null });
      setSavedPlan(null);
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  return (
    <div className="diet-wrapper">
      <nav className="navbar">
        <div className="logo">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" style={{ height: 28, width: 28 }} />
          <span>NutriTrack</span>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/home')} className="nav-pill secondary">Back to Home</button>
        </div>
      </nav>

      <div className="plan-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-box hero-section" style={{
          padding: '3rem',
          background: 'linear-gradient(120deg, rgba(255,255,255,0.9), rgba(239,246,255,0.8))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="hero-content" style={{ zIndex: 2, maxWidth: '600px' }}>
            <div style={{ display: 'inline-block', padding: '6px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
              Focus: {category}
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>Personalized Training Journey</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Get stronger, faster, and healthier. A custom weekly routine designed exclusively for you.
            </p>
            <div className="hero-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowConfigModal(true)} className="btn-primary" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                🚀 {savedPlan ? 'Update My Plan' : 'Start My Journey'}
              </button>
              <button onClick={() => setShowExerciseModal(true)} className="nav-btn secondary" style={{ padding: '12px 24px', borderRadius: '30px' }}>
                🏋️ Basic Exercises
              </button>
            </div>
          </div>
          <div className="hero-visual" style={{ width: '300px', height: '300px' }}>
            <Lottie animationData={assetMap.JumpingJack} loop={true} />
          </div>
        </div>

        {savedPlan && (
          <div className="exercise-plan-display" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="summary-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-box" style={{ padding: '2rem', borderTop: '5px solid #3b82f6' }}>
                <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem' }}>📋 Weekly Overview</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>GOAL</span>
                    <span style={{ fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>{savedPlan.goal.replace('_', ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>LEVEL</span>
                    <span style={{ fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>{savedPlan.level}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>FREQUENCY</span>
                    <span style={{ fontWeight: 700 }}>{savedPlan.daysPerWeek} Days / Week</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>CALORIES</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>~{savedPlan.estimatedCaloriesBurned} / Session</span>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', padding: '1.5rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '15px', border: '1px solid #bae6fd' }}>
                  <h4 style={{ color: '#0369a1', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎯 TARGET FOCUS
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#0c4a6e', lineHeight: 1.6, fontWeight: 500 }}>{savedPlan.focusAreas}</p>
                </div>
                <button onClick={deletePlan} style={{ alignSelf: 'center', marginTop: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', transition: '0.2s', textDecoration: 'underline' }}>Remove this plan</button>
              </div>
            </div>

            <div className="details-col" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-box" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>📅 Workout Split</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {savedPlan.workoutSplit.map((day, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Day {idx + 1}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>{day}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-box" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem' }}>🏋️ Recommended Exercises</h3>
                <div className="exercises-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {savedPlan.exercises.map((ex) => (
                    <div key={ex.id} className="exercise-card" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <div className="ex-gif" style={{ height: '180px', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={ex.gifUrl || getFallbackImage(ex.name, ex.target, ex.id)}
                          alt={ex.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          style={{ height: '100%', width: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            const fallback = getFallbackImage(ex.name, ex.target, ex.id);
                            if (e.target.src !== fallback) {
                              e.target.src = fallback;
                            } else {
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                            }
                          }}
                        />
                        <div className="fallback-icon" style={{ display: 'none', position: 'absolute', inset: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', gap: '10px' }}>
                          <span style={{ fontSize: '2rem' }}>🏋️</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No Preview</span>
                        </div>
                      </div>
                      <div className="ex-content" style={{ padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', textTransform: 'capitalize' }}>{ex.name}</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#ecfdf5', color: '#059669', borderRadius: '10px', fontWeight: 700 }}>{ex.target}</span>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#f8fafc', color: '#64748b', borderRadius: '10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>{ex.equipment}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfigModal && (
        <div className="workout-modal-overlay">
          <div className="workout-modal-content">
            <div className="modal-header">
              <h2>
                <span style={{ fontSize: '1.8rem' }}>📊</span> Start Exercise Plan
              </h2>
              <button className="close-btn" onClick={() => setShowConfigModal(false)}>×</button>
            </div>

            <div className="calc-body">
              {/* Basic Metrics */}
              <div className="form-grid-3">
                <div className="input-group">
                  <label className="input-label">Weight (kg)</label>
                  <input type="number" className="modal-input" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label className="input-label">Age (yrs)</label>
                  <input type="number" className="modal-input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <select className="modal-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Configuration */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Experience</label>
                  <select className="modal-input" value={experience} onChange={(e) => setExperience(e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="normal">Intermediate</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Goal</label>
                  <select className="modal-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
                    <option value="fat_loss">Fat Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="body_recomposition">Body Recomposition</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Activity Level (Optional)</label>
                <select className="modal-input" value={activity} onChange={(e) => setActivity(e.target.value)}>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="veryActive">Very Active</option>
                  <option value="athlete">Athlete</option>
                </select>
              </div>

              <button
                onClick={generatePlan}
                className="generate-btn"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate My Exercise Plan'}
              </button>

            </div>
          </div>
        </div>
      )}

      {showExerciseModal && (
        <div className="workout-modal-overlay">
          <div className="workout-modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h2>
                <span style={{ fontSize: '1.8rem' }}>🤸</span> Basic Workout Exercises
              </h2>
              <button className="close-btn" onClick={() => setShowExerciseModal(false)}>×</button>
            </div>
            <div className="calc-body" style={{ background: '#f8fafc' }}>
              <div className="workout-grid-5">
                {workoutData.basicWorkouts.map((ex, idx) => (
                  <div key={idx} className="lottie-card">
                    {assetMap[ex.asset] && <Lottie animationData={assetMap[ex.asset]} loop style={{ height: '100px' }} />}
                    <p>{ex.title}</p>
                    <span className="exercise-info">{ex.sets}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePlan;
