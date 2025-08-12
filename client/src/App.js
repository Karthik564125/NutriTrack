import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/auth';
import Home from './pages/Home';
import DietPlan from './pages/DietPlan';
import ExercisePlan from './pages/ExercisePlan';
import About from './pages/About';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [bmiData, setBmiData] = useState(null); // 🧠 BMI state tied to user

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored || stored === 'undefined' || stored === 'null') {
      localStorage.removeItem('user');
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch (e) {
      localStorage.removeItem('user');
    }
  }, []);

  // Removed global BMI reset on user change to avoid clearing after fetch

  const handleLogout = () => {
    setUser(null);
    setBmiData(null); // 🔐 Clear BMI on logout
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <AuthPage setUser={setUser} />} />
        <Route
          path="/home"
          element={
            user ? (
              <Home user={user} setUser={setUser} bmiData={bmiData} setBmiData={setBmiData} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/diet"
          element={
            user ? (
              <DietPlan user={user} setUser={setUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/exercise"
          element={
            user ? (
              <ExercisePlan user={user} setUser={setUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
};

export default App;
