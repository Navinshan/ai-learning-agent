const { useMemo, useState, useEffect, useRef } = React;

function SuggestCard({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
    >
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/70">{desc}</div>
      <div className="mt-4 text-xs text-white/50 group-hover:text-white/70 transition">
        Click to start →
      </div>
    </button>
  );
}

function LandingApp() {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const suggestions = useMemo(
    () => [
      {
        title: "Learn AI basics",
        desc: "Start from zero with a guided path.",
        q: "I want to learn AI basics. Make me a study plan.",
      },
      {
        title: "Prepare for interviews",
        desc: "Practice questions and build confidence.",
        q: "Help me prepare for interviews in my domain.",
      },
      {
        title: "Best skills to learn",
        desc: "Pick skills that boost your career.",
        q: "What skills should I learn next and why?",
      },
      {
        title: "Summarize my document",
        desc: "Upload and ask questions instantly.",
        q: "I will upload a file. Summarize it for me.",
      },
    ],
    []
  );

  const goToChat = (q) => {
    const url = new URL(window.location.origin + window.location.pathname.replace(/index\.html$/, "") + "chat.html");
    if (q) url.searchParams.set("q", q);
    window.location.href = url.toString();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const q = ALA.normalizeText(query);
    goToChat(q);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.6)]" />
            AI Learning Agent
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Find knowledge that beats your career
            </span>
          </h1>
          <p className="mt-4 text-white/70 text-base sm:text-lg">
            Talk freely and our AI will guide your learning
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="rounded-full bg-white text-black shadow-[0_18px_60px_rgba(0,0,0,0.55)] border border-white/30 focus-within:border-white/60 focus-within:shadow-[0_0_0_6px_rgba(99,102,241,0.18),0_18px_60px_rgba(0,0,0,0.55)] transition px-4 py-2 flex items-center gap-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I'm looking for..."
                className="flex-1 bg-transparent outline-none px-2 py-2 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // submit
                  }
                }}
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-black/90 text-white px-4 py-2 text-sm font-semibold hover:bg-black transition"
              >
                Start →
              </button>
            </div>
          </div>
        </form>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestions.map((s) => (
            <SuggestCard
              key={s.title}
              title={s.title}
              desc={s.desc}
              onClick={() => goToChat(s.q)}
            />
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-white/45">
          Tip: You can upload PDF/DOCX/PPTX/TXT on the chat page.
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<LandingApp />);

