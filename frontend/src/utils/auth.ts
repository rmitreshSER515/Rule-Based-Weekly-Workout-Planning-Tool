/**
 * Client-side auth helpers. Centralize logout and any future session cleanup here.
 */

const AUTH_KEYS = {
  token: "token",
  user: "user",
} as const;

/**
 * Clears the current session (token + user) from localStorage.
 * Add any other client cleanup here (e.g. more keys, or a logout API call).
 */
export function clearSession(): void {
  localStorage.removeItem(AUTH_KEYS.token);
  localStorage.removeItem(AUTH_KEYS.user);
}

/**
 * Logs out the user: clears session and navigates to the login page.
 * Pass the navigate function from useNavigate() so redirect works with React Router.
 */
export function logout(navigate: (path: string) => void): void {
  clearSession();
  navigate("/login");
}
