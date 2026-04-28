const TOKEN_KEY = "token";
const BASE_TOKEN_KEY = "adminBaseToken";

export function beginAdminSession(adminToken) {
  const currentToken = localStorage.getItem(TOKEN_KEY);
  if (currentToken && !sessionStorage.getItem(BASE_TOKEN_KEY)) {
    sessionStorage.setItem(BASE_TOKEN_KEY, currentToken);
  }
  localStorage.setItem(TOKEN_KEY, adminToken);
}

export function restoreUserSession() {
  const baseToken = sessionStorage.getItem(BASE_TOKEN_KEY);
  if (!baseToken) {
    return;
  }
  localStorage.setItem(TOKEN_KEY, baseToken);
  sessionStorage.removeItem(BASE_TOKEN_KEY);
}

export function clearAdminSessionArtifacts() {
  sessionStorage.removeItem(BASE_TOKEN_KEY);
}

export function hasAdminBaseSession() {
  return Boolean(sessionStorage.getItem(BASE_TOKEN_KEY));
}
