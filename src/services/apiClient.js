import { getToken, getRefreshToken, setToken } from './tokenStorage';

function getApiBaseUrl() {
  const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  return origin;
}

let isRefreshing = false;
let refreshPromise = null;

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (isRefreshing) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/auth/refresh-token`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return null;

      const newAccess = json.data?.accessToken || json.token;
      const newRefresh = json.data?.refreshToken || refreshToken;
      if (newAccess) {
        setToken(newAccess, newRefresh);
        return newAccess;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const base = getApiBaseUrl();
  const apiPath = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    let res = await fetch(`${base}${apiPath}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && auth) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(`${base}${apiPath}`, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
        });
      }
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || res.statusText || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return json;
  } catch (e) {
    if (e.status) throw e;
    throw new Error(e.message || 'Network error — is the backend running?');
  }
}

export async function apiGet(path, options = {}) {
  return api(path, { ...options, method: 'GET' });
}

export { getApiBaseUrl };
