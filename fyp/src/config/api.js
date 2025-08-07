export function getAPI() {
  return navigator.onLine
    ? "https://cineit.onrender.com"
    : "http://localhost:8000";
}
