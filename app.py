*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0d14; --panel: #111620; --sidebar: #0d1117;
  --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.13);
  --text: #e8eaf0; --muted: #7a8099; --muted2: #4a5068;
  --accent: #6c63ff; --accent2: #ff6584; --green: #22c97b;
  --user-bub: #1a1f35; --bot-bub: #111620;
  --font: 'DM Sans', sans-serif; --head: 'Syne', sans-serif;
  --r: 12px; --r2: 20px;
}
[data-theme="light"] {
  --bg: #f5f6fa; --panel: #ffffff; --sidebar: #f0f1f6;
  --border: rgba(0,0,0,0.07); --border2: rgba(0,0,0,0.13);
  --text: #1a1d2e; --muted: #6b7280; --muted2: #9ca3af;
  --user-bub: #e8eaff; --bot-bub: #ffffff;
}

html, body { height: 100%; font-family: var(--font); background: var(--bg); color: var(--text); }

/* ── LAYOUT ── */
.app { display: flex; height: 100vh; overflow: hidden; }

/* ── NAV ── */
.nav {
  width: 72px; min-width: 72px; background: var(--sidebar);
  border-right: 1px solid var(--border); display: flex;
  flex-direction: column; align-items: center; padding: 16px 0; gap: 6px; z-index: 10;
}
.nav-logo {
  font-family: var(--head); font-size: 20px; color: var(--accent);
  letter-spacing: -1px; margin-bottom: 14px; cursor: default;
}
.nav-icon {
  width: 44px; height: 44px; border-radius: var(--r);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--muted); font-size: 18px;
  transition: all .2s; user-select: none;
}
.nav-icon:hover { background: rgba(108,99,255,.12); color: var(--text); }
.nav-icon.active { background: rgba(108,99,255,.18); color: var(--accent); }
.nav-bottom { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.nav-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; cursor: pointer; color: #fff;
}

/* ── HISTORY ── */
.history {
  width: 280px; min-width: 280px; background: var(--panel);
  border-right: 1px solid var(--border); display: flex; flex-direction: column;
  transition: width .3s ease, min-width .3s ease, opacity .3s ease; overflow: hidden;
}
.history.collapsed { width: 0; min-width: 0; opacity: 0; pointer-events: none; }
.history-head {
  padding: 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 280px;
}
.history-title { font-family: var(--head); font-size: 15px; white-space: nowrap; }
.collapse-btn, .expand-btn {
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border2);
  background: transparent; color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; transition: all .2s; flex-shrink: 0;
}
.collapse-btn:hover, .expand-btn:hover { background: rgba(255,255,255,.05); color: var(--text); }
.search-wrap { padding: 12px 16px; border-bottom: 1px solid var(--border); min-width: 280px; }
.search-input {
  width: 100%; background: rgba(128,128,128,.08); border: 1px solid var(--border);
  border-radius: 99px; padding: 8px 14px; color: var(--text);
  font-size: 13px; outline: none; font-family: var(--font); transition: border .2s;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--muted2); }
.history-list { flex: 1; overflow-y: auto; padding: 12px; min-width: 280px; }
.history-list::-webkit-scrollbar { width: 3px; }
.history-list::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
.loading-sessions { color: var(--muted); font-size: 13px; text-align: center; padding: 20px; }
.session-card {
  border-radius: var(--r); border: 1px solid var(--border); background: rgba(128,128,128,.03);
  padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all .2s;
}
.session-card:hover, .session-card.active { border-color: var(--border2); background: rgba(108,99,255,.08); }
.session-card.active { border-color: rgba(108,99,255,.3); }
.session-card-head { display: flex; align-items: center; justify-content: space-between; }
.session-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; padding: 2px 8px; border-radius: 99px; margin-bottom: 6px; font-weight: 500;
}
.tag-pdf { background: rgba(255,101,132,.15); color: #ff9db3; }
.tag-txt { background: rgba(34,201,123,.15); color: #22c97b; }
.tag-chat { background: rgba(108,99,255,.15); color: #9b94ff; }
.delete-session {
  width: 20px; height: 20px; border-radius: 4px; border: none;
  background: transparent; color: var(--muted2); cursor: pointer;
  font-size: 12px; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s;
}
.session-card:hover .delete-session { opacity: 1; }
.delete-session:hover { color: var(--accent2); }
.session-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.session-meta { font-size: 11px; color: var(--muted); }
.history-footer { padding: 12px 16px; border-top: 1px solid var(--border); min-width: 280px; }
.add-btn {
  width: 100%; padding: 10px; border-radius: var(--r); border: none;
  background: var(--accent2); color: #fff; font-family: var(--head);
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s;
}
.add-btn:hover { filter: brightness(1.1); transform: scale(1.02); }

/* ── CHAT COL ── */
.chat-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.chat-head {
  height: 60px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 20px; gap: 12px; flex-shrink: 0;
}
.chat-title { font-family: var(--head); font-size: 15px; }
.chat-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.head-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.mode-pills {
  display: flex; background: rgba(128,128,128,.08);
  border: 1px solid var(--border); border-radius: 99px; padding: 3px; gap: 2px;
}
.mode-pill {
  padding: 5px 13px; border-radius: 99px; font-size: 12px; font-weight: 500;
  cursor: pointer; color: var(--muted); transition: all .2s; border: none; background: transparent;
  font-family: var(--font);
}
.mode-pill.active { background: var(--accent); color: #fff; }

/* ── MESSAGES ── */
.msg-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.messages {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.messages::-webkit-scrollbar { width: 3px; }
.messages::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

.msg-row { display: flex; gap: 12px; align-items: flex-start; animation: fadeUp .25s ease-out both; }
.msg-row.user { flex-direction: row-reverse; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.avatar.ai { background: rgba(108,99,255,.15); border: 1px solid rgba(108,99,255,.3); }
.avatar.user { background: linear-gradient(135deg, var(--accent), var(--accent2)); }

.bubble {
  max-width: 74%; border-radius: var(--r2); padding: 14px 18px;
  font-size: 14px; line-height: 1.65;
}
.bubble.ai {
  background: var(--bot-bub); border: 1px solid var(--border2);
  border-radius: 4px 20px 20px 20px;
}
.bubble.user {
  background: var(--user-bub); border: 1px solid rgba(108,99,255,.25);
  border-radius: 20px 4px 20px 20px;
}
.bubble-label { font-size: 10px; color: var(--muted); margin-bottom: 6px; letter-spacing: .5px; text-transform: uppercase; font-weight: 600; }
.source-badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(34,201,123,.1); border: 1px solid rgba(34,201,123,.2);
  border-radius: 6px; padding: 3px 10px; font-size: 11px; color: var(--green); margin-bottom: 8px;
}
.bubble-content strong { font-weight: 600; color: var(--text); }
.bubble-content h2 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
.bubble-content pre {
  background: rgba(0,0,0,.3); border: 1px solid var(--border2);
  border-radius: 8px; padding: 12px; margin-top: 10px; overflow-x: auto;
  font-size: 12px; font-family: monospace;
}
.bubble-content ol, .bubble-content ul { padding-left: 20px; margin-top: 6px; }
.bubble-content li { margin-bottom: 4px; }
.bubble-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.bact {
  padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border2);
  background: transparent; color: var(--muted); font-size: 11px;
  cursor: pointer; font-family: var(--font); transition: all .2s;
}
.bact:hover { background: rgba(255,255,255,.05); color: var(--text); }

/* typing */
.typing-row .bubble { padding: 14px 20px; }
.dots { display: flex; gap: 5px; align-items: center; }
.dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
  animation: blink 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes blink { 0%,100% { opacity: .2; } 50% { opacity: 1; } }

/* WELCOME */
.welcome {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; padding: 40px; text-align: center;
}
.welcome-icon { font-size: 48px; margin-bottom: 16px; }
.welcome h2 { font-family: var(--head); font-size: 24px; margin-bottom: 10px; }
.welcome p { color: var(--muted); max-width: 420px; line-height: 1.65; margin-bottom: 24px; font-size: 15px; }
.chip-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 560px; }
.chip {
  padding: 8px 16px; border-radius: 99px; border: 1px solid var(--border2);
  background: rgba(128,128,128,.05); cursor: pointer; font-size: 13px;
  color: var(--muted); transition: all .2s; font-family: var(--font);
}
.chip:hover { border-color: rgba(108,99,255,.4); color: var(--text); background: rgba(108,99,255,.08); }

/* INPUT */
.input-area { padding: 14px 20px 18px; border-top: 1px solid var(--border); flex-shrink: 0; }
.file-preview {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: rgba(108,99,255,.08);
  border: 1px solid rgba(108,99,255,.2); border-radius: 8px;
  margin-bottom: 10px; font-size: 12px; color: #9b94ff;
}
.file-words { color: var(--muted); margin-left: 4px; }
.file-remove { margin-left: auto; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; }
.composer {
  background: rgba(128,128,128,.06); border: 1px solid var(--border2);
  border-radius: var(--r2); padding: 14px 16px; transition: border .2s;
}
.composer:focus-within { border-color: rgba(108,99,255,.45); box-shadow: 0 0 0 3px rgba(108,99,255,.1); }
.composer textarea {
  width: 100%; background: transparent; border: none; outline: none;
  color: var(--text); font-family: var(--font); font-size: 14px;
  resize: none; min-height: 22px; max-height: 120px; line-height: 1.5;
}
.composer textarea::placeholder { color: var(--muted2); }
.composer-foot { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.comp-btn {
  width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border2);
  background: transparent; color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; transition: all .2s; text-decoration: none;
}
.comp-btn:hover { background: rgba(255,255,255,.06); color: var(--text); }
input[type=file] { display: none; }
.hint { font-size: 11px; color: var(--muted2); margin-left: auto; }
.send-btn {
  height: 34px; padding: 0 18px; border-radius: 10px; border: none;
  background: var(--accent); color: #fff; font-family: var(--head);
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s;
}
.send-btn:hover { filter: brightness(1.1); transform: scale(1.03); }
.send-btn:disabled { opacity: .5; pointer-events: none; }

/* ERROR TOAST */
.toast {
  position: fixed; bottom: 24px; right: 24px; max-width: 360px;
  background: #3d1520; border: 1px solid rgba(255,101,132,.3);
  color: #ff9db3; padding: 12px 16px; border-radius: var(--r);
  font-size: 13px; z-index: 999; animation: fadeUp .2s ease-out;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .history { position: fixed; top: 0; left: 72px; bottom: 0; z-index: 20; }
  .history.collapsed { transform: translateX(-100%); width: 280px; min-width: 280px; opacity: 1; }
  .mode-pills { display: none; }
}
