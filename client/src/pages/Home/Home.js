import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import HealthChat from '../../components/HealthChat';
import FridgeSearch from '../../components/FridgeSearch';
import HistoryModal from '../../components/HistoryModal';
import { toast } from 'react-toastify';
import './home.css';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getTodayStr } from '../../utils/dateUtils';
import { logDailyActivity } from '../../utils/logger';

// Assets
import waterAnim from '../../assets/water.json';
import sleepAnim from '../../assets/sleep.json';

const Home = ({ user, setUser, bmiData, setBmiData }) => {
  const navigate = useNavigate();

  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('meters');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dietType, setDietType] = useState('veg');
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exerciseStreak, setExerciseStreak] = useState(0);
  const [dietStreak, setDietStreak] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0); // Glasses
  const [sleepHours, setSleepHours] = useState(0);
  const [lastBmi, setLastBmi] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);


  const hasLoadedInitial = useRef(false);

  const fetchUserData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.bmi) {
          const bmiResult = {
            bmi: Number(data.bmi).toFixed(2),
            category: data.category || ''
          };
          setLastBmi(bmiResult);
          localStorage.setItem(`lastBmi_${user.uid}`, JSON.stringify(bmiResult));
        }

        // Only set these on the VERY first load ever for the session
        if (!hasLoadedInitial.current) {
          if (data.height) setHeight(data.height);
          if (data.heightUnit) setHeightUnit(data.heightUnit);
          if (data.weight) setWeight(data.weight);
          if (data.weightUnit) setWeightUnit(data.weightUnit);
          if (data.dietType) setDietType(data.dietType);
          hasLoadedInitial.current = true;
        }

        setExerciseStreak(data.exerciseStreak || 0);
        setDietStreak(data.dietStreak || 0);
      }

      // Fetch today's log for water and sleep
      const todayStr = getTodayStr();
      const logDoc = await getDoc(doc(db, 'progress', user.uid, 'logs', todayStr));
      if (logDoc.exists()) {
        const logData = logDoc.data();
        setWaterIntake(logData.waterIntake || 0);
        setSleepHours(logData.sleepHours || 0);
      } else {
        setWaterIntake(0);
        setSleepHours(0);
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
    }
  }, [user?.uid]);


  // Consolidate data fetching for better performance
  useEffect(() => {
    if (!user?.uid) return;

    // Load cached BMI for immediate feedback
    const cachedLast = localStorage.getItem(`lastBmi_${user.uid}`);
    if (cachedLast) setLastBmi(JSON.parse(cachedLast));

    setBmiData(null); // current session result starts empty
    fetchUserData();

    // Re-fetch on focus to keep streaks/data fresh without manual refresh
    const onFocus = () => {
      // Only refresh streaks and dynamic data on focus, not inputs
      const refreshStreaks = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setExerciseStreak(data.exerciseStreak || 0);
          setDietStreak(data.dietStreak || 0);
        }
      };
      refreshStreaks();
    };
    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [user?.uid, fetchUserData, setBmiData]);

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
    localStorage.setItem(`lastBmi_${user.uid}`, JSON.stringify(bmiResult));
    localStorage.setItem('dietType', dietType);

    // Update session log
    await logDailyActivity(user.uid, {
      weight: weightKg.toFixed(1),
      bmi: bmi.toFixed(2),
      category
    });

    try {
      await setDoc(doc(db, 'users', user.uid), {
        height,
        heightUnit,
        weight,
        weightUnit,
        bmi: bmi.toFixed(2),
        category,
        dietType
      }, { merge: true });
    } catch (error) {
      console.error('Error saving BMI to Firestore:', error);
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
    navigate('/diet');
  };

  const goToExercise = async () => {
    navigate('/exercise');
  };

  const handleWaterChange = (amount) => {
    setWaterIntake(prev => Math.max(0, prev + amount));
  };

  const saveWater = async () => {
    if (!user?.uid || updateLoading) return;
    setUpdateLoading(true);
    try {
      await logDailyActivity(user.uid, { waterIntake: waterIntake });
      toast.success("Water intake saved!");
    } catch (err) {
      console.error('Error saving water:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSleepChange = (hours) => {
    setSleepHours(prev => Math.max(0, prev + hours));
  };

  const saveSleep = async () => {
    if (!user?.uid || updateLoading) return;
    setUpdateLoading(true);
    try {
      await logDailyActivity(user.uid, { sleepHours: sleepHours });
      toast.success("Sleep duration saved!");
    } catch (err) {
      console.error('Error saving sleep:', err);
    } finally {
      setUpdateLoading(false);
    }
  };


  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" style={{ height: 28, width: 28 }} />
          <span>NutriTrack</span>
        </div>
        <div className="nav-buttons">
          {/* AI Chatbot button (Health Expert) moved to the left side of the nav group as requested */}
          <button onClick={() => setShowChat(true)} className="nav-pill secondary">🧘‍♀️ Health Expert</button>
          <button onClick={() => navigate('/about')} className="nav-pill secondary">About</button>

          <div className="user-profile-nav" onClick={() => navigate('/profile')}>
            <img
              src={user?.profilePic || 'https://res.cloudinary.com/dh9tzmmzk/image/upload/v1/default_avatar.png'}
              alt="Profile"
              className="nav-avatar"
            />
            <span className="nav-username">{user?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={handleLogout} className="nav-pill danger">Logout</button>
        </div>
      </nav>

      <div className="dashboard-3panel">

        {/* LEFT: Input Form */}
        <div className="glass-box panel input-panel">
          <h1>{lastBmi ? 'Welcome Back,' : 'Welcome,'} {user?.name || 'User'}!</h1>
          <p>{lastBmi ? 'Ready to continue your progress?' : 'Your health journey starts here 💪'}</p>
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

            <button type="submit" className="bmi-calc-btn">Calculate BMI</button>
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
              <p><strong>💧 Water:</strong> {waterIntake} glasses</p>
              <p><strong>😴 Sleep:</strong> {sleepHours} hours</p>

            </>
          ) : (
            <p>After clicking "Calculate BMI", you will see your BMI result, and start your health journey after clicking "Diet Plan" or "Exercise Plan"</p>
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
                <button onClick={goToDiet} className="nav-btn primary">Diet Plan</button>
                <button onClick={goToExercise} className="nav-btn primary">Exercise Plan</button>
              </div>
            </>
          ) : (
            <p>Enter your height and weight to see your BMI</p>
          )}
        </div>
      </div>

      {/* Removed Weekly Progress Tracking sections */}

      <div className="home-trackers-row">
        <div className="glass-box tracker-card" style={{ background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.6), rgba(255, 255, 255, 0.8))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="tracker-header">
            <div style={{ width: 60, height: 60, margin: '0 auto' }}>
              <Lottie animationData={waterAnim} loop={true} />
            </div>
            <h3 style={{ color: '#1e40af' }}>Water Tracker</h3>
          </div>
          <div className="tracker-controls">
            <button onClick={() => handleWaterChange(-1)} className="track-btn" style={{ background: '#3b82f6', color: 'white' }}>-</button>
            <div className="tracker-value">
              <span style={{ color: '#3b82f6' }}>{waterIntake}</span>
              <p>glasses today</p>
            </div>
            <button onClick={() => handleWaterChange(1)} className="track-btn" style={{ background: '#3b82f6', color: 'white' }}>+</button>
          </div>
          <button
            className="save-sleep-btn"
            onClick={saveWater}
            style={{ marginTop: '10px', fontSize: '0.8rem', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '20px', border: 'none', cursor: 'pointer' }}
          >Save</button>
          <div className="tracker-status" style={{ marginTop: '10px', color: '#64748b' }}>Target: 8-10 glasses</div>
        </div>

        <div className="glass-box tracker-card" style={{ background: 'linear-gradient(135deg, rgba(251, 207, 232, 0.4), rgba(255, 255, 255, 0.8))', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
          <div className="tracker-header">
            <div style={{ width: 60, height: 60, margin: '0 auto' }}>
              <Lottie animationData={sleepAnim} loop={true} />
            </div>
            <h3 style={{ color: '#9d174d' }}>Sleep Tracker</h3>
          </div>
          <div className="tracker-controls">
            <button onClick={() => handleSleepChange(-0.5)} className="track-btn" style={{ background: '#ec4899', color: 'white' }}>-</button>
            <div className="tracker-value">
              <span style={{ color: '#ec4899' }}>{sleepHours}</span>
              <p>hours slept</p>
            </div>
            <button onClick={() => handleSleepChange(0.5)} className="track-btn" style={{ background: '#ec4899', color: 'white' }}>+</button>
          </div>
          <button
            className="save-sleep-btn"
            onClick={saveSleep}
            style={{ marginTop: '10px', fontSize: '0.8rem', padding: '6px 12px', background: '#db2777', color: 'white', borderRadius: '20px', border: 'none', cursor: 'pointer' }}
          >Save</button>
          <div className="tracker-status" style={{ marginTop: '10px', color: '#64748b' }}>Target: 7-9 hours</div>
        </div>
      </div>

      <div className="glass-box panel fridge-panel" style={{ maxWidth: '1100px', margin: '20px auto', width: '90%' }}>
        <FridgeSearch user={user} />
      </div>

      {showChat && (
        <HealthChat
          user={user}
          onClose={() => setShowChat(false)}
          summary={{
            bmi: bmiData?.bmi || lastBmi?.bmi,
            category: bmiData?.category || lastBmi?.category,
            dietStreak: dietStreak,
            exerciseStreak: exerciseStreak,
            waterIntake: waterIntake,
            sleepHours: sleepHours
          }}
        />
      )}

      {showHistory && (
        <HistoryModal user={user} onClose={() => setShowHistory(false)} />
      )}
    </div >
  );
};

export default Home;
