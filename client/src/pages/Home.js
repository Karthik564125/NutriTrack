import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HealthChat from './components/HealthChat';
import './home.css';
import { apiUrl } from '../api';

const Home = ({ user, setUser, bmiData, setBmiData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('meters');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dietType, setDietType] = useState('veg');
  const [showChat, setShowChat] = useState(false);
  const [exerciseStreak, setExerciseStreak] = useState(0);
  const [dietStreak, setDietStreak] = useState(0);
  const [lastBmi, setLastBmi] = useState(null);

  const fetchLatestBMI = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(apiUrl(`/api/bmi/latest/${user.id}`));
      const data = await response.json();
      if (response.ok && data && data.id) {
        const bmiResult = {
          bmi: Number(data.bmi_value).toFixed(2),
          category: data.category
        };
        setLastBmi(bmiResult);
        localStorage.setItem(`lastBmi_${user.id}`, JSON.stringify(bmiResult)); // cache last BMI
        setHeight(data.height);
        setHeightUnit(data.height_unit);
        setWeight(data.weight);
        setWeightUnit(data.weight_unit);
        setDietType(data.diet_type);
      } else {
        setLastBmi(null);
      }
    } catch (error) {
      console.error('Error fetching latest BMI:', error);
    }
  }, [user]);

  const fetchStreaks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const exRes = await fetch(apiUrl(`/api/streaks/${user.id}/exercise`));
      const exData = await exRes.json();
      setExerciseStreak(exData.currentStreak || 0);

      const dietRes = await fetch(apiUrl(`/api/streaks/${user.id}/diet`));
      const dietData = await dietRes.json();
      setDietStreak(dietData.currentStreak || 0);
    } catch (err) {
      console.error('Failed to fetch streaks:', err);
      setExerciseStreak(0);
      setDietStreak(0);
    }
  }, [user?.id]);

  // Load cached last BMI instantly when user logs in, then fetch from backend
  useEffect(() => {
    if (user?.id) {
      const cachedLast = localStorage.getItem(`lastBmi_${user.id}`);
      if (cachedLast) setLastBmi(JSON.parse(cachedLast));
      setBmiData(null); // current session result starts empty
      fetchLatestBMI();
      fetchStreaks();
    }
  }, [user, fetchLatestBMI, fetchStreaks]);

  // Re-fetch when returning via navigation history
  useEffect(() => {
    if (!user?.id) return;
    fetchLatestBMI();
    fetchStreaks();
  }, [location.key, user?.id, fetchLatestBMI, fetchStreaks]);

  // Re-fetch when window gains focus
  useEffect(() => {
    if (!user?.id) return;
    const onFocus = () => {
      fetchLatestBMI();
      fetchStreaks();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id, fetchLatestBMI, fetchStreaks]);

  // Load diet preference from local storage on first load
  useEffect(() => {
    const storedDiet = localStorage.getItem('dietType');
    if (storedDiet) setDietType(storedDiet);
  }, []);

  const handleLogout = () => {
    // Keep cached last BMI and preferences; only remove user
    localStorage.removeItem('user');
    setUser(null);
    setBmiData(null);
    setLastBmi(null);
    navigate('/');
  };

  const calculateBMI = async (e) => {
    e.preventDefault();

    let heightMeters = parseFloat(height);
    let weightKg = parseFloat(weight);

    if (isNaN(heightMeters) || isNaN(weightKg)) {
      alert('Please enter valid numbers');
      return;
    }

    switch (heightUnit) {
      case 'cm': heightMeters /= 100; break;
      case 'feet': heightMeters *= 0.3048; break;
      case 'inches': heightMeters *= 0.0254; break;
      default: break;
    }

    if (weightUnit === 'pounds') {
      weightKg *= 0.453592;
    }

    if (heightMeters <= 0 || weightKg <= 0) {
      alert('Invalid height or weight');
      return;
    }

    const bmi = weightKg / (heightMeters * heightMeters);
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 24.9) category = 'Normal weight';
    else if (bmi < 29.9) category = 'Overweight';
    else category = 'Obesity';

    const bmiResult = { bmi: bmi.toFixed(2), category };
    setBmiData(bmiResult);        // current session
    setLastBmi(bmiResult);        // update summary immediately
    localStorage.setItem(`lastBmi_${user.id}`, JSON.stringify(bmiResult));
    localStorage.setItem('dietType', dietType);

    try {
      await fetch(apiUrl('/api/bmi/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          height_meters: heightUnit === 'meters' ? parseFloat(height) : null,
          height_cm: heightUnit === 'cm' ? parseFloat(height) : null,
          height_feet: heightUnit === 'feet' ? parseFloat(height) : null,
          height_inches: heightUnit === 'inches' ? parseFloat(height) : null,
          weight_kg: weightUnit === 'kg' ? parseFloat(weight) : null,
          weight_pounds: weightUnit === 'pounds' ? parseFloat(weight) : null,
          bmi: bmi.toFixed(2),
          category,
          preference: dietType
        })
      });
    } catch (error) {
      console.error('Error saving BMI:', error);
    }
  };

  const getBMIProgress = () => {
    const bmi = parseFloat((bmiData || lastBmi)?.bmi);
    if (!bmi) return 0;
    return Math.min((bmi / 40) * 100, 100);
  };

  const getBMIColor = () => {
    const bmi = parseFloat((bmiData || lastBmi)?.bmi);
    if (bmi < 18.5) return 'blue';
    if (bmi < 24.9) return 'green';
    if (bmi < 29.9) return 'orange';
    return 'red';
  };

  const goToDiet = async () => {
    await fetchStreaks();
    navigate('/diet');
  };

  const goToExercise = async () => {
    await fetchStreaks();
    navigate('/exercise');
  };

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo">NutriTrack</div>
        <div className="nav-buttons">
          <button onClick={() => setShowChat(true)} className="chat-btn">🧘‍♀️ Health Expert</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-3panel">

        {/* LEFT: Input Form */}
        <div className="glass-box panel input-panel">
          <h1>Welcome, {user?.name || 'User'}!</h1>
          <p>Your health journey starts here 💪</p>
          <form onSubmit={calculateBMI}>
            <div className="input-group">
              <input type="number" placeholder="Enter height"
                value={height} onChange={(e) => setHeight(e.target.value)} />
              <select value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)}>
                <option value="meters">meters</option>
                <option value="cm">cm</option>
                <option value="feet">feet</option>
                <option value="inches">inches</option>
              </select>
            </div>

            <div className="input-group">
              <input type="number" placeholder="Enter weight"
                value={weight} onChange={(e) => setWeight(e.target.value)} />
              <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)}>
                <option value="kg">kg</option>
                <option value="pounds">pounds</option>
              </select>
            </div>

            <div className="diet-toggle">
              <label>
                <input type="radio" name="dietType" value="veg"
                  checked={dietType === 'veg'} onChange={() => setDietType('veg')} /> Veg
              </label>
              <label>
                <input type="radio" name="dietType" value="non-veg"
                  checked={dietType === 'non-veg'} onChange={() => setDietType('non-veg')} /> Non-Veg
              </label>
            </div>

            <button type="submit" className="logout-btn">Calculate BMI</button>
          </form>
        </div>

        {/* MIDDLE: Health Summary */}
        <div className="glass-box panel summary-panel">
          <h2>Health Summary</h2>
          {lastBmi ? (
            <>
              <p><strong>Last BMI:</strong> {lastBmi.bmi}</p>
              <p><strong>Category:</strong> {lastBmi.category}</p>
              <p><strong>🥗 Diet Streak:</strong> {dietStreak} days</p>
              <p><strong>🏃 Exercise Streak:</strong> {exerciseStreak} days</p>
            </>
          ) : (
            <p>After clicking "Calculate BMI", you will see your BMI result , and start your health journey after clicking "Diet Plan" or "Exercise Plan"</p>
          )}
        </div>

        {/* RIGHT: BMI Result */}
        <div className="glass-box panel result-panel">
          <h2>Your BMI Result</h2>
          {(bmiData || lastBmi) ? (
            <>
              <p><strong>BMI:</strong> {(bmiData || lastBmi).bmi}</p>
              <p><strong>Category:</strong> {(bmiData || lastBmi).category}</p>
              <div className="progress-bar-container">
                <div className="progress-bar"
                  style={{
                    width: `${getBMIProgress()}%`,
                    backgroundColor: getBMIColor()
                  }}></div>
              </div>
              <div className="bmi-actions">
                <button onClick={goToDiet} className="nav-btn">Diet Plan</button>
                <button onClick={goToExercise} className="nav-btn">Exercise Plan</button>
              </div>
            </>
          ) : (
            <p>Enter your height and weight to see your BMI</p>
          )}
        </div>
      </div>
      <div className="glass-box app-info-container">
        <h2>📱 How NutriTrack Works</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>🎯 BMI Calculation</h3>
            <p>Enter your height and weight to get your BMI category. This helps us provide personalized recommendations.</p>
          </div>
          <div className="info-card">
            <h3>🥗 Diet Planning</h3>
            <p>Get AI-powered Indian meal plans based on your BMI, dietary preferences, and health goals.</p>
          </div>
          <div className="info-card">
            <h3>🏃‍♂ Exercise Tracking</h3>
            <p>Track your workout streaks & get personalized Indian fitness routines with traditional exercises.</p>
          </div>
          <div className="info-card">
            <h3>🧘‍♀ Health Expert</h3>
            <p>Chat with our AI health expert for Indian dietary advice, traditional remedies, and wellness tips.</p>
          </div>
          <div className="info-card">
            <h3>📊 Progress Tracking</h3>
            <p>Monitor your streaks, track your progress, and maintain consistency in your health journey.</p>
          </div>
          <div className="info-card">
            <h3>🇮🇳 Indian Context</h3>
            <p>All recommendations are tailored to Indian lifestyle, traditional foods, and cultural practices.</p>
          </div>
        </div>
      </div>

      {showChat && (
        <HealthChat user={user} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default Home;