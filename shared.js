// Shared utilities for landing + chat (no build step)
(function () {
  const LS = {
    settings: "ala.settings.v2",
    chats: "ala.chats.v2",
    activeChatId: "ala.activeChatId.v2",
  };

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function now() {
    return Date.now();
  }

  function normalizeText(s) {
    return String(s ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || "";
  }

  function loadSettings() {
    const raw = localStorage.getItem(LS.settings);
    const s = raw ? safeJsonParse(raw, {}) : {};
    return {
      webhookUrl: typeof s.webhookUrl === "string" ? s.webhookUrl : "",
      explainSimply: !!s.explainSimply,
    };
  }

  function saveSettings(settings) {
    localStorage.setItem(LS.settings, JSON.stringify(settings));
  }

  function loadChats() {
    const raw = localStorage.getItem(LS.chats);
    const arr = raw ? safeJsonParse(raw, []) : [];
    return Array.isArray(arr) ? arr : [];
  }

  function saveChats(chats) {
    localStorage.setItem(LS.chats, JSON.stringify(chats));
  }

  function getActiveChatId() {
    return localStorage.getItem(LS.activeChatId) || "";
  }

  function setActiveChatId(id) {
    localStorage.setItem(LS.activeChatId, id);
  }

  async function postWebhook(webhookUrl, payload) {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
      throw new Error(typeof body === "string" ? body : JSON.stringify(body));
    }
    return body;
  }

  function coerceResponse(body) {
    if (body == null) return "";
    if (typeof body === "string") return body;
    if (typeof body === "object") {
      if (typeof body.response === "string") return body.response;
      if (typeof body.text === "string") return body.text;
      return JSON.stringify(body, null, 2);
    }
    return String(body);
  }

  window.ALA = {
    LS,
    uid,
    now,
    normalizeText,
    getQueryParam,
    loadSettings,
    saveSettings,
    loadChats,
    saveChats,
    getActiveChatId,
    setActiveChatId,
    postWebhook,
    coerceResponse,
  };
})();

