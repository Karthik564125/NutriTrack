import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { generateRecipe as generateRecipeService } from '../utils/aiService';

const FridgeSearch = ({ user }) => {
    const [ingredients, setIngredients] = useState('');
    const [recipe, setRecipe] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchSavedRecipe = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const planDoc = await getDoc(doc(db, 'plans', user.uid));
            if (planDoc.exists()) {
                setRecipe(planDoc.data().fridgeRecipe || '');
            }
        } catch (err) {
            console.error('Error fetching recipe:', err);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchSavedRecipe();
    }, [fetchSavedRecipe]);

    const generateRecipe = async (e) => {
        e.preventDefault();
        if (!ingredients.trim()) return;

        setLoading(true);
        setRecipe('');
        setError('');

        try {
            const result = await generateRecipeService(ingredients);
            setRecipe(result);

            // Save to Firestore
            if (user?.uid) {
                await setDoc(doc(db, 'plans', user.uid), {
                    fridgeRecipe: result
                }, { merge: true });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate recipe. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const deleteRecipe = async () => {
        if (!user?.uid || !recipe) return;
        if (!window.confirm("Are you sure you want to clear this saved recipe?")) return;

        try {
            const planRef = doc(db, 'plans', user.uid);
            await updateDoc(planRef, {
                fridgeRecipe: ""
            });
            setRecipe('');
        } catch (err) {
            console.error("Error deleting recipe:", err);
        }
    };

    return (
        <div className="fridge-search-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>🍲 AI Fridge Search</h3>
                {recipe && (
                    <button onClick={deleteRecipe} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Clear Recipe">🗑️</button>
                )}
            </div>
            <p className="subtext">Enter ingredients you have (e.g., Paneer, Palak, Tomato) and get a healthy Indian recipe!</p>

            <form onSubmit={generateRecipe} className="fridge-form">
                <input
                    type="text"
                    placeholder="Enter ingredients..."
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !ingredients.trim()}>
                    {loading ? 'Generating...' : 'Get Recipe ✨'}
                </button>
            </form>

            {error && <p className="error-text">{error}</p>}

            {recipe && (
                <div className="recipe-result glass-box" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(5, 150, 105, 0.1)' }}>
                    <ReactMarkdown>{recipe}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default FridgeSearch;
