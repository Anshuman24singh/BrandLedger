
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const TOKEN_KEY = "brandledger_token";

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
  });

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.detail ||
        data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

export const api = {
  configured: Boolean(BASE_URL),

  get authenticated() {
    return Boolean(getToken());
  },

  async login(username, password) {
    const data = await request("/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (!data?.token) {
      throw new Error(
        "Login succeeded without returning an authentication token."
      );
    }

    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem("bl-username", data.username || username);
    sessionStorage.setItem(
      "bl-is-staff",
      String(Boolean(data.is_staff))
    );

    return data;
  },

  async logout() {
    try {
      await request("/logout/", { method: "POST" });
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem("bl-username");
      sessionStorage.removeItem("bl-is-staff");
    }
  },

  listDrafts() {
    return request("/drafts/");
  },

  getDraft(id) {
    return request(`/drafts/${encodeURIComponent(id)}/`);
  },

  knowledge() {
    return request("/knowledge/");
  },

  createDraft({ title, content }) {
    return request("/drafts/", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    });
  },

  revise(id, content) {
    return request(
      `/drafts/${encodeURIComponent(id)}/revise/`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  },

  decide(draftId, findingId, action, comment = "") {
    return request(
      `/drafts/${encodeURIComponent(draftId)}/findings/${encodeURIComponent(findingId)}/decide/`,
      {
        method: "POST",
        body: JSON.stringify({ action, comment }),
      }
    );
  },

  draftDecision(draftId, action, comment = "") {
    return request(
      `/drafts/${encodeURIComponent(draftId)}/decide/`,
      {
        method: "POST",
        body: JSON.stringify({ action, comment }),
      }
    );
  },

  approve(draftId, comment = "") {
    return request(
      `/drafts/${encodeURIComponent(draftId)}/approve/`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      }
    );
  },

  // Permanently delete one draft through the Django backend.
  deleteDraft(id) {
    return request(`/drafts/${encodeURIComponent(id)}/`, {
      method: "DELETE",
    });
  },
};
