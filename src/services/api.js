/**
 * API client: base URL + Authorization from Supabase session.
 * 
 * FIXED: Added support for AbortController signal to enable timeouts
 */
import { supabase } from './supabase';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  if (API_BASE.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  return headers;
}

// FIXED: Added options parameter to support signal (AbortController)
export async function apiGet(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { 
    ...options, // Pass through options (including signal)
    headers, 
    credentials: 'include' 
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function apiPost(path, body) {
  const headers = await getAuthHeaders();
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function apiPatch(path, body) {
  const headers = await getAuthHeaders();
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}