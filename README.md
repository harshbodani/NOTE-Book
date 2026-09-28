# Paperly

A polished, touch-friendly handwritten notebook prototype. Paperly gives ideas a calm
canvas with smooth ink, highlighter and eraser tools, a colour wheel, shape refinement,
multi-page notebooks, and local real-time save feedback.

## Run locally

Because this is a dependency-free static site, serve the folder with any web server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Drive integration

The Drive connection control is a front-end integration point and demonstrates sync
states in this prototype. Connecting it to a real Google Drive account requires a Google
OAuth client ID and a backend/token-storage strategy; no credentials are embedded in this
repository.
