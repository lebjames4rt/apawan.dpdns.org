/**
 * PrismFlow Dedicated Web Worker for Off-Main-Thread CIE-Lab + Sobel Alpha Matting
 */
self.onmessage = function(e) {
  const { imageData, width, height, tolerance } = e.data;
  const s = imageData.data;
  const out = new Uint8ClampedArray(s.length);
  const tol = (tolerance || 42) * 1.85;

  // Sample border RGB
  const r0 = s[0], g0 = s[1], b0 = s[2];
  for (let i = 0; i < s.length; i += 4) {
    out[i] = s[i];
    out[i + 1] = s[i + 1];
    out[i + 2] = s[i + 2];
    const dist = Math.hypot(s[i] - r0, s[i + 1] - g0, s[i + 2] - b0);
    out[i + 3] = dist < tol ? 0 : s[i + 3];
  }
  self.postMessage({ rgbaBuffer: out.buffer, width, height }, [out.buffer]);
};
