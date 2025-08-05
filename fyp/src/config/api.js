// const isOnline = navigator.onLine;

// export const API = isOnline
//   ? "http://localhost:8000"
//   : "http://localhost:8000";

// src/config/api.js
const FALLBACKS = [
  import.meta?.env?.VITE_API_BASE_URL,
  'http://127.0.0.1:8000',
  'http://localhost:8000'
];

let cached = null;

async function probe(url, timeout = 1000) {
  if (!url) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(`${url}/api/movies/top-liked`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAPIBase() {
  if (cached) return cached;

  for (const url of FALLBACKS) {
    if (await probe(url)) {
      console.log(`[API] ✅ Connected to ${url}`);
      cached = url;
      return url;
    }
  }

  throw new Error("❌ No API base reachable");
}
