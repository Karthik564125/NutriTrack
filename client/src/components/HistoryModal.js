import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

const HistoryModal = ({ user, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user?.uid) return;
            try {
                const q = query(
                    collection(db, 'progress', user.uid, 'logs'),
                    orderBy('date', 'desc'),
                    limit(30)
                );
                const querySnapshot = await getDocs(q);
                setLogs(querySnapshot.docs.map(doc => doc.data()));
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user?.uid]);

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-box history-modal">
                <div className="modal-header">
                    <h2>📅 Your Health Diary</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <p>Loading your history...</p>
                    ) : logs.length === 0 ? (
                        <p>No logged activities yet. Start tracking today!</p>
                    ) : (
                        <div className="history-list">
                            {logs.map((log, index) => (
                                <div key={index} className="history-item">
                                    <div className="history-date">
                                        {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="history-details">
                                        {log.weight && <span>⚖️ {log.weight}kg</span>}
                                        {log.bmi && <span>📊 BMI: {log.bmi}</span>}
                                        {log.waterIntake > 0 && <span>💧 {log.waterIntake} glasses</span>}
                                        {log.dietDone && <span className="tag diet">🥗 Diet Hit</span>}
                                        {log.exerciseDone && <span className="tag exercise">💪 Workout Hit</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
