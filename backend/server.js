import "dotenv/config";
import express from "express";
import cors from "cors";
import { BACKUP_EXERCISES } from './backupData.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ------------------ HEALTH CHECK ------------------
app.get("/health", (req, res) => {
    res.json({ status: "NutriTrack Backend is running" });
});

// ------------------ GEMINI WRAPPER ------------------
const getGeminiResponse = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY missing in .env");
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt + "\n\nIMPORTANT: Use clear Markdown. Format day by day (Day 1, Day 2...). Use tables or bold lists for meals/exercises. Keep it very professional and easy to read." }] }],
            }),
        }
    );

    const data = await response.json();

    // ❌ Gemini API error
    if (!response.ok) {
        console.error("Gemini API Error:", JSON.stringify(data, null, 2));
        throw new Error(data?.error?.message || "Gemini API failed");
    }

    // ❌ Safety block
    if (data.promptFeedback?.blockReason) {
        return "I can help with general wellness tips, but not medical advice.";
    }

    // ❌ Empty / unexpected response
    if (!data.candidates || !data.candidates.length) {
        console.error("Empty Gemini response:", JSON.stringify(data, null, 2));
        return "I couldn’t generate a response right now. Please try again.";
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    return text || "Response generated but empty.";
};

// ------------------ CHAT ------------------
app.post("/chat", async (req, res) => {
    try {
        const message = req.body.message || req.body.question;
        const summary = req.body.summary || {};

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const prompt = `
You are a calm and supportive health assistant.

User stats:
BMI: ${summary.bmi || "N/A"} (${summary.category || "N/A"})
Diet Streak: ${summary.dietStreak || 0} days
Exercise Streak: ${summary.exerciseStreak || 0} days
Water Intake: ${summary.waterIntake || 0} glasses
Sleep: ${summary.sleepHours || 0} hours

User Question: "${message}"

Rules:
- Keep response under 5 sentences
- Be practical and motivating
- No medical diagnosis
- Use simple language
`;

        const reply = await getGeminiResponse(prompt);
        res.json({ response: reply });

    } catch (err) {
        console.error("CHAT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ DIET PLAN ------------------
app.post("/diet", async (req, res) => {
    try {
        const { bmiCategory = "Healthy", dietType = "veg", goal = "Fitness" } = req.body;

        const prompt = `
Create a structured 7-day Indian ${dietType} diet plan.
BMI Category: ${bmiCategory}
Goal: ${goal}

Rules:
- Format exactly day by day (Day 1, Day 2...).
- For each day, provide: Breakfast, Lunch, Evening Snack, and Dinner.
- Use a clear Markdown table for each day or a very clean bold list.
- Keep meals simple and practical for an Indian household.
- No medical claims.
`;

        const reply = await getGeminiResponse(prompt);
        res.json({ response: reply });

    } catch (err) {
        console.error("DIET ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ WORKOUT PLAN ------------------
app.post("/workout", async (req, res) => {
    try {
        const { bmiCategory = "Healthy" } = req.body;

        const prompt = `
Create a structured beginner-friendly 7-day workout plan.
BMI Category: ${bmiCategory}

Rules:
- Format exactly day by day (Day 1, Day 2...).
- For each day, list exercises, sets, and reps.
- Use a clear Markdown table or bold list.
- Include rest days/active recovery.
- Bodyweight exercises focus.
`;

        const reply = await getGeminiResponse(prompt);
        res.json({ response: reply });

    } catch (err) {
        console.error("WORKOUT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ RECIPE (AI FRIDGE) ------------------
app.post("/recipe", async (req, res) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ error: "Ingredients required" });
        }

        const prompt = `
Suggest ONE healthy Indian recipe using ONLY these ingredients:
${ingredients}

Format:
- Recipe Name
- Ingredients
- Short Instructions
`;

        const reply = await getGeminiResponse(prompt);
        res.json({ response: reply });

    } catch (err) {
        console.error("RECIPE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ DAILY INSIGHT ------------------
app.post("/insight", async (req, res) => {
    try {
        const { streak = 0, goal = "General Health" } = req.body;

        const prompt = `
Give ONE short motivational insight (max 15 words).
Streak: ${streak}
Goal: ${goal}
`;

        const reply = await getGeminiResponse(prompt);
        res.json({ response: reply });

    } catch (err) {
        console.error("INSIGHT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ WORKOUT PLAN ENGINE (ExerciseDB) ------------------
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';

const MET_VALUES = {
    'Full Body': 5.0,
    'Cardio': 7.0,
    'HIIT': 8.5,
    'Upper Body': 5.0,
    'Lower Body': 5.5,
    'Core': 4.0,
    'Yoga': 3.0,
    'Push': 6.0,
    'Pull': 6.0,
    'Legs': 6.5,
    'Strength': 6.0,
    'Metabolic': 7.5
};

const PLAN_LOGIC = {
    fat_loss: {
        beginner: { days: 4, duration: 40, intensity: 'low', split: ['Full Body', 'Cardio', 'Full Body', 'Cardio'], focus: 'calorie burn, habit building', targets: ['abs', 'quads', 'cardio'] },
        normal: { days: 5, duration: 60, intensity: 'moderate', split: ['Upper Body', 'Lower Body', 'HIIT', 'Upper Body', 'Core'], focus: 'fat loss + muscle retention', targets: ['chest', 'lats', 'abs', 'quads'] },
        pro: { days: 6, duration: 75, intensity: 'high', split: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'], focus: 'aggressive fat loss', targets: ['chest', 'lats', 'delts', 'triceps', 'quads'] }
    },
    muscle_gain: {
        beginner: { days: 4, duration: 50, intensity: 'moderate', split: ['Upper', 'Lower', 'Rest', 'Full Body'], focus: 'form, activation', targets: ['chest', 'lats', 'quads'] },
        normal: { days: 5, duration: 60, intensity: 'moderate', split: ['Chest + Triceps', 'Back + Biceps', 'Legs', 'Shoulders', 'Core'], focus: 'hypertrophy', targets: ['chest', 'lats', 'triceps', 'biceps', 'quads', 'abs'] },
        pro: { days: 6, duration: 90, intensity: 'high', split: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'], focus: 'maximum volume & overload', targets: ['chest', 'lats', 'delts', 'triceps', 'biceps', 'quads', 'hamstrings'] }
    },
    body_recomposition: {
        beginner: { days: 4, duration: 45, intensity: 'moderate', split: ['Full Body', 'Full Body', 'Full Body', 'Cardio'], focus: 'Fat loss without muscle loss', targets: ['abs', 'quads', 'chest', 'lats'] },
        normal: { days: 5, duration: 60, intensity: 'moderate', split: ['Upper', 'Lower', 'HIIT', 'Upper', 'Core'], focus: 'Strength + conditioning', targets: ['chest', 'lats', 'abs', 'quads', 'cardio'] },
        pro: { days: 6, duration: 75, intensity: 'high', split: ['Push', 'Pull', 'Legs', 'Conditioning', 'Push', 'Pull'], focus: 'Maintain muscle, drop fat', targets: ['chest', 'lats', 'delts', 'quads', 'hamstrings'] }
    }
};

const fetchExercisesFromDB = async (target) => {
    try {
        console.log(`📡 Fetching exercises for: ${target}...`);
        const endpoint = target === 'cardio' ? 'bodyPart/cardio' : `target/${target}`;

        const response = await fetch(`https://${RAPIDAPI_HOST}/exercises/${endpoint}?limit=10`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
        });

        if (!response.ok) {
            console.error(`⚠️ ExerciseDB API Error [${target}]: ${response.status} ${response.statusText}`);
            // Fallback
            const fallback = BACKUP_EXERCISES[target] || BACKUP_EXERCISES['cardio'];
            console.log(`✅ Using fallback data for ${target}`);
            return fallback;
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Network/Server Error [${target}]:`, error.message);
        const fallback = BACKUP_EXERCISES[target] || BACKUP_EXERCISES['cardio'];
        return fallback;
    }
};

app.post("/exercise-plan", async (req, res) => {
    console.log("🚀 Received Exercise Plan Request:", req.body);
    try {
        const { goal, level, weightKg = 70 } = req.body;
        const logic = PLAN_LOGIC[goal]?.[level];

        if (!logic) {
            return res.status(400).json({ error: "Invalid goal or level" });
        }

        // Fetch exercises in parallel
        const exercisePromises = logic.targets.map(target => fetchExercisesFromDB(target));
        const results = await Promise.all(exercisePromises);
        let allExercises = results.flat();

        // Unique exercises
        allExercises = Array.from(new Map(allExercises.map(ex => [ex.id, ex])).values());

        // Select a subset (e.g., 8 exercises) and force HTTPS on gifUrl
        const selectedExercises = allExercises.slice(0, 8).map(ex => ({
            ...ex,
            gifUrl: ex.gifUrl ? ex.gifUrl.replace('http://', 'https://') : null
        }));

        // Calculate calories
        const avgMET = logic.split.reduce((acc, current) => acc + (MET_VALUES[current] || 5.0), 0) / logic.split.length;
        const caloriesPerSession = Math.round(avgMET * weightKg * logic.duration * 0.0175);

        if (selectedExercises.length > 0) {
            console.log("📝 First Exercise Object:", JSON.stringify(selectedExercises[0], null, 2));
        }

        const responseData = {
            goal,
            level,
            daysPerWeek: logic.days,
            sessionDuration: `${logic.duration} min`,
            intensity: logic.intensity,
            workoutSplit: logic.split,
            focusAreas: logic.focus,
            exercises: selectedExercises,
            estimatedCaloriesBurned: caloriesPerSession
        };

        res.json(responseData);

    } catch (err) {
        console.error("EXERCISE PLAN ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
    console.log(`✅ NutriTrack backend running on port ${PORT}`);
});
