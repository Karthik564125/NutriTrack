
/**
 * Helper to call backend AI endpoints.
 */
const callBackendAI = async (endpoint, payload) => {
    try {
        const response = await fetch(`http://localhost:5001${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Backend returned non-JSON response:", text);
            throw new Error("Server returned an invalid response (not JSON)");
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }
        return data.response;
    } catch (err) {
        console.error(`Backend AI Error (${endpoint}):`, err);
        throw err;
    }
};

/**
 * Generates a healthy Indian recipe based on available ingredients.
 */
export const generateRecipe = async (ingredients) => {
    return await callBackendAI('recipe', { ingredients });
};

/**
 * Generates a 7-day Indian diet plan.
 */
export const generateAIDiet = async (bmiCategory, dietType, goal) => {
    return await callBackendAI('diet', { bmiCategory, dietType, goal });
};

/**
 * Generates a 7-day beginner-friendly Indian workout plan.
 */
export const generateAIWorkout = async (bmiCategory) => {
    return await callBackendAI('workout', { bmiCategory });
};

/**
 * Health Q&A Chatbot for Indian context.
 */
export const chatWithAI = async (message, summary) => {
    return await callBackendAI('chat', { message, summary });
};

/**
 * Generates a quick daily health insight.
 */
export const generateDailyInsight = async (userStats) => {
    return await callBackendAI('insight', { userStats });
};
