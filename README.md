# Santa PFP Maker 🎅

Full-stack React + Express playground to mint a Santa-themed profile picture with AI image generation, canvas polish, and quick-share buttons.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/santa-pfp)

## Quick start

1. Install deps:
   ```powershell
   npm install
   npm install --prefix client
   npm install --prefix server
   ```
2. Copy `server/.env.example` to `server/.env` and set `OPENAI_API_KEY` (keep it server-side; do **not** place keys in the client). Optional: set `OPENAI_MODEL` (defaults to `dall-e-3`).
3. Run both apps together:
   ```powershell
   npm run dev
   ```
   - Vite client on http://localhost:5173 (proxied `/api` to the server)
   - Express server on http://localhost:5002 (dev default)

   If you want the server on 5001 instead:
   ```powershell
   $env:PORT=5001
   $env:VITE_API_PORT=5001
   npm run dev
   ```

## Features
- Snow animation overlay and Santa-styled UI with Google fonts.
- Canvas editor: upload image or use AI render, scale/offset, hue/saturation, glow, frost rim, halo ring, Santa hat overlay, badge title/subtitle, and bold text overlay.
- Buttons for Twitter share, Dexscreener link, copy-contract, and PNG export.
- Backend `/api/generate` proxies to OpenAI images (DALL·E) so the API key stays server-side.

## Deploy to Vercel

1. **Push to GitHub:**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: Santa PFP Maker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/santa-pfp.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Visit [vercel.com](https://vercel.com) and import your GitHub repository
   - Add environment variable: `OPENAI_API_KEY` (use the Vercel dashboard)
   - Optional: Set `OPENAI_MODEL` to `dall-e-3` (defaults to this if not set)
   - Deploy!

3. **Environment Variables:**
   - In Vercel dashboard, go to: Project Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = your OpenAI key
   - Add: `OPENAI_MODEL` = `dall-e-3` (optional)

## Notes
- The default contract string is in `client/src/App.jsx` (`defaultContract`).
- If `fetch` is unavailable in your Node runtime, add a fetch polyfill or upgrade to Node 18+.
- Keep secrets out of git; `.env` is already ignored.
- For Vercel deployment, the API routes are automatically handled via serverless functions.
