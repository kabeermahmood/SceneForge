const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const STANDALONE = path.join(ROOT, ".next", "standalone");

console.log("Preparing standalone build for Electron...\n");

// 1. Copy .next/static → .next/standalone/.next/static
const staticSrc = path.join(ROOT, ".next", "static");
const staticDest = path.join(STANDALONE, ".next", "static");

if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("  ✓ Copied .next/static → standalone/.next/static");
} else {
  console.warn("  ⚠ .next/static not found — skipping");
}

// 2. Copy public → .next/standalone/public
const publicSrc = path.join(ROOT, "public");
const publicDest = path.join(STANDALONE, "public");

if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("  ✓ Copied public → standalone/public");
} else {
  fs.mkdirSync(publicDest, { recursive: true });
  console.log("  ✓ Created empty standalone/public");
}

console.log("\n✅ Electron build preparation complete!");
