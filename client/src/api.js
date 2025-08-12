// Centralized API base URL helper
// - In development, keep REACT_APP_API_BASE_URL empty to use CRA proxy
// - In production, if env is missing, fall back to the deployed backend URL
const normalizeBase = (base) => {
  if (!base) return '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const isProduction = process.env.NODE_ENV === 'production';
const fallbackProdBase = 'https://nutritrack-api.onrender.com';

export const API_BASE_URL = normalizeBase(
  process.env.REACT_APP_API_BASE_URL || (isProduction ? fallbackProdBase : '')
);

export const apiUrl = (path) => {
  if (!path.startsWith('/')) {
    throw new Error('apiUrl path must start with "/"');
  }
  if (!API_BASE_URL) return path; // dev with proxy
  return `${API_BASE_URL}${path}`;
};


