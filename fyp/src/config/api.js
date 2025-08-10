const isOnline = navigator.onLine;

export const API = isOnline
  ? "http://localhost:8000"
  : "http://localhost:8000";