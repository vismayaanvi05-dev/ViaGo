#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create SVG icons
function createSVGIcon(color1, color2, symbol, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="180" fill="url(#grad)"/>
  <text x="512" y="650" font-size="500" text-anchor="middle" fill="white">${symbol}</text>
</svg>`;
  
  fs.writeFileSync(filename, svg);
  console.log(`✅ Created ${filename}`);
}

// Customer App Icon (Purple gradient with shopping bag emoji)
createSVGIcon('#8B5CF6', '#EC4899', '🛒', '/app/mobile-app/assets/icon.svg');
createSVGIcon('#8B5CF6', '#EC4899', '🛒', '/app/mobile-app/assets/adaptive-icon.svg');
createSVGIcon('#8B5CF6', '#EC4899', '🛒', '/app/mobile-app/assets/splash.svg');

// Delivery App Icon (Pink gradient with delivery truck emoji)
createSVGIcon('#EC4899', '#8B5CF6', '🚚', '/app/delivery-app/assets/icon.svg');
createSVGIcon('#EC4899', '#8B5CF6', '🚚', '/app/delivery-app/assets/adaptive-icon.svg');
createSVGIcon('#EC4899', '#8B5CF6', '🚚', '/app/delivery-app/assets/splash.svg');

// Favicon (smaller)
const faviconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="8" fill="url(#grad)"/>
  <text x="24" y="35" font-size="24" text-anchor="middle" fill="white">H</text>
</svg>`;

fs.writeFileSync('/app/mobile-app/assets/favicon.svg', faviconSVG);
fs.writeFileSync('/app/delivery-app/assets/favicon.svg', faviconSVG);

console.log('✅ All icon assets created!');
console.log('📝 Note: These are SVG placeholders. For production, create proper PNG icons.');
