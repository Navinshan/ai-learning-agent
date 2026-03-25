const { useEffect, useMemo, useRef, useState } = React;

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Spinner() {
  return (
    <div className="inline-flex items-center gap-2 text-white/70 text-sm">
      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white/80 animate-spin" />
      Thinking…
    </div>
  );
}

function CodeBlock({ text }) {
  return (
    <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/90">
      <code>{text}</code>
    </pre>
  );
}

function MessageBubble({ role, content, ts, onCopy, onSpeak }) {
  const isUser = role === "user";

  // basic code fence rendering
  const parts = String(content || "").split(/```/g);
  const nodes = [];
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    const isCode = i % 2 === 1;
    if (!isCode) {
      nodes.push(
        <div key={i} className="whitespace-pre-wrap leading-relaxed">
          {chunk}
        </div>
      );
    } else {
      const lines = chunk.replace(/^\n/, "").split("\n");
      const maybeLang = lines[0].trim();
      const code = /^[a-z0-9#+._-]{1,20}$/i.test(maybeLang) ? lines.slice(1).join("\n") : lines.join("\n");
      nodes.push(<CodeBlock key={i} text={code} />);
    }
  }

  return (
    <div className={cx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[92%] md:max-w-[70%] rounded-2xl px-4 py-3 border shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300",
          isUser
            ? "bg-emerald-400/10 border-emerald-400/30"
            : "bg-white/5 border-white/10"
        )}
      >
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wide text-white/50">
          <span>{isUser ? "You" : "Assistant"}</span>
          <span className="normal-case tracking-normal">{formatTime(ts)}</span>
        </div>
        <div className="mt-2 text-sm text-white">{nodes}</div>

        {!isUser && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onCopy}
              className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:scale-105 px-3 py-1 text-xs text-white/80 transition-all duration-300"
            >
              Copy
            </button>
            <button
              onClick={onSpeak}
              className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:scale-105 px-3 py-1 text-xs text-white/80 transition-all duration-300"
            >
              Read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

  const [settings, setSettings] = useState(() => ALA.loadSettings());
  const [chats, setChats] = useState(() => ALA.loadChats());
  const [activeChatId, setActiveChatId] = useState(() => ALA.getActiveChatId());
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const logRef = useRef(null);

  const activeChat = useMemo(() => {
    let chat = chats.find((c) => c.id === activeChatId);
    if (!chat) {
      chat = { id: ALA.uid(), title: "New chat", createdAt: ALA.now(), updatedAt: ALA.now(), messages: [] };
      const next = [chat, ...chats];
      setChats(next);
      setActiveChatId(chat.id);
      ALA.saveChats(next);
      ALA.setActiveChatId(chat.id);
    }
    return chat;
  }, [chats, activeChatId]);

  useEffect(() => {
    ALA.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    ALA.saveChats(chats);
  }, [chats]);

  useEffect(() => {
    if (activeChatId) ALA.setActiveChatId(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const q = ALA.getQueryParam("q");
    if (q) {
      setText(q);
      // Optional auto-send:
      // setTimeout(() => sendMessage(q), 200);
    }
  }, []);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [activeChat?.messages?.length, loading]);

  const newChat = () => {
    const chat = { id: ALA.uid(), title: "New chat", createdAt: ALA.now(), updatedAt: ALA.now(), messages: [] };
    const next = [chat, ...chats];
    setChats(next);
    setActiveChatId(chat.id);
  };

  const updateActiveChat = (updater) => {
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? updater({ ...c }) : c))
    );
  };

  const extractTextFromFile = async (file) => {
    const name = file.name || "uploaded";
    const type = (file.type || "").toLowerCase();
    const ext = name.split(".").pop()?.toLowerCase() || "";

    if (type.startsWith("text/") || ["txt", "md", "csv", "log", "json"].includes(ext)) {
      return ALA.normalizeText(await file.text());
    }

    if (type === "application/pdf" || ext === "pdf") {
      if (!window.pdfjsLib) throw new Error("PDF.js failed to load.");
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";
      }
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf, disableStream: true, disableRange: true }).promise;
      let out = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        out += `\n\n[Page ${p}]\n` + content.items.map((it) => it.str).join(" ");
      }
      return ALA.normalizeText(out);
    }

    if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      const buf = await file.arrayBuffer();
      const res = await window.mammoth.extractRawText({ arrayBuffer: buf });
      return ALA.normalizeText(res.value || "");
    }

    if (
      type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      ext === "pptx"
    ) {
      const buf = await file.arrayBuffer();
      const zip = await window.JSZip.loadAsync(buf);
      const slidePaths = Object.keys(zip.files)
        .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
        .sort((a, b) => {
          const na = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
          const nb = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
          return na - nb;
        });
      let out = "";
      const parser = new DOMParser();
      for (const path of slidePaths) {
        const xml = await zip.file(path).async("string");
        const doc = parser.parseFromString(xml, "application/xml");
        const texts = Array.from(doc.getElementsByTagName("a:t")).map((n) => n.textContent || "");
        out += `\n\n[${path.split("/").pop()}]\n` + texts.join(" ");
      }
      return ALA.normalizeText(out);
    }

    throw new Error("Unsupported file type for analysis. Upload PDF/DOCX/PPTX/TXT.");
  };

  const onPickFile = async (file) => {
    setError("");
    if (!file) return;
    try {
      setFileName(file.name);
      const txt = await extractTextFromFile(file);
      setFileText(txt);
    } catch (e) {
      setFileName(file.name);
      setFileText("");
      setError(String(e?.message || e));
    }
  };

  const sendMessage = async (overrideText) => {
    const q = ALA.normalizeText(overrideText ?? text);
    if (!q) return;

    setError("");
    setLoading(true);
    setText("");

    updateActiveChat((c) => {
      const msg = { id: ALA.uid(), role: "user", content: q, ts: ALA.now() };
      const next = { ...c, messages: [...c.messages, msg], updatedAt: ALA.now() };
      if (next.title === "New chat") next.title = q.slice(0, 44);
      return next;
    });

    try {
      const payload = {
        query: settings.explainSimply ? `Explain simply: ${q}` : q,
      };
      // Optional file context
      if (fileText) {
        payload.file = { name: fileName, text: fileText.slice(0, 200000) };
      }
      const body = await ALA.postWebhook('/api/chat', payload);
      const resp = ALA.coerceResponse(body);

      updateActiveChat((c) => {
        const msg = { id: ALA.uid(), role: "assistant", content: resp, ts: ALA.now() };
        return { ...c, messages: [...c.messages, msg], updatedAt: ALA.now() };
      });
    } catch (e) {
      setError(String(e?.message || e));
      updateActiveChat((c) => {
        const msg = { id: ALA.uid(), role: "assistant", content: `Error: ${String(e?.message || e)}`, ts: ALA.now() };
        return { ...c, messages: [...c.messages, msg], updatedAt: ALA.now() };
      });
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(String(text || ""));
    utt.rate = 1;
    window.speechSynthesis.speak(utt);
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      setText((finalText + " " + interim).trim());
    };
    rec.start();
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[300px] shrink-0 border-r border-white/10 bg-white/5 p-4 flex-col">
        <div className="flex items-center justify-between">
          <div className="font-semibold">AI Learning Agent</div>
          <a href="./index.html" className="text-xs text-white/60 hover:text-white/80">
            Home
          </a>
        </div>
        <button
          onClick={newChat}
          className="mt-4 rounded-xl bg-emerald-400/15 border border-emerald-400/30 px-3 py-2 text-sm hover:bg-emerald-400/20 transition text-left"
        >
          + New Chat
        </button>

        <div className="mt-4 text-xs text-white/50">Chats</div>
        <div className="mt-2 flex-1 overflow-auto space-y-2 pr-1">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChatId(c.id)}
              className={cx(
                "w-full text-left rounded-xl px-3 py-2 border transition",
                c.id === activeChat.id ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/8"
              )}
            >
              <div className="text-sm text-white/90 truncate">{c.title || "New chat"}</div>
              <div className="text-[11px] text-white/50 truncate">
                {c.messages?.length || 0} messages
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <span className="text-white/80">Explain Simply</span>
            <input
              type="checkbox"
              checked={settings.explainSimply}
              onChange={(e) => setSettings((s) => ({ ...s, explainSimply: e.target.checked }))}
            />
          </label>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b border-white/10 bg-white/5 flex items-center px-4 gap-3">
          <div className="font-semibold truncate">{activeChat.title || "New chat"}</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                const newTheme = ALA.toggleTheme();
                setSettings((s) => ({ ...s, theme: newTheme }));
              }}
              className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-white/70 transition"
            >
              {settings.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={() => {
                updateActiveChat((c) => ({ ...c, messages: [] }));
              }}
              className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-white/70 transition"
            >
              Clear chat
            </button>
          </div>
        </header>

        {/* Messages */}
        <section ref={logRef} className="flex-1 overflow-auto px-4 py-5 space-y-4">
          {activeChat.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
              Upload a file (optional), then ask anything. Start chatting with the AI assistant.
            </div>
          ) : (
            activeChat.messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                ts={m.ts}
                onCopy={() => navigator.clipboard.writeText(m.content)}
                onSpeak={() => speak(m.content)}
              />
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Spinner />
              </div>
            </div>
          )}
        </section>

        {/* Input */}
        <footer className="border-t border-white/10 bg-white/5 p-4">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <label className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                File: <span className="text-white/90">{fileName || "none"}</span>
              </label>
              <input
                type="file"
                className="text-xs text-white/70"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={startVoiceInput}
                className="ml-auto rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-white/70 transition"
              >
                🎙️ Voice
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 focus-within:border-white/20 transition p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message AI Learning Agent…"
                rows={1}
                className="w-full resize-none bg-transparent outline-none text-sm text-white placeholder:text-white/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) sendMessage();
                  }
                }}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-white/40">Enter to send • Shift+Enter for newline</div>
                <button
                  disabled={loading}
                  onClick={() => sendMessage()}
                  className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ChatApp />);

