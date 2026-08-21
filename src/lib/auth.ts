export const AUTH_USER_EMAIL = 'sbp89@hotmail.com';
export const AUTH_USER_PASS = 'Eri102889.';

const AUTH_STORAGE_KEY = 'sca_auth_session_v1';
const AUTH_COOKIE_NAME = 'sca_auth_token';

export interface AuthSession {
  email: string;
  loginTime: string;
}

export function validateCredentials(email: string, pass: string): boolean {
  if (!email || !pass) return false;
  return (
    email.trim().toLowerCase() === AUTH_USER_EMAIL.toLowerCase() &&
    pass === AUTH_USER_PASS
  );
}

export function loginUser(email: string, pass: string): boolean {
  if (validateCredentials(email, pass)) {
    const session: AuthSession = {
      email: email.trim().toLowerCase(),
      loginTime: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      document.cookie = `${AUTH_COOKIE_NAME}=authenticated; path=/; max-age=2592000; SameSite=Lax`;
    }
    return true;
  }
  return false;
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function checkIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const session: AuthSession = JSON.parse(raw);
    return session.email === AUTH_USER_EMAIL.toLowerCase();
  } catch {
    return false;
  }
}
