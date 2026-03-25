# AI Learning Agent (2-page React + Tailwind + Python Backend)

Static GitHub Pages–friendly app with Python Flask backend for AI chat functionality.

- **Landing page** (`index.html`)
- **Chat page** (`chat.html`) — ChatGPT-style UI with Python backend
- **Flask backend** (`app.py`) — Handles chat requests
- Optional file upload (PDF/DOCX/PPTX/TXT) to include document text in requests

## Run Locally

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the Flask app:

```bash
python app.py
```

Open the printed URL (usually `http://127.0.0.1:5000/`).

## Supported uploads

- `.txt`, `.md`, `.csv`, `.json` (best)
- `.pdf` (via `pdf.js`)
- `.docx` (via `mammoth`)
- `.pptx` (via `jszip` + slide XML text extraction)

## Backend

The Flask app (`app.py`) serves the static files and provides a `/api/chat` endpoint.

Expected request: `{ "query": "user message" }` (optional: `{ "file": { "name": "...", "text": "..." } }`)

Response: `{ "response": "AI answer" }`

Currently, it returns a placeholder response. Integrate with your preferred AI API (e.g., OpenAI, Anthropic) in the `/api/chat` route.

## Share as a link (any device)

This app can be hosted on any platform that supports Python/Flask.

### Option A: Heroku (recommended for Python apps)

1. Create a free Heroku account
2. Install Heroku CLI
3. In the project directory:
   ```bash
   heroku create your-app-name
   git push heroku master
   ```
4. Share the Heroku URL

### Option B: Render

1. Create a free Render account
2. Connect your GitHub repo
3. Deploy as a Web Service (Python)
4. Share the Render URL

### Option C: Railway

1. Create a free Railway account
2. Connect your GitHub repo
3. Deploy automatically
4. Share the Railway URL

