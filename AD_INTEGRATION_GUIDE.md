# PrismFlow Advertising Integration Guide

PrismFlow includes two non-intrusive, pre-styled, policy-compliant ad containers that remain hidden (`hidden` class) by default so your interface looks clean even before ad scripts are enabled.

## 1. Reserved Ad Placement Containers in `public/index.html`

1. **Below-Hero Responsive Banner (`#ad-slot-below-hero`)**
   - Attribute: `data-ad-slot="below-hero"`
   - Recommended size: Responsive `728×90` Leaderboard on desktop / `320×100` on mobile.
   - Safe spacing: Separated from the upload dropzone and conversion controls by generous padding so users never accidentally click an ad while uploading or downloading files.

2. **Between-Sections Native / Display Slot (`#ad-slot-between-sections`)**
   - Attribute: `data-ad-slot="between-sections"`
   - Placed between the Main Tools Grid and the "How It Works" section.

## 2. How to Enable Google AdSense or EthicalAds Later

1. Open `public/index.html`.
2. Add your ad network script inside `<head>` (for example, Google AdSense):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
3. Locate `#ad-slot-below-hero` and `#ad-slot-between-sections`, remove the `hidden` class from the `<aside>` element, and paste your `<ins class="adsbygoogle" ...></ins>` tag inside the inner `.ad-slot-placeholder` container.
4. Or call `window.PrismFlowAds.enableSlots()` from the browser console or your ad loader script to reveal the reserved containers dynamically.
