import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { toast } from 'react-toastify';
import HistoryModal from '../../components/HistoryModal';
import './profile.css';

const Profile = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [newProfilePic, setNewProfilePic] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.uid) return;
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    const handleFileChange = (e) => {
        setNewProfilePic(e.target.files[0]);
    };

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

    const handleUpdateAvatar = async () => {
        if (!newProfilePic) return;
        setUploading(true);
        try {
            const url = await uploadToCloudinary(newProfilePic);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { profilePic: url });

            const updatedUser = { ...userData, profilePic: url };
            setUserData(updatedUser);
            setUser(updatedUser); // Update global state
            localStorage.setItem('user', JSON.stringify({ ...user, profilePic: url }));

            toast.success("Profile picture updated!");
            setNewProfilePic(null);
        } catch (error) {
            toast.error(`Update failed: ${error.message}`);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you absolutely sure? This will permanently delete your data.")) {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) return;

                // 1. Delete Firestore data
                await deleteDoc(doc(db, 'users', user.uid));

                // 2. Delete Auth account
                await deleteUser(currentUser);

                // 3. Clear local state
                localStorage.removeItem('user');
                setUser(null);
                toast.info("Account deleted successfully.");
                navigate('/');
            } catch (error) {
                console.error("Delete Error:", error);
                toast.error("Please re-login to delete your account for security reasons.");
            }
        }
    };

    if (loading) return <div className="loading-screen"><h2>Loading Profile...</h2></div>;

    return (
        <div className="profile-wrapper">
            <nav className="navbar">
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={process.env.PUBLIC_URL + '/logo.png'} alt="NutriTrack" style={{ height: 24, width: 24 }} />
                    <span>NutriTrack</span>
                </div>
                <div className="nav-buttons">
                    <button onClick={() => navigate('/home')} className="nav-btn">Dashboard</button>
                </div>
            </nav>

            {/* Main Content Grid */}
            <div className="profile-container" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) 2fr', /* Sidebar and Main Content */
                gap: '2.5rem',
                alignItems: 'start'
            }}>

                {/* Left Sidebar: Minimal Identity & Actions */}
                <div className="glass-box profile-card" style={{ padding: '3rem 2rem', height: 'auto', textAlign: 'center' }}>
                    <div className="avatar-section" style={{ marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', width: '160px', margin: '0 auto' }}>
                            <img
                                src={userData?.profilePic || 'https://res.cloudinary.com/dh9tzmmzk/image/upload/v1/default_avatar.png'}
                                alt="Profile"
                                className="profile-large-avatar"
                                style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                            />
                            {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Uploading...</div>}
                        </div>

                        <h2 style={{ fontSize: '1.8rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>{userData?.name || 'User'}</h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{userData?.email || 'email@example.com'}</p>

                        <div className="avatar-controls" style={{ marginTop: '1.5rem' }}>
                            <input type="file" accept="image/*" onChange={handleFileChange} id="avatar-input" hidden />
                            <label htmlFor="avatar-input" className="nav-btn secondary" style={{ fontSize: '0.9rem', padding: '8px 20px', borderRadius: '20px' }}>
                                📷 Change Photo
                            </label>
                            {newProfilePic && (
                                <button onClick={handleUpdateAvatar} className="nav-btn primary" style={{ width: '100%', marginTop: '10px' }}>
                                    Save New Photo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="profile-actions" style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={() => setShowHistory(true)} className="nav-btn primary" style={{ width: '100%' }}>
                            📜 View History
                        </button>
                        <button onClick={handleDeleteAccount} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, padding: '10px' }}>
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Right Column: Details & Stats */}
                <div className="profile-stats-col" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 1. Health Overview */}
                    <div className="glass-box" style={{ padding: '2.5rem' }}>
                        <h3 style={{ color: '#059669', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.5rem' }}>📊</span> Current Health Status
                        </h3>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                            <div className="stat-item" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0', transition: 'transform 0.2s' }}>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>BMI Score</p>
                                <h4 style={{ fontSize: '2.5rem', margin: 0, color: '#0f172a', fontWeight: 800 }}>{userData?.bmi || '--'}</h4>
                            </div>
                            <div className="stat-item" style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                <p style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Target Calories</p>
                                <h4 style={{ fontSize: '2.5rem', margin: 0, color: '#15803d', fontWeight: 800 }}>{userData?.dailyTarget || '--'} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kcal</span></h4>
                            </div>
                            <div className="stat-item" style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                                <p style={{ fontSize: '0.9rem', color: '#1e40af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Workouts</p>
                                <h4 style={{ fontSize: '2.5rem', margin: 0, color: '#1d4ed8', fontWeight: 800 }}>{userData?.exerciseStreak || 0} <span style={{ fontSize: '1.5rem' }}>💪</span></h4>
                            </div>
                        </div>
                    </div>

                    {/* 2. Personal Information Card */}
                    <div className="glass-box" style={{ padding: '2.5rem' }}>
                        <h3 style={{ color: '#059669', marginBottom: '1.5rem' }}>👤 Personal Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Full Name</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 500, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{userData?.name || 'User'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Email Address</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 500, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData?.email || 'email@example.com'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Joined On</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 500, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Fitness Goal</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#059669', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textTransform: 'capitalize' }}>
                                    {userData?.fitnessGoal ? userData.fitnessGoal.replace('fatloss', 'Fat Loss').replace('recomp', 'Recomposition').replace('muscle', 'Muscle Gain') : 'Not Set'}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Render History Modal conditional on showHistory state */}
            {console.log("Show History State:", showHistory)}
            {showHistory && <HistoryModal user={user} onClose={() => setShowHistory(false)} />}


        </div>
    );
};

export default Profile;
