// src/Application/CurrentUser.ts
//
// Single source of truth for "who is the current user?".
//
// There is no auth system in the app yet. Every user is "Studio System"
// by default. When real auth lands, replace the body of getCurrentUser()
// with a lookup into the auth slice / session / token.
//
// For local multi-user testing before auth exists, append ?asUser=Alice
// to any URL — getCurrentUser() returns "Alice" for that page load. The
// override is dev-only; remove it before shipping to production.

const DEFAULT_USER = "Studio System";

export function getCurrentUser(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const asUser = params.get("asUser");
    if (asUser && asUser.trim().length > 0) {
      return asUser.trim();
    }
  }
  return DEFAULT_USER;
}

/**
 * Convenience constant — the resolved current user for this page load.
 * Stable for the lifetime of the page (URL params don't change without
 * a navigation/reload).
 */
export const CURRENT_USER = getCurrentUser();