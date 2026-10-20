// Small fetch wrapper for the LIK ASP.NET Core API.
// Every call returns parsed JSON or throws an Error whose message is safe to show to the user.
// The JWT is kept in localStorage and sent in the Authorization header.

export const API_BASE = String(import.meta.env.VITE_API_URL || 'http://localhost:5080/api').replace(/\/$/, '');
const TOKEN_KEY = 'lik.token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
}

let unauthorizedHandler = null;
export function onUnauthorized(fn) { unauthorizedHandler = fn; }

function firstValidationMessage(data) {
  // ASP.NET Core returns { errors: { Field: ["message"] } } for malformed requests.
  if (data && data.errors) {
    const key = Object.keys(data.errors)[0];
    if (key && data.errors[key].length) return data.errors[key][0];
  }
  return null;
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    const err = new Error(`Cannot reach the LIK API at ${API_BASE}. Start the backend (dotnet run) and try again.`);
    err.network = true;
    throw err;
  }

  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }

  if (!res.ok) {
    const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (res.status === 401 && token && !isAuthCall && unauthorizedHandler) unauthorizedHandler();
    if (res.status === 429) throw Object.assign(new Error('Too many requests. Wait a minute and try again.'), { status: 429 });
    const message = (data && data.message) || firstValidationMessage(data) || (data && data.title) || `Request failed (${res.status}).`;
    throw Object.assign(new Error(message), { status: res.status });
  }
  return data;
}

/** Uploads a file as multipart/form-data (field name "file"). */
async function upload(path, file) {
  const form = new FormData();
  form.append('file', file);
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(API_BASE + path, { method: 'POST', headers, body: form });
  } catch {
    throw new Error('Could not upload the file. Check that the backend is running.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error((data && data.message) || `Upload failed (${res.status}).`), { status: res.status });
  return data;
}

/** Downloads a protected file (sends the JWT) and returns it as a Blob. */
async function getBlob(path) {
  const token = getToken();
  const res = await fetch(API_BASE + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data && data.message) || 'The file could not be opened.');
  }
  return res.blob();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  upload,
  getBlob
};
