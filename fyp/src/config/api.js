// const isOnline = navigator.onLine;

// export const API = isOnline
//   ? "https://cineit.onrender.com"
//   : "http://localhost:8000";

  const isOnline = navigator.onLine;

export const API = isOnline
  ? "http://localhost:8000"
  : "http://localhost:8000";

