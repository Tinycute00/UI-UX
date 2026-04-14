/**
 * State Controller Module
 * Centralized state management for dashboard and billing views
 * Handles empty, loading, error, and content state transitions
 */

/**
 * Show a specific state for a view by hiding all others
 * @param {string} viewPrefix - "dash" or "billing"
 * @param {string} state - "empty" | "loading" | "error" | "content"
 */
export function showViewState(viewPrefix, state) {
  const validStates = ["empty", "loading", "error", "content"];

  if (!validStates.includes(state)) {
    console.warn(`Invalid state "${state}" for view "${viewPrefix}"`);
    return;
  }

  // Get all state containers
  const empty = document.getElementById(`${viewPrefix}-empty`);
  const loading = document.getElementById(`${viewPrefix}-loading`);
  const error = document.getElementById(`${viewPrefix}-error`);
  const content = document.getElementById(`${viewPrefix}-content`);

  // Hide all states first, then show target
  // This prevents flickering during transitions

  // Handle empty state
  if (empty) {
    const isTarget = state === "empty";
    empty.style.display = isTarget ? "" : "none";
    empty.setAttribute("aria-hidden", isTarget ? "false" : "true");
  }

  // Handle loading state
  if (loading) {
    const isTarget = state === "loading";
    loading.style.display = isTarget ? "" : "none";
    loading.setAttribute("aria-hidden", isTarget ? "false" : "true");
  }

  // Handle error state
  if (error) {
    const isTarget = state === "error";
    error.style.display = isTarget ? "" : "none";
    error.setAttribute("aria-hidden", isTarget ? "false" : "true");
  }

  // Handle content state
  if (content) {
    const isTarget = state === "content";
    content.style.display = isTarget ? "" : "none";
    content.setAttribute("aria-hidden", isTarget ? "false" : "true");
  }
}

/**
 * Show dashboard state
 * @param {string} state - "empty" | "loading" | "error" | "content"
 */
export function showDashState(state) {
  showViewState("dash", state);
}

/**
 * Show billing state
 * @param {string} state - "empty" | "loading" | "error" | "content"
 */
export function showBillingState(state) {
  showViewState("billing", state);
}

// Expose to window for Tester programmatic verification
if (typeof window !== "undefined") {
  window.showDashState = showDashState;
  window.showBillingState = showBillingState;
  window.showViewState = showViewState;
}
