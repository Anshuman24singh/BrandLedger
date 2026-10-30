
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
    if (data.user_id != null) {
      sessionStorage.setItem("bl-user-id", String(data.user_id));
    }
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
      sessionStorage.removeItem("bl-user-id");
      sessionStorage.removeItem("bl-is-staff");
    }
  },

  listDrafts(brandId = null) {
    const query = brandId ? `?brand_id=${encodeURIComponent(brandId)}` : "";
    return request(`/drafts/${query}`);
  },

  getDraft(id) {
    return request(`/drafts/${encodeURIComponent(id)}/`);
  },

  createFact(data) { return request("/facts/", { method: "POST", body: JSON.stringify(data) }); },
  updateFact(id, data) { return request(`/facts/${encodeURIComponent(id)}/`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteFact(id) { return request(`/facts/${encodeURIComponent(id)}/`, { method: "DELETE" }); },
  factAudit(id) { return request(`/facts/${encodeURIComponent(id)}/audit/`); },
  knowledge(brandId = null) {
    return request(`/knowledge/${brandId ? `?brand_id=${encodeURIComponent(brandId)}` : ""}`);
  },
  listBrands() { return request("/brands/"); },
  createBrand(name) { return request("/brands/", { method:"POST", body:JSON.stringify({name}) }); },
  updateBrand(id, name) { return request(`/brands/${encodeURIComponent(id)}/`, { method:"PATCH", body:JSON.stringify({name}) }); },
  deleteBrand(id) { return request(`/brands/${encodeURIComponent(id)}/`, { method:"DELETE" }); },
  createGuideline(data) { return request("/guidelines/", { method:"POST", body:JSON.stringify(data) }); },
  updateGuideline(id, data) { return request(`/guidelines/${encodeURIComponent(id)}/`, { method:"PATCH", body:JSON.stringify(data) }); },
  deleteGuideline(id) { return request(`/guidelines/${encodeURIComponent(id)}/`, { method:"DELETE" }); },
  reviewDraft(id) { return request(`/drafts/${encodeURIComponent(id)}/review/`, { method:"POST", body:JSON.stringify({}) }); },
  getDraftChanges(id) { return request(`/drafts/${encodeURIComponent(id)}/changes/`); },
  applyDraftChanges(id, include) { return request(`/drafts/${encodeURIComponent(id)}/apply-changes/`, { method:"POST", body:JSON.stringify({include}) }); },

  createDraft({ title, content, brand = null }) {
    return request("/drafts/", {
      method: "POST",
      body: JSON.stringify({ title, content, brand }),
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

  submitCompletedReview(id, comment = "Completed corrections submitted for client review.") {
    return request(`/drafts/${encodeURIComponent(id)}/submit-completed-review/`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
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
