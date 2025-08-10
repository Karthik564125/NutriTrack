// Centralized API base URL helper
// In development, leave REACT_APP_API_BASE_URL empty to use the CRA proxy
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const apiUrl = (path) => {
  if (!path.startsWith('/')) {
    throw new Error('apiUrl path must start with "/"');
  }
  return `${API_BASE_URL}${path}`;
};


