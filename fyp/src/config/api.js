
const isOnline = navigator.onLine;

export const API = isOnline
  ? "https://cineit.onrender.com"
  : "http://localhost:8000";
