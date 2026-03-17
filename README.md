# AI Learning Agent (2-page React + Tailwind)

Static GitHub Pages–friendly app (no Node build required) with:

- **Landing page** (`index.html`)
- **Chat page** (`chat.html`) — ChatGPT-style UI
- **n8n webhook** backend integration (`POST { "query": "..." }`)
- Optional file upload (PDF/DOCX/PPTX/TXT) to include document text in requests

## Run

Because browsers block some file features when opening `index.html` directly, run a tiny local server:

```bash
python serve.py
```

Then open the printed URL (usually `http://127.0.0.1:5173/`).

## Supported uploads

- `.txt`, `.md`, `.csv`, `.json` (best)
- `.pdf` (via `pdf.js`)
- `.docx` (via `mammoth`)
- `.pptx` (via `jszip` + slide XML text extraction)

## Backend (n8n)

On the chat page, click **Set webhook URL** (left sidebar) and paste your n8n webhook URL.

Expected format:

- Request: `{ "query": "user message" }`
- Response: `{ "response": "AI answer" }`

## Share as a link (any device)

This is a static site. You can host it anywhere.

### Option A: Netlify (fastest)

1. Create a free Netlify account
2. Drag-and-drop the `D:\HACKMATRIX` folder into Netlify “Deploy”
3. Share the public Netlify URL

### Option B: GitHub Pages

1. Create a GitHub repo and upload these files: `index.html`, `chat.html`, `landing.jsx`, `chat.jsx`, `shared.js`, `serve.py`, `README.md`, `.nojekyll`
2. In GitHub: Settings → Pages → deploy from branch
3. Share the Pages URL

