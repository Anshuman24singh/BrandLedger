
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Sends an HTTP request to the BrandLedger backend.
 * Endpoint paths must match the Django API contract.
 */
async function request(path, options = {}) {
  if (!BASE_URL) {
    throw new Error("Demo mode: API base URL is not configured.");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;

    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch {
      // Keep the fallback message if the response isn't JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * API adapter for BrandLedger.
 *
 * PROVISIONAL:
 * Confirm these endpoint paths and payload formats
 * with the Django backend developer before integration.
 */
export const api = {
  configured: Boolean(BASE_URL),

  review(payload) {
    return request("/reviews/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  decision(reviewId, payload) {
    return request(
      `/reviews/${encodeURIComponent(reviewId)}/decision/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
};
