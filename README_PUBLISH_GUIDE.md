# PrismFlow Studio — Complete Publish-Ready Full-Stack Package

This archive contains everything you need to publish **PrismFlow Studio** (Free PDF-to-Word `.docx` Converter, Live Document Editor, Automatic AI Background Remover & 3D Product Studio) either for **$0.00/month** on Cloudflare Pages / Netlify / GitHub Pages, or as a full-stack **Node.js + Express** server.

## What's Inside This ZIP Package
- `index.html` & `public/index.html` — The complete, self-contained production frontend with:
  - **Bulletproof Document Upload & Conversion Engine**: Supports `.pdf` (via Mozilla `PDF.js` with automatic worker fallback & visual page rendering), `.docx` (via `Mammoth.js`), `.txt`, `.md`, and `.html`, exporting to **True OpenXML `.docx`** (via `JSZip`), **Binary `.pdf`** (via `jsPDF`), `.doc`, `.md`, `.txt`, and `.html`.
  - **Automatic Multi-Stage AI Background Remover**: Uses 48-point perimeter color clustering + Breadth-First Search (BFS) flood-fill + Sobel edge protection to strip backgrounds automatically on upload, with **White Sticker Outline**, **3D Drop Shadow**, **Cyber Neon Glow**, and **ID Photo 2x2 Grid** layouts.
  - **Clean Smallpdf-Inspired UI with Hideable Slide-Out Drawers**: Keeps the workspace simple and uncluttered while sliding out fine-tune controls, page thumbnails, and the Three.js 3D showroom on demand.
- `server/server.js` & `package.json` — Production Node.js + Express backend server.
- `functions/api/health.js` & `wrangler.toml` — Cloudflare Pages Serverless Edge Function configuration.
- `public/ads.txt` & `public/robots.txt` — Pre-configured for Google AdSense and search engine indexing.

---

## Option A: Publish for $0.00/Month on Cloudflare Pages (Recommended — Unlimited Bandwidth)
1. Unzip this folder on your computer.
2. Go to [Cloudflare Dashboard -> Workers & Pages](https://dash.cloudflare.com/) and sign up for a free account.
3. Click **Create Application** -> **Pages** -> **Upload Assets**.
4. Name your project `prismflow-studio` and drag-and-drop the `public` folder (or the unzipped folder).
5. Click **Deploy Site** — your website will be live globally on `https://prismflow-studio.pages.dev` in 30 seconds at $0 cost!

## Option B: Run as a Full-Stack Node.js + Express Server (Local, Render, Railway, or VPS)
1. Unzip this folder and open a terminal inside it.
2. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
3. Open `http://localhost:3000` in your browser.
