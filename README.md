# AI Learning Agent (Client‑side)

ChatGPT-style UI with:

- Upload a file and ask questions using **only that file**
- Mic button for **voice input** (browser speech recognition)
- Text-to-speech with **voice selection**, **speed/pitch/volume**, **play/pause/resume/stop**
- Works fully in the browser (no server)

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

## Notes

- “Answer from file” is retrieval-based (finds relevant passages and shows them).
- “Summarize file” is extractive summarization (sentence scoring).
- Voice input support depends on browser (Chrome/Edge recommended).

## Share as a link (any device)

This is a static site. You can host it anywhere.

### Option A: Netlify (fastest)

1. Create a free Netlify account
2. Drag-and-drop the `D:\HACKMATRIX` folder into Netlify “Deploy”
3. Share the public Netlify URL

### Option B: GitHub Pages

1. Create a GitHub repo and upload these files: `index.html`, `styles.css`, `app.js`, `serve.py`, `README.md`
2. In GitHub: Settings → Pages → deploy from branch
3. Share the Pages URL

