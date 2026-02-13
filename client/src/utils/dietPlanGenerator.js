
export const calculateNutrients = (data) => {
    const { weight, height, age, gender, activity, goal } = data;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    // 1. Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (gender === 'male') {
        bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
        bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }

    // 2. Apply Activity Multiplier
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        veryActive: 1.725,
        athlete: 1.9
    };
    const multiplier = activityMultipliers[activity] || 1.2;
    const tdee = bmr * multiplier;

    // 3. Adjust Calories by Goal
    let targetCalories = tdee;
    if (goal === 'fatloss') targetCalories = tdee * 0.8; // Fat Loss -> TDEE - 20%
    else if (goal === 'muscle') targetCalories = tdee * 1.15; // Muscle Gain -> TDEE + 15%
    // Recomposition -> TDEE (maintenance)

    // 4. Round to nearest 50 kcal
    const finalCalories = Math.round(targetCalories / 50) * 50;

    // 5. Macro Distribution Rules
    let macros = { protein: 0, carbs: 0, fats: 0, pPct: 0, cPct: 0, fPct: 0 };

    if (goal === 'fatloss') {
        // Protein: 30–35%, Carbs: 35–40%, Fats: 25–30%
        macros.pPct = 33;
        macros.cPct = 37;
        macros.fPct = 30;
    } else if (goal === 'muscle') {
        // Protein: 25–30%, Carbs: 45–55%, Fats: 20–25%
        macros.pPct = 28;
        macros.cPct = 50;
        macros.fPct = 22;
    } else {
        // Recomposition: Protein: 25–30%, Carbs: 40–45%, Fats: 25–30%
        macros.pPct = 28;
        macros.cPct = 42;
        macros.fPct = 30;
    }

    macros.protein = Math.round((finalCalories * (macros.pPct / 100)) / 4);
    macros.carbs = Math.round((finalCalories * (macros.cPct / 100)) / 4);
    macros.fats = Math.round((finalCalories * (macros.fPct / 100)) / 9);

    return {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        finalCalories,
        macros
    };
};

export const generateStaticDietPlan = (userData, nutrients) => {
    const { goal, dietPreference, healthConditions, activityLevel } = userData;
    const isVeg = dietPreference === 'vegetarian';
    const isNonVeg = dietPreference === 'non-vegetarian';
    const conditions = healthConditions || [];

    const db = {
        vegProtein: ["Paneer (low-fat)", "Tofu", "Soy chunks", "Curd", "Greek yogurt", "Skim milk", "Moong dal", "Masoor dal", "Toor dal", "Chana dal", "Rajma", "Chickpeas", "Black chana", "Sprouts", "Peanuts"],
        nonVegProtein: ["Egg whites", "Whole eggs", "Chicken breast", "Chicken thigh", "Fish (Rohu/Katla/Salmon)", "Prawns", "Turkey"],
        carbs: ["Oats", "Barley", "Ragi", "Jowar", "Bajra", "Foxtail millet", "Brown rice", "Sweet potato", "Quinoa"],
        vegTab: ["Spinach", "Methi", "Bottle gourd", "Ridge gourd", "Pumpkin", "Carrot", "Beans", "Okra", "Tomato", "Onion"],
        fruits: ["Apple", "Guava", "Pear", "Papaya", "Orange", "Kiwi", "Pomegranate", "Banana"],
        fats: ["Almonds", "Walnuts", "Flax seeds", "Chia seeds", "Pumpkin seeds", "Extra Virgin Olive oil", "Groundnut oil"]
    };

    // Helper to get protein based on preference
    const getP = () => isVeg ? db.vegProtein : [...db.vegProtein, ...db.nonVegProtein];
    const p = getP();

    // 🍽️ MEAL STRUCTURE RULES
    const plan = {
        breakfast: `${p[0]} with ${db.carbs[0]}`, // Protein + carb
        lunch: `${p[3]} with ${db.carbs[2]} and ${db.vegTab[0]}`, // Protein + carb + vegetables
        snack: `${db.fruits[0]} and ${db.fats[0]}`, // Protein / fruit / nuts
        dinner: `${p[1]} with ${db.vegTab[2]}` // Protein + vegetables only
    };

    // ⚠️ CONDITION RULE ENGINE
    let warnings = [];
    if (conditions.includes('BP')) {
        warnings.push("❌ Avoid: pickles, papads, sauces, processed foods.");
        warnings.push("✅ Prefer: Beetroot, banana, oats, coconut water. Salt < 5g/day.");
        plan.breakfast = `Oats with Banana (Good for BP)`;
        plan.snack = `Coconut water or Apple`;
    }
    if (conditions.includes('Sugar')) {
        warnings.push("❌ Avoid: white rice, sugar, juice, bakery, potato.");
        warnings.push("✅ Prefer: Millets, legumes, nuts, vegetables. Fruits only before 6 PM.");
        plan.lunch = `${p[3]} or ${p[10]} with Millets and leafy greens.`;
        plan.dinner = `${p[1]} with Ridge gourd (No carbs).`;
    }
    if (conditions.includes('Cholesterol')) {
        warnings.push("❌ Avoid: fried food, butter, red meat. Egg yolk > 3/week.");
        warnings.push("✅ Prefer: Fish, oats, seeds, olive oil.");
        if (isNonVeg) plan.lunch = `Grilled Fish with vegetables.`;
        plan.snack = `Walnuts and Flax seeds.`;
    }
    if (conditions.includes('Thyroid')) {
        warnings.push("❌ Avoid: excess raw cabbage, cauliflower, excess soy.");
        warnings.push("✅ Prefer: Eggs, iodized salt, selenium foods.");
        if (!isVeg) plan.breakfast = `Egg whites with Ragi roti.`;
        plan.dinner = (plan.dinner).replace("Soy chunks", "Lentils");
    }

    // 🏃 ACTIVITY MODIFIERS
    if (activityLevel === 'sedentary') {
        plan.dinner = (plan.dinner).split(" with ")[0] + " with Boiled Vegetables (No rice/carbs at dinner)";
        plan.snack = `${db.fruits[1]} (Fruits only in morning/afternoon)`;
    } else if (activityLevel === 'light') {
        plan.dinner = (plan.dinner).split(" with ")[0] + ` with ${db.vegTab[1]} (Light dinner mandatory)`;
    } else if (activityLevel === 'moderate') {
        plan.breakfast = `Pre-workout: Banana | Post-workout: ${plan.breakfast}`;
    } else if (activityLevel === 'veryActive') {
        plan.lunch += ` + ${db.carbs[6]} (Carbs every meal)`;
        plan.dinner += ` + small portion of ${db.carbs[2]}`;
        warnings.push("💧 Electrolyte hydration is key for your activity level.");
    } else if (activityLevel === 'athlete') {
        warnings.push("🏃 Carb cycling recommended. Protein intake every 3–4 hours.");
        plan.snack = `High Protein Snack: ${p[4]} or Boiled Egg whites`;
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[new Date().getDay()];

    const themes = {
        Monday: "High Protein",
        Tuesday: "Fiber Rich",
        Wednesday: "Hydration Focus",
        Thursday: "Light Dinner",
        Friday: "Probiotics",
        Saturday: "Fruits & Nuts",
        Sunday: "Controlled Cheat Meal"
    };

    const reminders = {
        Monday: "Focus on lean protein sources like Chicken or Paneer today.",
        Tuesday: "Fill half your plate with colorful vegetables for fiber.",
        Wednesday: "Drink at least 3-4 liters of water today.",
        Thursday: "Keep dinner light and strictly before 8 PM.",
        Friday: "Have a bowl of fresh curd or buttermilk with lunch.",
        Saturday: "Snack on a handful of almonds and walnuts.",
        Sunday: "Enjoy your cheat meal, but keep it within calorie limits."
    };

    return {
        summary: {
            goal: goal === 'fatloss' ? 'Fat Loss' : (goal === 'muscle' ? 'Muscle Gain' : 'Body Recomposition'),
            dietPreference: isVeg ? 'Vegetarian' : 'Non-Vegetarian',
            healthConditions: conditions.length > 0 ? conditions : ['None'],
            activityLevel: activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)
        },
        calorieBreakdown: {
            bmr: Math.round(nutrients.bmr),
            tdee: Math.round(nutrients.tdee),
            finalCalories: nutrients.finalCalories
        },
        macroBreakdown: {
            protein: `${nutrients.macros.protein}g (${nutrients.macros.pPct}%)`,
            carbs: `${nutrients.macros.carbs}g (${nutrients.macros.cPct}%)`,
            fats: `${nutrients.macros.fats}g (${nutrients.macros.fPct}%)`
        },
        mealPlan: {
            Breakfast: plan.breakfast,
            Lunch: plan.lunch,
            Snack: plan.snack,
            Dinner: plan.dinner
        },
        weeklyFocus: themes[dayName],
        dailyReminder: reminders[dayName],
        customWarnings: warnings
    };
};
