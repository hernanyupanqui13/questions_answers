"use client";

/**
 * Returns a stable anonymous browser token stored in localStorage.
 * Created on first call and reused across sessions.
 */
export function getBrowserToken(): string {
  const key = "qa_browser_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}
