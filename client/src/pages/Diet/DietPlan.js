import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import './DietPlan.css';
import { calculateNutrients, generateStaticDietPlan } from '../../utils/dietPlanGenerator';

// Data
import foodAnim from '../../assets/food.json';

const DietPlan = ({ user }) => {
  const navigate = useNavigate();
  const assetMap = { foodAnim };

  const [savedPlan, setSavedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [showCalcModal, setShowCalcModal] = useState(false);

  // Calorie Calc States
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('sedentary');
  const [goal, setGoal] = useState('fatloss');
  const [dietPreference, setDietPreference] = useState('vegetarian');
  const [healthConditions, setHealthConditions] = useState([]);

  const modalInputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.95rem',
    color: '#334155',
    fontWeight: '500',
    outline: 'none',
    transition: '0.2s'
  };

  const fetchUserData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCategory(data.category || 'Healthy');

        // Populate inputs from healthMetrics or directly from user data (e.g. from Home page)
        setWeight(data.healthMetrics?.weight || data.weight || '');
        setHeight(data.healthMetrics?.height || data.height || '');
        setAge(data.healthMetrics?.age || data.age || '');
        setGender(data.healthMetrics?.gender || data.gender || 'male');
        setActivity(data.healthMetrics?.activity || data.activity || 'sedentary');
        setGoal(data.healthMetrics?.goal || data.goal || 'fatloss');

        // Handle diet preference mapping (veg -> vegetarian, non-veg -> non-vegetarian)
        let pref = data.healthMetrics?.dietPreference || data.dietType || 'vegetarian';
        if (pref === 'veg') pref = 'vegetarian';
        if (pref === 'non-veg') pref = 'non-vegetarian';
        setDietPreference(pref);

        setHealthConditions(data.healthMetrics?.healthConditions || []);
      }

      // Also fetch saved plan
      const planDoc = await getDoc(doc(db, 'plans', user.uid));
      if (planDoc.exists()) {
        const pData = planDoc.data();
        setSavedPlan(pData.dietPlan || null);
      }
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchUserData();
    }
  }, [user, fetchUserData]);




  const handleConditionToggle = (condition) => {
    setHealthConditions(prev => {
      if (condition === 'None') return ['None'];
      const filtered = prev.filter(c => c !== 'None');
      return filtered.includes(condition)
        ? filtered.filter(c => c !== condition)
        : [...filtered, condition];
    });
  };

  const startDietPlan = async () => {
    if (!weight || !height || !age) {
      alert("Please fill in Weight, Height, and Age");
      return;
    }

    setLoading(true);
    try {
      const nutrientResults = calculateNutrients({
        weight, height, age, gender, activity, goal
      });

      const generatedPlan = generateStaticDietPlan(
        { goal, dietPreference, healthConditions, activityLevel: activity },
        nutrientResults
      );

      setSavedPlan(generatedPlan);

      // Save to Firestore
      if (user?.uid) {
        // Update user health metrics
        await updateDoc(doc(db, 'users', user.uid), {
          healthMetrics: {
            weight, height, age, gender, activity, goal, dietPreference, healthConditions
          },
          dailyTarget: nutrientResults.finalCalories,
          macros: nutrientResults.macros
        });

        // Save plan details
        await setDoc(doc(db, 'plans', user.uid), {
          dietPlan: generatedPlan,
          nutrients: nutrientResults,
          updatedAt: new Date().toISOString()
        });
      }

      setShowCalcModal(false);
    } catch (error) {
      console.error("Error generating diet plan:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic daily content
  const getDailyFocus = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[new Date().getDay()];

    const themes = {
      Monday: { focus: "High Protein", tip: "Focus on your protein intake today." },
      Tuesday: { focus: "Fiber Rich", tip: "Include more fiber in your meals." },
      Wednesday: { focus: "Hydration Focus", tip: "Keep yourself hydrated throughout the day." },
      Thursday: { focus: "Light Dinner", tip: "Have a light dinner for better sleep." },
      Friday: { focus: "Probiotics", tip: "Include curd or probiotics in your diet." },
      Saturday: { focus: "Fruits & Nuts", tip: "Snack on fruits and nuts today." },
      Sunday: { focus: "Controlled Cheat Meal", tip: "Enjoy your cheat meal, but keep it controlled." }
    };
    return themes[dayName] || themes.Monday;
  };

  const dailyContent = getDailyFocus();

  return (
    <div className="diet-wrapper">
      <nav className="navbar">
        <div className="logo">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" style={{ height: 28, width: 28 }} />
          <span>NutriTrack</span>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/home')} className="nav-pill secondary">Back to BMI</button>
        </div>
      </nav>

      <div className="plan-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Row 1: Hero Section */}
        <div className="glass-box hero-section" style={{
          padding: '3rem',
          background: 'linear-gradient(120deg, rgba(255,255,255,0.9), rgba(236,253,245,0.8))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="hero-content" style={{ zIndex: 2, maxWidth: '600px' }}>
            <div style={{ display: 'inline-block', padding: '6px 12px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
              BMI Category: {category}
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>Expert Nutrition Plan</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Your personalized roadmap to health. Based on your BMI, we’ve curated a sustainable diet path for you.
            </p>
            <div className="hero-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start' }}>
              {!savedPlan && (
                <div style={{ fontSize: '0.85rem', color: '#166534', background: '#dcfce7', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>
                  First calculate calories to start a diet plan
                </div>
              )}
              <button onClick={() => setShowCalcModal(true)} className="btn-primary" style={{ padding: '12px 24px' }}>
                {savedPlan ? 'Update Diet Plan' : 'Calculate Calories'}
              </button>
            </div>
          </div>
          <div className="hero-visual" style={{ width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lottie animationData={assetMap.foodAnim} loop={true} />
          </div>
        </div>

        {/* Row 2: Status Cards Grid */}
        <div className="status-grid">
          {/* Card: Calorie Target Display */}
          <div className="glass-box" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f0fdf4', border: '1px solid #d1fae5', minHeight: '120px' }}>
            {savedPlan?.macroBreakdown ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600, marginBottom: '2px' }}>DAILY TARGET</p>
                <h2 style={{ fontSize: '2rem', color: '#059669', margin: 0 }}>{savedPlan.calorieBreakdown.finalCalories} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>kcal</span></h2>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '5px', fontSize: '0.8rem', color: '#475569' }}>
                  <span>P: {savedPlan.macroBreakdown.protein}</span>
                  <span>C: {savedPlan.macroBreakdown.carbs}</span>
                  <span>F: {savedPlan.macroBreakdown.fats}</span>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>Calculate to see target</p>
            )}
          </div>
        </div>

        {/* Row 3: Massive Food Database Selection Selection */}
        <div className="food-guide-section">
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🥗</span> Massive Food Database
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

            {/* Proteins */}
            <div className="glass-box" style={{ padding: '1.5rem', borderTop: '4px solid #10b981' }}>
              <h4 style={{ color: '#047857', marginBottom: '1rem', fontSize: '1rem' }}>⚡ Protein Sources</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '10px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>VEGETARIAN</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Paneer (low-fat), Tofu, Soy chunks, Curd, Greek yogurt, Skim milk, Moong/Masoor/Toor/Chana Dal, Rajma, Chickpeas, Black chana, Sprouts, Peanuts.
                  </p>
                </div>
                <div style={{ padding: '10px', background: '#fff1f2', borderRadius: '10px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#be123c' }}>NON-VEGETARIAN</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Egg whites, Whole eggs, Chicken breast, lean Chicken thigh, Fish (Rohu, Katla, Salmon, Sardine, Mackerel), Prawns, Turkey.
                  </p>
                </div>
              </div>
            </div>

            {/* Carbs */}
            <div className="glass-box" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
              <h4 style={{ color: '#1d4ed8', marginBottom: '1rem', fontSize: '1rem' }}>🌾 Carbohydrates (Complex)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {["Oats", "Barley", "Ragi", "Jowar", "Bajra", "Brown/Red Rice", "Sweet Potato", "Quinoa", "Millets"].map(item => (
                  <span key={item} style={{ padding: '4px 10px', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.8rem', color: '#1e40af', border: '1px solid #dbeafe' }}>{item}</span>
                ))}
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                <strong>Fruits:</strong> Apple, Guava, Pear, Papaya, Orange, Kiwi, Pomegranate, Berries.
              </p>
            </div>

            {/* Fats & Veggies */}
            <div className="glass-box" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
              <h4 style={{ color: '#b45309', marginBottom: '1rem', fontSize: '1rem' }}>🥜 Fats & Vegetables</h4>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                <p><strong>Healthy Fats:</strong> Almonds, Walnuts, Flax/Chia/Pumpkin seeds, Olive/Groundnut oil, Ghee (1 tsp max).</p>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '10px 0' }}></div>
                <p><strong>Vegetables:</strong> Spinach, Methi, Bottle/Ridge/Snake Gourd, Pumpkin, Carrot, Beans, Okra, Tomato, Onion.</p>
              </div>
            </div>

            {/* Rules Engine */}
            <div className="glass-box" style={{ padding: '1.5rem', borderTop: '4px solid #ef4444' }}>
              <h4 style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '1rem' }}>🚨 Condition Rules</h4>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '8px' }}>
                  <strong>BP:</strong> Salt &lt; 5g, No pickles/papads. High Beetroot/Banana.
                </div>
                <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '8px' }}>
                  <strong>Sugar:</strong> No white rice/juice. High millets/leafy greens.
                </div>
                <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '8px' }}>
                  <strong>Cholesterol:</strong> No red meat/butter. Egg yolk &lt; 3/week.
                </div>
                <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '8px' }}>
                  <strong>Thyroid:</strong> Limit raw cabbage/cauliflower/soy. High eggs/selenium.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Row 4: Static Diet Plan Display */}
        {savedPlan && typeof savedPlan === 'object' && savedPlan.mealPlan && (
          <div className="diet-plan-display" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-box" style={{ padding: '2rem' }}>
              <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🍽️ Daily Meal Plan</h3>
              <div className="meal-slots" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedPlan.mealPlan && Object.entries(savedPlan.mealPlan).map(([meal, content]) => (
                  <div key={meal} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ textTransform: 'capitalize', fontSize: '0.9rem', color: '#059669', marginBottom: '4px' }}>{meal}</h4>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#334155' }}>{content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-box" style={{ padding: '1.5rem', borderLeft: '4px solid #059669' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#064e3b' }}>📅 Weekly Focus: {dailyContent.focus}</h4>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{dailyContent.tip}</p>
              </div>

              {savedPlan.customWarnings && savedPlan.customWarnings.length > 0 && (
                <div className="glass-box" style={{ padding: '1.5rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#92400e' }}>⚠️ Health Considerations</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#92400e' }}>
                    {savedPlan.customWarnings.map((w, idx) => <li key={idx} style={{ marginBottom: '5px' }}>{w}</li>)}
                  </ul>
                </div>
              )}

              {savedPlan.summary && (
                <div className="glass-box" style={{ padding: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#475569' }}>📋 User Summary</h4>
                  <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <p style={{ margin: 0 }}><strong>Goal:</strong> <span style={{ textTransform: 'capitalize' }}>{savedPlan.summary.goal}</span></p>
                    <p style={{ margin: 0 }}><strong>Diet:</strong> <span style={{ textTransform: 'capitalize' }}>{savedPlan.summary.dietPreference}</span></p>
                    <p style={{ margin: 0 }}><strong>Activity:</strong> <span style={{ textTransform: 'capitalize' }}>{savedPlan.summary.activityLevel}</span></p>
                    <p style={{ margin: 0 }}><strong>Health:</strong> {(!savedPlan.summary.healthConditions || savedPlan.summary.healthConditions.length === 0 || savedPlan.summary.healthConditions.includes('None')) ? 'No issues' : savedPlan.summary.healthConditions.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>


      {showCalcModal && (
        <div className="workout-modal-overlay">
          <div className="workout-modal-content glass-box" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                📊 Start Diet Plan
              </h2>
              <button className="close-btn" onClick={() => setShowCalcModal(false)}>×</button>
            </div>

            <div className="calc-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Basic Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>WEIGHT (KG)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" style={modalInputStyle} />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>HEIGHT (CM)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" style={modalInputStyle} />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>AGE (YRS)</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="0" style={modalInputStyle} />
                </div>
              </div>

              {/* Selections Group 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>GENDER</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={modalInputStyle}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>GOAL TYPE</label>
                  <select value={goal} onChange={(e) => setGoal(e.target.value)} style={modalInputStyle}>
                    <option value="fatloss">Fat Loss</option>
                    <option value="recomp">Body Recomposition</option>
                    <option value="muscle">Muscle Gain</option>
                  </select>
                </div>
              </div>

              {/* Selections Group 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>ACTIVITY LEVEL</label>
                  <select value={activity} onChange={(e) => setActivity(e.target.value)} style={modalInputStyle}>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Lightly Active</option>
                    <option value="moderate">Moderately Active</option>
                    <option value="veryActive">Very Active</option>
                    <option value="athlete">Athlete</option>
                  </select>
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block' }}>DIET PREFERENCE</label>
                  <select value={dietPreference} onChange={(e) => setDietPreference(e.target.value)} style={modalInputStyle}>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Health Conditions Multi-Select */}
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'block' }}>HEALTH CONDITIONS</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['None', 'BP', 'Sugar', 'Cholesterol', 'Thyroid'].map((cond) => (
                    <button
                      key={cond}
                      onClick={() => handleConditionToggle(cond)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: healthConditions.includes(cond) ? '#059669' : '#e2e8f0',
                        background: healthConditions.includes(cond) ? '#ecfdf5' : '#fff',
                        color: healthConditions.includes(cond) ? '#059669' : '#64748b',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startDietPlan}
                className="nav-pill primary"
                style={{ width: '100%', padding: '14px', marginTop: '10px', justifyContent: 'center', borderRadius: '12px', fontSize: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Calculations...' : 'Generate My Diet Plan'}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietPlan;
