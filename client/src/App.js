import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/Auth/AuthPage';
import Home from './pages/Home/Home';
import DietPlan from './pages/Diet/DietPlan';
import ExercisePlan from './pages/Exercise/ExercisePlan';
import Profile from './pages/Profile/Profile';
import About from './pages/About/About';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const App = () => {
  const [user, setUser] = useState(null);
  const [bmiData, setBmiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full profile from Firestore to ensure session is consistent
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const userObj = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData
        };

        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setBmiData(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading-screen">Loading NutriTrack...</div>;
  }

  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
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
        <Route
          path="/profile"
          element={
            user ? (
              <Profile user={user} setUser={setUser} />
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
