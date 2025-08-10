import db from '../db/db.js';

export const saveBMI = async (req, res) => {
  const {
    user_id,
    height_meters,
    height_cm,
    height_feet,
    height_inches,
    weight_kg,
    weight_pounds,
    bmi,
    category,
    preference
  } = req.body;

  // Convert all height inputs to meters
  let height = height_meters 
    || (height_cm 
        ? height_cm / 100 
        : (height_feet 
            ? height_feet * 0.3048 
            : (height_inches 
                ? height_inches * 0.0254 
                : null)));

  // Convert all weight inputs to kg
  let weight = weight_kg || (weight_pounds ? weight_pounds * 0.453592 : null);

  let height_unit = height_meters ? 'meters' 
                      : height_cm ? 'cm' 
                      : height_feet ? 'feet' 
                      : height_inches ? 'inches' 
                      : null;

  let weight_unit = weight_kg ? 'kg' 
                      : weight_pounds ? 'pounds' 
                      : null;

  try {
    const query = `
      INSERT INTO bmi_data 
      (user_id, height, height_unit, weight, weight_unit, bmi_value, category, diet_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [user_id, height, height_unit, weight, weight_unit, bmi, category, preference]);
    res.status(200).json({ message: 'BMI saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'BMI save failed' });
  }
};

export const getLatestBMI = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM bmi_data WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No BMI data found for user' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch BMI' });
  }
};
