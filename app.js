/* global pdfjsLib, mammoth, JSZip */

// ---------- DOM ----------
const els = {
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarToggleTop: document.getElementById("sidebarToggleTop"),
  newChatBtn: document.getElementById("newChatBtn"),
  chatList: document.getElementById("chatList"),
  exportBtn: document.getElementById("exportBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),

  activeChatTitle: document.getElementById("activeChatTitle"),
  statusLine: document.getElementById("statusLine"),
  shareBtn: document.getElementById("shareBtn"),
  clearChatBtn: document.getElementById("clearChatBtn"),
  settingsBtn: document.getElementById("settingsBtn"),

  chatLog: document.getElementById("chatLog"),

  queryInput: document.getElementById("queryInput"),
  sendBtn: document.getElementById("sendBtn"),
  micBtn: document.getElementById("micBtn"),
  attachBtn: document.getElementById("attachBtn"),
  fileInput: document.getElementById("fileInput"),
  simpleToggle: document.getElementById("simpleToggle"),
  ttsToggle: document.getElementById("ttsToggle"),
  composerHint: document.getElementById("composerHint"),
  ttsPlayBtn: document.getElementById("ttsPlayBtn"),
  ttsPauseBtn: document.getElementById("ttsPauseBtn"),
  ttsResumeBtn: document.getElementById("ttsResumeBtn"),
  ttsStopBtn: document.getElementById("ttsStopBtn"),

  settingsModal: document.getElementById("settingsModal"),
  themeSelect: document.getElementById("themeSelect"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  voiceSelect: document.getElementById("voiceSelect"),
  voiceGenderSelect: document.getElementById("voiceGenderSelect"),
  rateInput: document.getElementById("rateInput"),
  pitchInput: document.getElementById("pitchInput"),
  volumeInput: document.getElementById("volumeInput"),
  rateValue: document.getElementById("rateValue"),
  pitchValue: document.getElementById("pitchValue"),
  volumeValue: document.getElementById("volumeValue"),
};

// ---------- Storage ----------
const LS_KEYS = {
  chats: "ala.chats.v1",
  activeChatId: "ala.activeChatId.v1",
  settings: "ala.settings.v1",
};

/** @typedef {{id:string, role:"user"|"assistant", content:string, ts:number}} ChatMessage */
/** @typedef {{name:string, type:string, size:number, text:string}} ChatDoc */
/** @typedef {{id:string, title:string, createdAt:number, updatedAt:number, messages:ChatMessage[], doc?: ChatDoc}} ChatThread */
/** @typedef {{theme:"dark"|"light"}} Settings */
/** @typedef {{voiceUri?:string, genderPref?:"any"|"female"|"male", rate?:number, pitch?:number, volume?:number}} VoiceSettings */

/** @returns {Settings} */
function loadSettings(){
  try{
    const raw = localStorage.getItem(LS_KEYS.settings);
    if (!raw) return { theme: "dark" };
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === "light" ? "light" : "dark",
      voiceUri: typeof parsed.voiceUri === "string" ? parsed.voiceUri : "",
      genderPref: parsed.genderPref === "female" || parsed.genderPref === "male" ? parsed.genderPref : "any",
      rate: typeof parsed.rate === "number" ? parsed.rate : 1,
      pitch: typeof parsed.pitch === "number" ? parsed.pitch : 1,
      volume: typeof parsed.volume === "number" ? parsed.volume : 1,
    };
  } catch {
    return { theme: "dark" };
  }
}
function saveSettings(s){
  localStorage.setItem(LS_KEYS.settings, JSON.stringify(s));
}

/** @returns {ChatThread[]} */
function loadChats(){
  try{
    const raw = localStorage.getItem(LS_KEYS.chats);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}
function saveChats(chats){
  localStorage.setItem(LS_KEYS.chats, JSON.stringify(chats));
}

function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function now(){ return Date.now(); }

function normalizeText(s){
  return String(s ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

function setStatus(text){
  els.statusLine.textContent = text;
}

// ---------- Markdown-ish rendering (code fences + inline code) ----------
function renderContentToHtml(text){
  const src = String(text ?? "");
  // Handle triple-backtick blocks first.
  const parts = src.split(/```/g);
  let html = "";
  for (let i = 0; i < parts.length; i++){
    const chunk = parts[i];
    const isCode = i % 2 === 1;
    if (!isCode){
      const escaped = escapeHtml(chunk);
      // inline code
      const inline = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
      html += inline.replace(/\n/g, "<br>");
    } else {
      // optional language on first line
      const lines = chunk.replace(/^\n/, "").split("\n");
      const maybeLang = lines[0].trim();
      const code =
        /^[a-z0-9#+._-]{1,20}$/i.test(maybeLang)
          ? lines.slice(1).join("\n")
          : lines.join("\n");
      html += `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  }
  return html;
}

function messageBubble(role, content, metaRightHtml = ""){
  const row = document.createElement("div");
  row.className = `msgRow ${role === "user" ? "msgRow--user" : "msgRow--ai"}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "bubble--user" : "bubble--ai"}`;

  const meta = document.createElement("div");
  meta.className = "bubble__meta";
  meta.innerHTML = `<span>${role}</span>${metaRightHtml ? `<span>${metaRightHtml}</span>` : "<span></span>"}`;

  const body = document.createElement("div");
  body.className = "bubble__content";
  body.innerHTML = renderContentToHtml(content);

  bubble.appendChild(meta);
  bubble.appendChild(body);
  row.appendChild(bubble);
  return { row, bubble, body };
}

function scrollToBottom(){
  els.chatLog.scrollTo({ top: els.chatLog.scrollHeight, behavior: "smooth" });
}

// ---------- File extraction (optional, for sending to backend) ----------
function ensurePdfJsConfigured(){
  if (!("pdfjsLib" in window)){
    throw new Error(
      "PDF support is unavailable because PDF.js didn’t load (pdfjsLib is not defined). " +
      "Fix: make sure this script loads: https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js " +
      "and that your browser is not blocking third-party scripts."
    );
  }
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc){
    // CDN worker (with fallback)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";
  }
}

async function extractTextFromFile(file){
  const name = file.name || "uploaded";
  const type = (file.type || "").toLowerCase();
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (type.startsWith("text/") || ["txt","md","csv","log","json"].includes(ext)){
    return normalizeText(await file.text());
  }

  if (type === "application/pdf" || ext === "pdf"){
    ensurePdfJsConfigured();
    const buf = await file.arrayBuffer();
    // Some browsers require explicitly disabling streaming/range reads for local blobs.
    const pdf = await pdfjsLib.getDocument({ data: buf, disableStream: true, disableRange: true }).promise;
    let out = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++){
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((it) => it.str);
      out += `\n\n[Page ${pageNum}]\n` + strings.join(" ");
    }
    return normalizeText(out);
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ){
    const buf = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return normalizeText(res.value || "");
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    ext === "pptx"
  ){
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const slidePaths = Object.keys(zip.files)
      .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
        const nb = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
        return na - nb;
      });
    let out = "";
    const parser = new DOMParser();
    for (const path of slidePaths){
      const xml = await zip.file(path).async("string");
      const doc = parser.parseFromString(xml, "application/xml");
      const texts = Array.from(doc.getElementsByTagName("a:t")).map((n) => n.textContent || "");
      const slideNum = Number(path.match(/slide(\d+)\.xml/i)?.[1] || 0) || 0;
      out += `\n\n[Slide ${slideNum || "?"}]\n${texts.join(" ")}`;
    }
    return normalizeText(out);
  }

  throw new Error(`Unsupported file type: ${name}.`);
}

async function fileToBase64(file){
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// ---------- Chat state ----------
let settings = loadSettings();
let chats = loadChats();
let activeChatId = localStorage.getItem(LS_KEYS.activeChatId) || "";
let lastAttachedName = "";

function getActiveChat(){
  let chat = chats.find((c) => c.id === activeChatId);
  if (!chat){
    chat = createNewChat();
  }
  return chat;
}

function createNewChat(){
  const chat = /** @type {ChatThread} */ ({
    id: uid(),
    title: "New chat",
    createdAt: now(),
    updatedAt: now(),
    messages: [],
  });
  chats = [chat, ...chats];
  activeChatId = chat.id;
  localStorage.setItem(LS_KEYS.activeChatId, activeChatId);
  saveChats(chats);
  renderAll();
  return chat;
}

function deleteChat(chatId){
  chats = chats.filter((c) => c.id !== chatId);
  if (activeChatId === chatId){
    activeChatId = chats[0]?.id || "";
    localStorage.setItem(LS_KEYS.activeChatId, activeChatId);
  }
  saveChats(chats);
  renderAll();
}

function clearChat(chatId){
  const c = chats.find((x) => x.id === chatId);
  if (!c) return;
  c.messages = [];
  c.title = "New chat";
  c.updatedAt = now();
  saveChats(chats);
  renderAll();
}

function updateChatTitleFromFirstUserMessage(chat){
  const firstUser = chat.messages.find((m) => m.role === "user");
  if (!firstUser) return;
  const t = firstUser.content.split("\n")[0].trim();
  chat.title = t ? t.slice(0, 44) : "New chat";
}

// ---------- Rendering ----------
function renderSidebar(){
  els.chatList.innerHTML = "";
  for (const c of chats){
    const item = document.createElement("button");
    item.type = "button";
    item.className = `chatItem ${c.id === activeChatId ? "is-active" : ""}`;
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <span class="chatItem__title">${escapeHtml(c.title || "New chat")}</span>
      <span class="chatItem__actions">
        <span class="icon-btn icon-btn--ghost" data-action="delete" data-id="${escapeHtml(c.id)}" title="Delete">
          <span class="emoji" aria-hidden="true">🗑</span>
        </span>
      </span>
    `;
    item.addEventListener("click", (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      const deleteBtn = target.closest?.("[data-action='delete']");
      if (deleteBtn){
        e.preventDefault();
        e.stopPropagation();
        deleteChat(deleteBtn.getAttribute("data-id") || "");
        return;
      }
      activeChatId = c.id;
      localStorage.setItem(LS_KEYS.activeChatId, activeChatId);
      renderAll();
      if (window.matchMedia("(max-width: 980px)").matches){
        els.sidebar.classList.remove("is-open");
      }
    });
    els.chatList.appendChild(item);
  }
}

function renderChat(){
  const chat = getActiveChat();
  els.activeChatTitle.textContent = chat.title || "New chat";
  els.chatLog.innerHTML = "";

  if (chat.messages.length === 0){
    const docLine = chat.doc?.name ? `\n\nCurrent file: ${chat.doc.name}` : "";
    const { row } = messageBubble(
      "assistant",
      "Welcome! Upload a file (TXT/DOCX/PDF/PPTX), then ask questions about it.\n\n- Enter = send\n- Shift+Enter = new line\n- Ask “summarize” for a summary\n\nThis runs fully in your browser; your file stays on your machine." + docLine,
      ""
    );
    els.chatLog.appendChild(row);
    return;
  }

  for (const m of chat.messages){
    const metaRight =
      m.role === "assistant"
        ? `<span class="bubbleActions">
             <button class="icon-btn icon-btn--ghost" data-copy="${escapeHtml(m.id)}" title="Copy">
               <span class="emoji" aria-hidden="true">⧉</span>
             </button>
           </span>`
        : "";
    const { row } = messageBubble(m.role, m.content, metaRight);
    els.chatLog.appendChild(row);
  }
}

function renderAll(){
  renderSidebar();
  renderChat();
  applyTheme();
  requestAnimationFrame(scrollToBottom);
}

// ---------- Theme / modal ----------
function applyTheme(){
  document.body.setAttribute("data-theme", settings.theme);
}

function openSettings(){
  els.themeSelect.value = settings.theme || "dark";
  els.voiceGenderSelect.value = settings.genderPref || "any";
  els.rateInput.value = String(settings.rate ?? 1);
  els.pitchInput.value = String(settings.pitch ?? 1);
  els.volumeInput.value = String(settings.volume ?? 1);
  syncVoiceValueLabels();
  populateVoiceSelect();
  els.settingsModal.setAttribute("aria-hidden", "false");
}
function closeSettings(){
  els.settingsModal.setAttribute("aria-hidden", "true");
}

// ---------- Local analysis (TF‑IDF retrieval + extractive summary) ----------
const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","but","by","for","from","has","have","he","her","his","i","if","in","into","is","it","its","me","my",
  "not","of","on","or","our","she","so","than","that","the","their","them","then","there","these","they","this","to","was","we","were","what",
  "when","where","which","who","will","with","you","your","yours","can","could","would","should","may","might","do","does","did","done"
]);

function tokenize(s){
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOPWORDS.has(w));
}

function splitIntoSentences(text){
  const t = normalizeText(text);
  const parts = t.split(/(?<=[.!?])\s+(?=[A-Z0-9])/g);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function chunkText(text, targetChars = 1200, overlapChars = 200){
  const t = normalizeText(text);
  if (!t) return [];
  const paras = t.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras){
    if ((buf + "\n\n" + p).length <= targetChars){
      buf = buf ? `${buf}\n\n${p}` : p;
      continue;
    }
    if (buf) chunks.push(buf);
    if (p.length <= targetChars) buf = p;
    else{
      let i = 0;
      while (i < p.length){
        chunks.push(p.slice(i, i + targetChars));
        i += (targetChars - overlapChars);
      }
      buf = "";
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function buildTfidfIndex(text){
  const chunks = chunkText(text);
  const docsTokens = chunks.map(tokenize);
  const vocab = new Map();
  for (const toks of docsTokens){
    for (const w of toks){
      if (!vocab.has(w)) vocab.set(w, vocab.size);
    }
  }
  const N = chunks.length;
  const df = new Array(vocab.size).fill(0);
  for (const toks of docsTokens){
    const seen = new Set();
    for (const w of toks){
      const id = vocab.get(w);
      if (id == null) continue;
      if (!seen.has(id)){
        seen.add(id);
        df[id] += 1;
      }
    }
  }
  const idf = df.map((d) => Math.log((N + 1) / (d + 1)) + 1);
  const tfidf = [];
  const norms = [];
  for (const toks of docsTokens){
    const tf = new Array(vocab.size).fill(0);
    for (const w of toks){
      const id = vocab.get(w);
      if (id != null) tf[id] += 1;
    }
    const maxTf = Math.max(1, ...tf);
    let norm2 = 0;
    const vec = tf.map((c, i) => {
      const v = (c / maxTf) * idf[i];
      norm2 += v * v;
      return v;
    });
    tfidf.push(vec);
    norms.push(Math.sqrt(norm2) || 1);
  }
  return { chunks, tfidf, vocab, idf, norms };
}

function vectorizeQuery(q, vocab, idf){
  const toks = tokenize(q);
  const tf = new Array(vocab.size).fill(0);
  for (const w of toks){
    const id = vocab.get(w);
    if (id != null) tf[id] += 1;
  }
  const maxTf = Math.max(1, ...tf);
  let norm2 = 0;
  const vec = tf.map((c, i) => {
    const v = (c / maxTf) * idf[i];
    norm2 += v * v;
    return v;
  });
  return { vec, norm: Math.sqrt(norm2) || 1 };
}

function cosineSim(a, aNorm, b, bNorm){
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (aNorm * bNorm);
}

function summarizeText(text, maxSentences = 6){
  const sentences = splitIntoSentences(text);
  if (sentences.length <= maxSentences) return sentences.join(" ");
  const freqs = new Map();
  for (const s of sentences){
    for (const w of tokenize(s)){
      freqs.set(w, (freqs.get(w) || 0) + 1);
    }
  }
  const scored = sentences.map((s, idx) => {
    const words = tokenize(s);
    let score = 0;
    for (const w of words) score += (freqs.get(w) || 0);
    const lenPenalty = Math.abs(s.length - 140) / 140;
    return { idx, s, score: score / (1 + lenPenalty) };
  });
  scored.sort((a, b) => b.score - a.score);
  const chosen = scored.slice(0, maxSentences).sort((a, b) => a.idx - b.idx);
  return chosen.map((c) => c.s).join(" ");
}

const indexCache = new Map(); // chatId -> { key:string, index:any }
function getIndexForChat(chat){
  if (!chat.doc?.text) return null;
  const key = `${chat.doc.name}:${chat.doc.text.length}`;
  const cached = indexCache.get(chat.id);
  if (cached?.key === key) return cached.index;
  const idx = buildTfidfIndex(chat.doc.text);
  indexCache.set(chat.id, { key, index: idx });
  return idx;
}

function answerFromDoc(chat, query){
  if (!chat.doc?.text){
    return "Upload a file first (TXT/DOCX/PDF/PPTX), then ask a question.";
  }
  const idx = getIndexForChat(chat);
  if (!idx || idx.chunks.length === 0){
    return "I couldn’t extract usable text from that file.";
  }
  const { vec: qv, norm: qn } = vectorizeQuery(query, idx.vocab, idx.idf);
  const scored = idx.tfidf.map((dv, i) => ({ i, score: cosineSim(qv, qn, dv, idx.norms[i]) }));
  scored.sort((a, b) => b.score - a.score);
  const k = els.simpleToggle.checked ? 3 : 5;
  const hits = scored.slice(0, k).filter((x) => x.score > 0.03);
  if (hits.length === 0){
    return `I couldn’t find anything relevant in \`${chat.doc.name}\` for that question. Try rephrasing with keywords that appear in the document.`;
  }
  const excerptLen = els.simpleToggle.checked ? 260 : 520;
  const bullets = hits.map((h) => {
    const chunk = idx.chunks[h.i].trim().replace(/\s+/g, " ");
    const short = chunk.length > excerptLen ? `${chunk.slice(0, excerptLen)}…` : chunk;
    return `- ${short}`;
  }).join("\n");
  return `From \`${chat.doc.name}\`, the most relevant passages are:\n\n${bullets}\n\nAsk a follow‑up if you want me to focus on a specific section.`;
}

function maybeSummarize(chat, query){
  if (!chat.doc?.text) return null;
  const q = query.toLowerCase();
  if (/\bsummar(ize|y)\b/.test(q) || /\bsummary\b/.test(q)){
    return summarizeText(chat.doc.text, els.simpleToggle.checked ? 5 : 8);
  }
  return null;
}

// ---------- Sending / input ----------
function autoResizeTextarea(){
  const ta = els.queryInput;
  ta.style.height = "auto";
  const next = Math.min(220, ta.scrollHeight);
  ta.style.height = `${next}px`;
}

function pushMessage(chat, role, content){
  const msg = /** @type {ChatMessage} */ ({ id: uid(), role, content, ts: now() });
  chat.messages.push(msg);
  chat.updatedAt = now();
  updateChatTitleFromFirstUserMessage(chat);
  saveChats(chats);
  return msg;
}

async function sendMessage(){
  const query = normalizeText(els.queryInput.value);
  if (!query) return;
  const chat = getActiveChat();

  els.queryInput.value = "";
  autoResizeTextarea();

  pushMessage(chat, "user", query);
  setStatus("Sending…");
  renderAll();

  const thinking = pushMessage(chat, "assistant", "Thinking…");
  renderAll();
  // Replace the placeholder bubble content with animated dots in the DOM.
  const lastBubble = els.chatLog.querySelector(".msgRow:last-child .bubble__content");
  if (lastBubble){
    lastBubble.innerHTML = `Thinking<span class="dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>`;
  }
  requestAnimationFrame(scrollToBottom);

  try{
    const summary = maybeSummarize(chat, query);
    const answer = summary ?? answerFromDoc(chat, query);
    thinking.content = normalizeText(answer) || "(empty response)";
    if (els.ttsToggle.checked){
      speak(thinking.content);
    }
    setStatus("Ready");
  } catch (err){
    thinking.content = `Error: ${err?.message || err}`;
    setStatus("Error");
  } finally {
    els.fileInput.value = "";
    els.composerHint.textContent = chat.doc?.name
      ? `Current file: ${chat.doc.name} • Enter to send`
      : "Upload a file to analyze • Enter to send • Shift+Enter for newline";
    saveChats(chats);
    renderAll();
  }
}

// ---------- Speech (voice input + TTS) ----------
let lastSpokenText = "";

function getVoicesSafe(){
  try{
    return window.speechSynthesis?.getVoices?.() || [];
  } catch {
    return [];
  }
}

function guessVoiceGender(v){
  const n = `${v.name || ""} ${v.voiceURI || ""}`.toLowerCase();
  if (/\b(female|woman|girl|zira|susan|siri|eva|hazel|samantha|victoria)\b/.test(n)) return "female";
  if (/\b(male|man|boy|david|mark|george|daniel|alex|fred)\b/.test(n)) return "male";
  return "any";
}

function pickVoice(){
  const voices = getVoicesSafe();
  if (voices.length === 0) return null;
  const wanted = settings.voiceUri?.trim();
  if (wanted){
    const exact = voices.find((v) => v.voiceURI === wanted);
    if (exact) return exact;
  }
  const pref = settings.genderPref || "any";
  if (pref !== "any"){
    const match = voices.find((v) => guessVoiceGender(v) === pref);
    if (match) return match;
  }
  return voices.find((v) => v.default) || voices[0];
}

function speak(text){
  if (!("speechSynthesis" in window)) return;
  lastSpokenText = String(text || "");
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(lastSpokenText);
  const v = pickVoice();
  if (v) utt.voice = v;
  utt.rate = Number(settings.rate ?? 1);
  utt.pitch = Number(settings.pitch ?? 1);
  utt.volume = Number(settings.volume ?? 1);
  window.speechSynthesis.speak(utt);
}

function pauseSpeak(){
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.pause();
}
function resumeSpeak(){
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.resume();
}
function stopSpeak(){
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

function syncVoiceValueLabels(){
  if (els.rateValue) els.rateValue.textContent = Number(els.rateInput.value).toFixed(2);
  if (els.pitchValue) els.pitchValue.textContent = Number(els.pitchInput.value).toFixed(2);
  if (els.volumeValue) els.volumeValue.textContent = Number(els.volumeInput.value).toFixed(2);
}

function populateVoiceSelect(){
  const sel = els.voiceSelect;
  if (!sel) return;
  const voices = getVoicesSafe();
  sel.innerHTML = "";
  if (voices.length === 0){
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No voices available";
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  const pref = settings.genderPref || "any";
  const sorted = [...voices].sort((a, b) => (a.lang || "").localeCompare(b.lang || "") || (a.name || "").localeCompare(b.name || ""));
  for (const v of sorted){
    if (pref !== "any" && guessVoiceGender(v) !== pref) continue;
    const opt = document.createElement("option");
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} (${v.lang})${v.default ? " • default" : ""}`;
    sel.appendChild(opt);
  }
  // If filtering removed all, fallback to showing all.
  if (sel.options.length === 0){
    for (const v of sorted){
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})${v.default ? " • default" : ""}`;
      sel.appendChild(opt);
    }
  }
  sel.value = settings.voiceUri || pickVoice()?.voiceURI || sel.options[0]?.value || "";
}

function wireSpeechRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition){
    els.micBtn.disabled = true;
    els.micBtn.title = "Speech recognition not supported in this browser.";
    return;
  }
  const rec = new SpeechRecognition();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;

  let finalText = "";
  let listening = false;

  rec.onstart = () => {
    listening = true;
    finalText = "";
    els.micBtn.classList.add("is-listening");
    setStatus("Listening…");
  };
  rec.onend = () => {
    listening = false;
    els.micBtn.classList.remove("is-listening");
    setStatus("Ready");
  };
  rec.onerror = (e) => {
    setStatus("Voice error");
    const chat = getActiveChat();
    pushMessage(chat, "assistant", `Voice input error: ${e.error || "unknown"}`);
    renderAll();
  };
  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++){
      const res = event.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }
    const text = (finalText + " " + interim).trim();
    if (text){
      els.queryInput.value = text;
      autoResizeTextarea();
    }
  };

  els.micBtn.addEventListener("click", () => {
    if (listening){
      rec.stop();
      return;
    }
    try{ rec.start(); } catch {}
  });
}

// ---------- Wiring ----------
function wireEvents(){
  els.newChatBtn.addEventListener("click", createNewChat);

  const toggle = () => els.sidebar.classList.toggle("is-open");
  els.sidebarToggle?.addEventListener("click", toggle);
  els.sidebarToggleTop?.addEventListener("click", toggle);

  els.clearAllBtn.addEventListener("click", () => {
    chats = [];
    activeChatId = "";
    localStorage.removeItem(LS_KEYS.activeChatId);
    saveChats(chats);
    createNewChat();
  });

  els.clearChatBtn.addEventListener("click", () => clearChat(getActiveChat().id));

  els.exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ settings, chats }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ai-learning-agent-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  els.shareBtn.addEventListener("click", async () => {
    const chat = getActiveChat();
    const payload = { title: chat.title, messages: chat.messages };
    try{
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setStatus("Copied chat JSON to clipboard");
      setTimeout(() => setStatus("Ready"), 1200);
    } catch {
      setStatus("Copy failed");
    }
  });

  // Copy assistant message content
  els.chatLog.addEventListener("click", async (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest?.("[data-copy]");
    if (!btn) return;
    const id = btn.getAttribute("data-copy") || "";
    const chat = getActiveChat();
    const msg = chat.messages.find((m) => m.id === id);
    if (!msg) return;
    try{
      await navigator.clipboard.writeText(msg.content);
      setStatus("Copied");
      setTimeout(() => setStatus("Ready"), 900);
    } catch {
      setStatus("Copy failed");
    }
  });

  els.settingsBtn.addEventListener("click", openSettings);
  els.settingsModal.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.getAttribute("data-close") === "true") closeSettings();
  });
  els.saveSettingsBtn.addEventListener("click", () => {
    settings = {
      theme: els.themeSelect.value === "light" ? "light" : "dark",
      genderPref: els.voiceGenderSelect.value === "female" || els.voiceGenderSelect.value === "male" ? els.voiceGenderSelect.value : "any",
      voiceUri: els.voiceSelect.value || "",
      rate: Number(els.rateInput.value),
      pitch: Number(els.pitchInput.value),
      volume: Number(els.volumeInput.value),
    };
    saveSettings(settings);
    applyTheme();
    closeSettings();
    setStatus("Saved");
    setTimeout(() => setStatus("Ready"), 900);
  });

  // Live update labels + preview-safe updates (persist on Save)
  els.rateInput.addEventListener("input", syncVoiceValueLabels);
  els.pitchInput.addEventListener("input", syncVoiceValueLabels);
  els.volumeInput.addEventListener("input", syncVoiceValueLabels);
  els.voiceGenderSelect.addEventListener("change", () => {
    settings.genderPref = els.voiceGenderSelect.value;
    populateVoiceSelect();
  });

  // TTS transport controls (reads last assistant answer)
  els.ttsPlayBtn.addEventListener("click", () => {
    const chat = getActiveChat();
    const last = [...chat.messages].reverse().find((m) => m.role === "assistant");
    const text = last?.content || lastSpokenText;
    if (text) speak(text);
  });
  els.ttsPauseBtn.addEventListener("click", pauseSpeak);
  els.ttsResumeBtn.addEventListener("click", resumeSpeak);
  els.ttsStopBtn.addEventListener("click", stopSpeak);

  els.attachBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", async () => {
    const file = els.fileInput.files?.[0] || null;
    if (!file) return;
    const chat = getActiveChat();
    setStatus("Reading file…");
    renderAll();
    try{
      const text = await extractTextFromFile(file);
      const MAX = 250_000;
      const clipped = text.length > MAX ? text.slice(0, MAX) : text;
      chat.doc = { name: file.name, type: file.type, size: file.size, text: clipped };
      chat.updatedAt = now();
      saveChats(chats);
      lastAttachedName = file.name;
      els.composerHint.textContent = `Current file: ${file.name} • Enter to send`;
      setStatus(`Loaded ${file.name}`);
      pushMessage(chat, "assistant", `Loaded \`${file.name}\`.\n\nAsk me questions about it, or say “summarize”.`);
      renderAll();
    } catch (err){
      setStatus("File error");
      pushMessage(chat, "assistant", `Couldn’t read that file. ${err?.message || err}`);
      renderAll();
    } finally {
      setTimeout(() => setStatus("Ready"), 900);
    }
  });

  els.sendBtn.addEventListener("click", sendMessage);
  els.queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      sendMessage();
    }
  });
  els.queryInput.addEventListener("input", autoResizeTextarea);
  autoResizeTextarea();
}

function init(){
  // Defaults on first run
  if (!localStorage.getItem(LS_KEYS.settings)){
    saveSettings(settings);
  }
  document.body.setAttribute("data-theme", settings.theme);

  if (chats.length === 0){
    createNewChat();
  } else if (!activeChatId || !chats.some((c) => c.id === activeChatId)){
    activeChatId = chats[0].id;
    localStorage.setItem(LS_KEYS.activeChatId, activeChatId);
  }

  wireEvents();
  wireSpeechRecognition();
  // Voices may load async; refresh voice list when available.
  if ("speechSynthesis" in window){
    window.speechSynthesis.onvoiceschanged = () => {
      populateVoiceSelect();
    };
  }
  setStatus("Ready");
  renderAll();
}

init();

