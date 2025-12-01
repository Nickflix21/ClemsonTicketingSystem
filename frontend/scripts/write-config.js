const fs = require("fs");
const path = require("path");

const config = {
  AUTH_BASE: process.env.REACT_APP_AUTH_BASE || process.env.AUTH_BASE || null,
  CLIENT_BASE: process.env.REACT_APP_CLIENT_BASE || process.env.CLIENT_BASE || null,
  LLM_BASE: process.env.REACT_APP_LLM_BASE || process.env.LLM_BASE || null,
  ADMIN_BASE: process.env.REACT_APP_ADMIN_BASE || process.env.ADMIN_BASE || null,
};

// only include non-empty entries
const out = Object.fromEntries(Object.entries(config).filter(([k, v]) => v));
const outPath = path.join(__dirname, "..", "public", "config.json");

try {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("Wrote runtime config to:", outPath);
} catch (err) {
  console.error("Failed to write runtime config:", err);
  process.exit(1);
}