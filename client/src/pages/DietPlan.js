import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HealthChat from './components/HealthChat';
import { apiUrl } from '../api';
import './diet.css';

const DietPlan = ({ user }) => {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const category = user?.bmiCategory || 'Normal weight';
  const dietType = localStorage.getItem('dietType') || 'veg';

  // Local date formatter matching backend format
  const getTodayStr = () => {
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    return todayLocal.toLocaleDateString('en-CA'); // YYYY-MM-DD
  };

  const fetchStreak = useCallback(async () => {
    try {
      console.log(`Fetching streak for user ${user.id}`);
      const response = await fetch(apiUrl(`/api/streaks/${user.id}/diet`));
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Streak data received:', data);
      
      if (data.currentStreak !== undefined && data.longestStreak !== undefined) {
        setStreak(data.currentStreak);
        setLongestStreak(data.longestStreak);

        const todayStr = getTodayStr();
        setDoneToday(data.lastCompletedDate === todayStr);
      } else {
        console.error('Invalid streak data received:', data);
        setStreak(0);
        setLongestStreak(0);
      }

      setLoadingStreak(false);
    } catch (error) {
      console.error('Error fetching streak:', error);
      setStreak(0);
      setLongestStreak(0);
      setLoadingStreak(false);
    }
  }, [user?.id]);

  // Fetch streak data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchStreak();
    }
  }, [user, fetchStreak]);

  const markDone = async () => {
  if (doneToday) return; // Safety check

  setUpdateLoading(true);
  setUpdateError('');

  try {
    const response = await fetch(apiUrl(`/api/streaks/${user.id}/diet/update`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to update streak');

    const result = await response.json();

    // ✅ Immediate visual feedback
    setDoneToday(true);

    if (result.message === 'Streak updated') {
      setStreak(prev => prev + 1);
      setLongestStreak(prev => Math.max(prev, streak + 1));
    }

  } catch (error) {
    console.error(error);
    setUpdateError('Failed to update streak.');
  } finally {
    setUpdateLoading(false);
  }
};


  const resetStreak = async () => {
    setUpdateLoading(true);
    setUpdateError('');
    try {
      const response = await fetch(apiUrl(`/api/streaks/${user.id}/diet/reset`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to reset streak');
      await fetchStreak();
    } catch (error) {
      setUpdateError('Failed to reset streak.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const generateAIDiet = async () => {
    setLoadingAi(true);
    setAiPlan('');
    try {
      const res = await fetch(apiUrl('/api/ai/generate-diet'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bmiCategory: category,
          dietType,
          goal:
            category === 'Underweight'
              ? 'gain weight'
              : category === 'Obesity'
              ? 'lose weight'
              : 'maintain weight'
        })
      });
      const result = await res.json();
      setAiPlan(result.plan || 'AI was unable to generate a plan.');
    } catch (err) {
      console.error('AI Error:', err);
      setAiPlan('Error fetching AI-generated plan.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="diet-wrapper">
      <nav className="navbar">
        <div className="logo">NutriTrack</div>
        <div className="nav-buttons">
          <button onClick={() => setShowChat(true)} className="chat-btn">
            🧘‍♀️ Health Expert
          </button>
          <button onClick={() => navigate('/home')} className="nav-btn">
            Back to BMI
          </button>
        </div>
      </nav>

      <div className="glass-box">
        {loadingStreak ? (
          <h2>Loading streak data...</h2>
        ) : (
          <>
            <h2>
              🔥 Current Streak: {streak} {streak === 1 ? 'Day' : 'Days'}
            </h2>
            <p>🏆 Longest Streak: {longestStreak} {longestStreak === 1 ? 'Day' : 'Days'}</p>
            <button onClick={markDone} disabled={doneToday || updateLoading} className="nav-btn">
              {updateLoading ? 'Updating...' : doneToday ? '✅ Marked Done' : '✔️ Mark as Done'}
            </button>
            {doneToday && (
              <button onClick={resetStreak} className="logout-btn" disabled={updateLoading}>
                {updateLoading ? 'Resetting...' : 'Reset Streak'}
              </button>
            )}
            {updateError && <p style={{color:'red'}}>{updateError}</p>}
          </>
        )}
      </div>

      <div className="glass-box">
        <button onClick={generateAIDiet} className="nav-btn">
          🧠 Generate AI Meal Plan
        </button>
        {loadingAi && <p>Loading AI-generated plan...</p>}
        {aiPlan && (
          <div className="glass-box">
            <h3>🤖 AI-Generated Diet Plan for {category} ({dietType})</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{aiPlan}</pre>
          </div>
        )}
      </div>

      <div className="glass-box">
        <h2>🍎 Nutritional Goals</h2>
        <p>
          Based on your BMI category, aim to consume a balanced mix of protein,
          complex carbohydrates, and healthy fats. Drink plenty of water and
          avoid processed foods. AI-generated plans will tailor this for you.
        </p>
      </div>

      <div className="glass-box">
        <h2>💊 Suggested Supplements</h2>
        <ul>
          <li>Consider Multivitamins if you're on a restrictive diet.</li>
          <li>Omega-3 (from flaxseed or fish oil) can help overall wellness.</li>
          <li>Protein powders can support muscle retention if needed.</li>
        </ul>
      </div>

      <div className="glass-box">
        <h2>🧘 Lifestyle Tips</h2>
        <p><strong>Sleep:</strong> Aim for 7–9 hours/night.</p>
        <p><strong>Water Intake:</strong> At least 2.5–3 liters/day.</p>
        <p><strong>Advice:</strong> Stick to a routine, move regularly (walk/gym/yoga), and limit high-sugar intake.</p>
      </div>
      
      {showChat && (
        <HealthChat user={user} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default DietPlan;
