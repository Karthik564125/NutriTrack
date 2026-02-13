import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const HealthTrends = ({ user }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) return;
            try {
                const q = query(
                    collection(db, 'progress', user.uid, 'logs'),
                    orderBy('date', 'desc'),
                    limit(7)
                );
                const querySnapshot = await getDocs(q);
                const logs = querySnapshot.docs.map(doc => ({
                    name: doc.data().date.split('-').slice(1).join('/'), // MM/DD
                    weight: parseFloat(doc.data().weight) || null,
                    bmi: parseFloat(doc.data().bmi) || null,
                    fullDate: doc.data().date
                })).reverse();

                // Filter out entries with no weight/bmi for cleaner chart
                const filteredLogs = logs.filter(log => log.weight || log.bmi);
                setData(filteredLogs);
            } catch (error) {
                console.error('Error fetching trend data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.uid]);

    if (loading) return <p>Loading health trends...</p>;
    if (data.length === 0) return <p className="info-text">No weight history found. Calculate your BMI to start tracking trends!</p>;

    return (
        <div className="health-trends-container" style={{ width: '100%', height: 250, marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="name"
                        stroke="#ccc"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#ccc"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1d', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                        itemStyle={{ color: '#00d2ff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line
                        type="monotone"
                        dataKey="bmi"
                        stroke="#00d2ff"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#00d2ff' }}
                        activeDot={{ r: 6 }}
                        name="BMI"
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#51cf66"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#51cf66' }}
                        activeDot={{ r: 6 }}
                        name="Weight (kg)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default HealthTrends;
