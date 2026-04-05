// API Configuration for SGC
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Ensure the URL ends with /api for backend consistency
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
