import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BMICalculator = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    heightMeters: '',
    heightCm: '',
    heightFeet: '',
    heightInches: '',
    weightKg: '',
    weightPounds: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/result', { state: form });
  };

  return (
    <form className="bmi-form glass" onSubmit={handleSubmit}>
      <h2>BMI Calculator</h2>

      <input type="number" name="heightMeters" placeholder="Height (meters)" onChange={handleChange} />
      <input type="number" name="heightCm" placeholder="Height (cm)" onChange={handleChange} />
      <input type="number" name="heightFeet" placeholder="Height (feet)" onChange={handleChange} />
      <input type="number" name="heightInches" placeholder="Height (inches)" onChange={handleChange} />
      <input type="number" name="weightKg" placeholder="Weight (kg)" onChange={handleChange} />
      <input type="number" name="weightPounds" placeholder="Weight (pounds)" onChange={handleChange} />

      <button type="submit" className="calculate-btn">Calculate BMI</button>
    </form>
  );
};

export default BMICalculator;
