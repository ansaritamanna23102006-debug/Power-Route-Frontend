const ACCESS_TOKEN_KEY = '@voltpath_auth_token';
const REFRESH_TOKEN_KEY = '@voltpath_refresh_token';

let memoryAccessToken = null;
let memoryRefreshToken = null;

export function initializeToken() {
  if (typeof window === 'undefined') return null;
  try {
    memoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || null;
    memoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || null;
    return memoryAccessToken;
  } catch (error) {
    console.error('Failed to load tokens from storage:', error);
    return null;
  }
}

export const loadToken = initializeToken;

export function getToken() {
  if (memoryAccessToken) return memoryAccessToken;
  if (typeof window !== 'undefined') {
    memoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  }
  return memoryAccessToken;
}

export function getRefreshToken() {
  if (memoryRefreshToken) return memoryRefreshToken;
  if (typeof window !== 'undefined') {
    memoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  }
  return memoryRefreshToken;
}

export function setToken(accessToken, refreshToken) {
  memoryAccessToken = accessToken || null;
  if (typeof window !== 'undefined') {
    try {
      if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to save access token to storage:', error);
    }
  }

  if (refreshToken !== undefined) {
    memoryRefreshToken = refreshToken || null;
    if (typeof window !== 'undefined') {
      try {
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      } catch (error) {
        console.error('Failed to save refresh token to storage:', error);
      }
    }
  }
}

export function clearToken() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear tokens from storage:', error);
    }
  }
}
