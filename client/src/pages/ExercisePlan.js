import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import HealthChat from './components/HealthChat';
import { apiUrl } from '../api';
import './diet.css';

// Import all 10 Lottie JSON files
import SeatedAbs from '../assets/Seated Abs Circle.json';
import ToeTap from '../assets/Press up postion toe tap.json';
import Lunge from '../assets/Lunge.json';
import FrogPress from '../assets/Frog Press.json';
import Cobras from '../assets/Cobras.json';
import JumpingJack from '../assets/Jumping Jack.json';
import WidePushUp from '../assets/Wide_arm_push_up.json';
import TPlank from '../assets/T Plank Exercise.json';
import Burpee from '../assets/Burpee and Jump Exercise.json';
import SplitJump from '../assets/Split Jump Exercise.json';

const ExercisePlan = ({ user }) => {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [aiWorkout, setAiWorkout] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const category = user?.bmiCategory || 'Normal weight';

  const fetchStreak = useCallback(async () => {
    try {
      console.log(`Fetching streak for user ${user.id}`);
      const response = await fetch(apiUrl(`/api/streaks/${user.id}/exercise`));
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Streak data received:', data);
      
      if (data.currentStreak !== undefined && data.longestStreak !== undefined) {
        setStreak(data.currentStreak);
        setLongestStreak(data.longestStreak);
        setDoneToday(data.lastCompletedDate === new Date().toISOString().split('T')[0]);
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
    if (doneToday) return;
    setUpdateLoading(true);
    setUpdateError('');
    try {
      const response = await fetch(apiUrl(`/api/streaks/${user.id}/exercise/update`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update streak');
      setDoneToday(true);
      await fetchStreak();
    } catch (error) {
      setUpdateError('Failed to update streak.');
    } finally {
      setUpdateLoading(false);
    }
  };


  const resetStreak = async () => {
    setUpdateLoading(true);
    setUpdateError('');
    try {
      const response = await fetch(apiUrl(`/api/streaks/${user.id}/exercise/reset`), {
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

  const generateAIWorkout = async () => {
    setLoading(true);
    setAiWorkout('');
    try {
      const res = await fetch(apiUrl('/api/ai/generate-exercise'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bmiCategory: category }),
      });
      const result = await res.json();
      setAiWorkout(result.plan || 'AI was unable to generate a workout plan.');
    } catch (err) {
      console.error('AI Error:', err);
      setAiWorkout('Error fetching AI-generated workout.');
    } finally {
      setLoading(false);
    }
  };

  const animations = [
    { title: 'Seated Abs Circle', file: SeatedAbs, sets: '3 × 15' },
    { title: 'Toe Tap (Press Up)', file: ToeTap, sets: '3 × 10' },
    { title: 'Lunges', file: Lunge, sets: '3 × 12' },
    { title: 'Frog Press', file: FrogPress, sets: '4 × 10' },
    { title: 'Cobras', file: Cobras, sets: '3 × 8' },
    { title: 'Jumping Jack', file: JumpingJack, sets: '3 × 30 sec' },
    { title: 'Wide Push-up', file: WidePushUp, sets: '3 × 10' },
    { title: 'T Plank', file: TPlank, sets: '3 × 20 sec' },
    { title: 'Burpee Jump', file: Burpee, sets: '3 × 8' },
    { title: 'Split Jump', file: SplitJump, sets: '3 × 10' },
  ];

  return (
    <div className="diet-wrapper">
      <nav className="navbar">
        <div className="logo">NutriTrack</div>
        <div className="nav-buttons">
          <button onClick={() => setShowChat(true)} className="chat-btn">
            🧘‍♀️ Health Expert
          </button>
          <button onClick={() => navigate('/home')} className="nav-btn">Back to BMI</button>
        </div>
      </nav>

      <div className="glass-box">
        {loadingStreak ? (
          <h2>Loading streak data...</h2>
        ) : (
          <>
            <h2>🏃‍♂️ Workout Streak: {streak} {streak === 1 ? 'Day' : 'Days'}</h2>
            <p>🏆 Longest Streak: {longestStreak} {longestStreak === 1 ? 'Day' : 'Days'}</p>
            <button onClick={markDone} disabled={doneToday || updateLoading} className="nav-btn">
              {updateLoading ? 'Updating...' : doneToday ? '✅ Marked Done' : '✔️ Mark as Done'}
            </button>
            {doneToday && <button onClick={resetStreak} className="logout-btn" disabled={updateLoading}>{updateLoading ? 'Resetting...' : 'Reset Streak'}</button>}
            {updateError && <p style={{color:'red'}}>{updateError}</p>}
          </>
        )}
      </div>

      <div className="glass-box">
        <button onClick={generateAIWorkout} className="nav-btn">🤖 Generate AI Workout Plan</button>
        {loading && <p>Loading AI-generated workout...</p>}
        {aiWorkout && (
          <div className="glass-box">
            <h3>🤖 AI-Generated Workout Plan for {category}</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{aiWorkout}</pre>
          </div>
        )}
      </div>

      <div className="glass-box">
        <h2>🎞️ Workout Animations</h2>
        <div className="lottie-grid lottie-grid--tight">
          {animations.map((ex, idx) => (
            <div className="lottie-card" key={idx}>
              <Lottie animationData={ex.file} loop style={{ width: '100%', height: 120 }} />
              <h4>{ex.title}</h4>
              <p className="exercise-info">{ex.sets} reps</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-box">
        <h2>🧘 Yoga for Holistic Wellness</h2>
        <p>
          Enhance flexibility, reduce stress, and improve posture with these beginner-friendly yoga asanas:
        </p>
        <ul>
          <li>Mountain Pose (Tadasana)</li>
          <li>Chair Pose (Utkatasana)</li>
          <li>Warrior Pose (Virabhadrasana)</li>
          <li>Downward Dog (Adho Mukha Svanasana)</li>
          <li>Upward Dog (Urdhva Mukha Svanasana)</li>
          <li>Plow Pose (Halasana)</li>
          <li>Child Pose (Balasana)</li>
          <li>Headstand (Sirsasana) – *advanced*</li>
          <li>Boat Pose (Navasana)</li>
          <li>Bridge Pose (Setu Bandhasana)</li>
        </ul>
        <p>
          📺 <strong>Watch full guided yoga session here:</strong><br />
          <a
            href="https://www.youtube.com/watch?v=v7AYKMP6rOE"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-btn"
            style={{ display: 'inline-block', marginTop: '10px' }}
          >
            ▶️ 20-Minute Beginner Yoga Routine
          </a>
        </p>
      </div>
      
      {showChat && (
        <HealthChat user={user} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default ExercisePlan;
