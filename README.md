# PrismFlow — Free Online File Converter & AI Background Remover

PrismFlow is a fast, clean, privacy-first web platform inspired by Smallpdf where anyone can upload a PDF or image, convert or edit it, and download the result for free with no account required.

## Implemented & Verified Tools (18 Tools)

### PDF Tools (9)
1. **PDF to Word (.docx)** — Extracts text, headings, and structure via PDF.js (with OCR fallback via Tesseract.js for scanned pages) and packages a valid OpenXML `.docx` document.
2. **PDF to JPG** — Renders PDF pages to high-resolution `.jpg` images (single JPG or ZIP for multi-page PDFs).
3. **PDF to PNG** — Renders PDF pages to lossless `.png` images.
4. **Word to PDF** — Converts `.docx` files into clean `.pdf` documents via Mammoth.js and jsPDF.
5. **JPG to PDF** — Combines one or more JPG images into a PDF with selectable page orientation (`Portrait` / `Landscape`) and page fit (`Fit` / `Full` / `Original`).
6. **PNG to PDF** — Combines one or more PNG images into a PDF with selectable orientation and fit.
7. **Merge PDF** — Merges multiple PDF files in order using `pdf-lib`.
8. **Split PDF** — Extracts custom page ranges (e.g., `1-3, 5`) into a new PDF using `pdf-lib`.
9. **Compress PDF** — Optimizes PDF structure and re-encodes heavy page streams with `Low`, `Medium`, and `High` compression presets (and keeps the original if already smaller).

### Image Tools (9)
10. **JPG to PNG** — Decodes JPEG and encodes lossless PNG while preserving dimensions.
11. **PNG to JPG** — Converts PNG to JPEG with automatic transparency detection and a user-selectable background fill color (`#FFFFFF`, `#000000`, `#F8FAFC`, or custom color).
12. **WebP to PNG** — Converts WebP images to lossless PNG preserving alpha transparency.
13. **PNG to WebP** — Converts PNG to WebP preserving alpha transparency.
14. **JPG to WebP** — Converts JPEG to optimized WebP.
15. **WebP to JPG** — Converts WebP to JPEG with customizable background fill color for transparent regions.
16. **Resize Image** — Resizes PNG, JPG, or WebP images to exact pixel dimensions with optional aspect-ratio lock.
17. **Compress Image** — Compresses images with `Low (85%)`, `Medium (68%)`, and `High (45%)` quality presets and reports exact size savings.
18. **Background Remover** — Automatically removes image backgrounds using multi-seed perimeter flood-fill + edge matting, with interactive Eraser/Restore touch-up brushes, before/after split preview, and transparent PNG download.

## Quick Start (Local Development)

### Option A: Zero-Dependency Static Server (Recommended for Instant Testing)
```bash
npx serve public -l 3000
```
Open `http://localhost:3000` in your browser.

### Option B: Full-Stack Node.js / Express Server
```bash
cp .env.example .env
npm install
npm start
```
Open `http://localhost:3000` (Health check at `http://localhost:3000/api/health`).

## Production Deployment

- **Cloudflare Pages (Recommended):** Upload the `public/` directory directly to Cloudflare Pages or connect your repository with build output directory set to `public`. Because all 18 conversions run in browser WebAssembly/Canvas, it works on Cloudflare Pages with $0 compute cost and no Worker timeout issues.
- **Node.js VPS / Render / Railway / Fly.io:** Deploy the repository root with start command `npm start`.
