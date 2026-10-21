/**
 * PrismFlow v3.0 — Security-Hardened Node.js / Express + Python AI Backend Server
 * Supports:
 * - Static hosting of the PrismFlow frontend (/public)
 * - /api/bg-remove: Hybrid Server-Side AI Background Removal (Rembg U2-Net + OpenCV GrabCut)
 * - /api/convert/image: High-speed image conversion & resizing via Sharp
 * - Magic-byte file signature verification (never trusts extensions alone)
 * - Isolated per-request temporary directories with guaranteed cleanup
 * - Filename sanitization, rate limiting, and strict upload size limits
 */

const express = require('express');
const path = require('path');
const fsp = require('fs/promises');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const execFileAsync = promisify(execFile);
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;
const MAX_FILES_PER_OP = parseInt(process.env.MAX_FILES_PER_OP || '20', 10);
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '60000', 10);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "blob:", "data:", "https://cdn.jsdelivr.net", "https://huggingface.co"],
      workerSrc: ["'self'", "blob:", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please wait a few minutes and try again.' }
});
app.use('/api/', apiLimiter);

function sanitizeFilename(name) {
  const base = path.basename(String(name || 'file')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 120) || 'file';
}

function detectMagicSignature(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return 'unknown';
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'pdf';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return 'webp';
  }
  if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) return 'zip_or_docx';
  return 'unknown';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_OP
  }
});

async function withIsolatedTempDir(workFn) {
  const prefix = path.join(os.tmpdir(), 'prismflow-job-');
  const tempDir = await fsp.mkdtemp(prefix);
  try {
    return await workFn(tempDir);
  } finally {
    try {
      await fsp.rm(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'prismflow-api',
    version: '3.0.0',
    aiEngines: ['cie-lab-sobel-browser', 'imgly-isnet-wasm', 'opencv-grabcut-server', 'rembg-u2net-server'],
    limits: {
      maxFileSizeMB: MAX_FILE_SIZE_BYTES / (1024 * 1024),
      maxFilesPerOperation: MAX_FILES_PER_OP
    }
  });
});

app.post('/api/validate', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided for validation.' });
  }
  const detected = detectMagicSignature(req.file.buffer);
  if (detected === 'unknown') {
    return res.status(415).json({
      valid: false,
      error: 'Unsupported or corrupted file signature. Please upload a valid PDF, DOCX, PNG, JPG, or WebP file.'
    });
  }
  return res.json({
    valid: true,
    detectedFormat: detected,
    sanitizedName: sanitizeFilename(req.file.originalname),
    sizeBytes: req.file.size
  });
});

// Server-Side Hybrid AI Background Removal Endpoint (/api/bg-remove)
app.post('/api/bg-remove', upload.single('file'), async (req, res) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an image file.' });
  }
  const sig = detectMagicSignature(req.file.buffer);
  if (!['png', 'jpg', 'webp'].includes(sig)) {
    return res.status(415).json({ error: 'Invalid image signature. Upload a valid PNG, JPG, or WebP image.' });
  }

  try {
    await withIsolatedTempDir(async (tempDir) => {
      const id = crypto.randomUUID();
      const inputPath = path.join(tempDir, `in_${id}.${sig}`);
      const outputPath = path.join(tempDir, `out_${id}.png`);
      await fsp.writeFile(inputPath, req.file.buffer);

      const pyScript = path.join(__dirname, 'ai_bg_engine.py');
      await execFileAsync('python3', [pyScript, inputPath, outputPath], { timeout: REQUEST_TIMEOUT_MS });

      const outBuffer = await fsp.readFile(outputPath);
      const cleanBase = sanitizeFilename(req.file.originalname).replace(/\.[^.]+$/, '');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${cleanBase}_no_bg.png"`);
      res.send(outBuffer);
    });
  } catch (err) {
    res.status(500).json({ error: 'Server AI background removal failed safely. Use client-side AI studio.' });
  }
});

// Server-Side Image Conversion Endpoint
app.post('/api/convert/image', upload.single('file'), async (req, res) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an image file.' });
  }
  const sig = detectMagicSignature(req.file.buffer);
  if (!['png', 'jpg', 'webp'].includes(sig)) {
    return res.status(415).json({ error: 'Invalid image file signature. Only genuine PNG, JPG, and WebP files are accepted.' });
  }

  const targetFormat = String(req.body.format || 'png').toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'webp'].includes(targetFormat)) {
    return res.status(400).json({ error: 'Unsupported target image format.' });
  }

  const bgHex = /^#[0-9A-Fa-f]{6}$/.test(req.body.background || '') ? req.body.background : '#FFFFFF';
  const quality = Math.min(100, Math.max(10, parseInt(req.body.quality || '90', 10)));
  const width = req.body.width ? Math.min(8000, Math.max(16, parseInt(req.body.width, 10))) : null;
  const height = req.body.height ? Math.min(8000, Math.max(16, parseInt(req.body.height, 10))) : null;

  try {
    let sharp;
    try {
      sharp = require('sharp');
    } catch (_) {
      return res.status(501).json({
        error: 'Optional server-side Sharp engine is not installed. Use client-side conversion or run npm install sharp.'
      });
    }

    await withIsolatedTempDir(async (tempDir) => {
      const uniqueId = crypto.randomUUID();
      const inputPath = path.join(tempDir, `in_${uniqueId}`);
      const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
      const outputPath = path.join(tempDir, `out_${uniqueId}.${ext}`);

      await fsp.writeFile(inputPath, req.file.buffer);
      let pipeline = sharp(inputPath);

      if (width || height) {
        pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: false });
      }
      if (ext === 'jpg') {
        pipeline = pipeline.flatten({ background: bgHex }).jpeg({ quality });
      } else if (ext === 'webp') {
        pipeline = pipeline.webp({ quality });
      } else {
        pipeline = pipeline.png({ compressionLevel: 8 });
      }

      await pipeline.toFile(outputPath);
      const outBuffer = await fsp.readFile(outputPath);
      const cleanBase = sanitizeFilename(req.file.originalname).replace(/\.[^.]+$/, '');
      const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename="${cleanBase}_converted.${ext}"`);
      res.send(outBuffer);
    });
  } catch (err) {
    res.status(500).json({ error: 'Image conversion failed safely. The file may be corrupted.' });
  }
});

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, { maxAge: '1h' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` });
  }
  if (err && err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: `Too many files uploaded at once (max ${MAX_FILES_PER_OP}).` });
  }
  return res.status(500).json({ error: 'An unexpected server error occurred while processing your request.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PrismFlow v3.0 Server listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, detectMagicSignature, sanitizeFilename, withIsolatedTempDir };
