import React, { useState } from 'react';
import { auth, db } from '../../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './auth.css';

const AuthPage = ({ setUser }) => {
  const [form, setForm] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = e => setProfilePic(e.target.files[0]);

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'nutritrack_unsigned');
    data.append('cloud_name', 'dldka8mza');
    data.append('folder', 'nutritrack/uploads');

    const res = await fetch('https://api.cloudinary.com/v1_1/dldka8mza/image/upload', {
      method: 'POST',
      body: data,
    });

    const result = await res.json();
    if (!res.ok) {
      console.error('Cloudinary Error Details:', result);
      throw new Error(result.error?.message || 'Cloudinary upload failed');
    }
    return result.secure_url;
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Relaxed for testing, user can use gmail
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{7,}$/;

    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 7 characters, contain one uppercase letter and one special character.');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form === 'signup' && !validateInputs()) return;

    try {
      if (form === 'login') {
        // Firebase Login
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;

        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const userObj = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData
        };

        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        toast.success(`Welcome back, ${userData.name || 'User'}!`);
        navigate('/home');
      } else {
        // Firebase Signup
        setUploading(true);
        let profilePicUrl = '';
        if (profilePic) {
          try {
            profilePicUrl = await uploadToCloudinary(profilePic);
          } catch (uploadErr) {
            console.error('Image Upload Error:', uploadErr);
            toast.warn('Profile picture failed to upload (Check Cloudinary Preset). Proceeding without image...');
            profilePicUrl = ''; // Fallback
          }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          name: formData.name,
          email: formData.email,
          dob: formData.dob,
          gender: formData.gender,
          profilePic: profilePicUrl,
          height: null,
          weight: null,
          bmi: null,
          streak: 0,
          createdAt: new Date().toISOString()
        });

        toast.success(`Welcome, ${formData.name}! Your journey begins now. Please login.`);
        setForm('login');
      }
    } catch (err) {
      console.error(err);
      let message = 'Operation failed. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Email already in use.';
      }
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };



  return (
    <div className="auth-wrapper">

      {true ? (
        <div className="auth-container auth-grid" style={{ background: '#f8fafc', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
          <div className="hero-box animated-fade" style={{ background: 'transparent' }}>
            <div className="hero-head">
              <img className="hero-logo" src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" />
              <div>
                <h2 className="hero-title">NutriTrack</h2>
                <p className="hero-sub" style={{ fontSize: '1.2rem', marginTop: '10px' }}>Your Personal AI Health Companion</p>
              </div>
            </div>

            <div className="hero-features" style={{ marginTop: '3rem' }}>
              <p className="hero-desc">Easy to use and navigate</p>
              <p className="hero-desc">Motivating streaks & progress</p>
              <p className="hero-desc">Quick AI health tips</p>
              <p className="hero-desc">Easy recipes for busy schedules</p>
              <p className="hero-desc">Start your journey today</p>
            </div>
          </div>

          <div className="auth-card animated-fade">
            <div className={`flip-card-inner ${form === 'signup' ? 'flipped' : ''}`}>

              {/* Login Face */}
              <div className="flip-face flip-login">
                <h2 style={{ fontWeight: 800 }}>Welcome Back</h2>
                <form onSubmit={handleSubmit} style={{ gap: '1rem' }}>
                  <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} value={formData.email} />
                  <div className="password-wrapper">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" required onChange={handleChange} value={formData.password} />
                    <span className="password-toggle-btn" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? '🙈' : '👁️'}</span>
                  </div>
                  <button type="submit">Sign In</button>
                </form>
                <p className="switch-link" onClick={() => setForm('signup')} tabIndex={0} role="button">New here? Create Account</p>
              </div>

              {/* Signup Face */}
              <div className="flip-face flip-signup">
                <h2 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Create Account</h2>
                <form onSubmit={handleSubmit} style={{ gap: '0.8rem' }}>
                  <input name="name" placeholder="Full Name" required onChange={handleChange} value={formData.name} />
                  <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} value={formData.email} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input name="dob" type="date" required onChange={handleChange} value={formData.dob} />
                    <select name="gender" required onChange={handleChange} value={formData.gender}>
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>



                  <div className="password-wrapper">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Create Password" required onChange={handleChange} value={formData.password} />
                    <span className="password-toggle-btn" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? '🙈' : '👁️'}</span>
                  </div>

                  <div className="file-input-wrapper" style={{ marginTop: '5px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>Profile Picture (Optional)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: '10px', background: '#f8fafc' }} />
                  </div>

                  <button type="submit" disabled={uploading}>
                    {uploading ? 'Setting up Profile...' : 'Start Journey 🚀'}
                  </button>
                </form>
                <p className="switch-link" onClick={() => setForm('login')} tabIndex={0} role="button">Already have an account? Login</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="about-container glass-box animated-fade">
        </div>
      )}


    </div>
  );
};

export default AuthPage;