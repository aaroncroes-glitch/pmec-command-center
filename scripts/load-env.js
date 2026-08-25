/**
 * Custom environment loader that prioritizes system environment variables
 * over .env file values. This ensures that Manus platform-injected variables
 * are not overridden by placeholder values in .env
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [".env", ".env.local"].map((name) => path.resolve(process.cwd(), name));
const isUsableClerkPublishableKey = (value) => {
  const match = value?.match(/^pk_(?:test|live)_([A-Za-z0-9_-]+)$/);
  if (!match) return false;
  try {
    const normalized = match[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(match[1].length / 4) * 4, "=");
    return Buffer.from(normalized, "base64").toString("utf8").includes("clerk");
  } catch {
    return false;
  }
};

envPaths.forEach((envPath) => {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");

  lines.forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) return;

    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    const replaceMalformedClerkKey = key === "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" && !isUsableClerkPublishableKey(process.env[key]);
    if (!process.env[key] || replaceMalformedClerkKey) process.env[key] = value;
  });
});

// Map system variables to Expo public variables
const mappings = {
  VITE_APP_ID: "EXPO_PUBLIC_APP_ID",
  VITE_OAUTH_PORTAL_URL: "EXPO_PUBLIC_OAUTH_PORTAL_URL",
  OAUTH_SERVER_URL: "EXPO_PUBLIC_OAUTH_SERVER_URL",
  OWNER_OPEN_ID: "EXPO_PUBLIC_OWNER_OPEN_ID",
  OWNER_NAME: "EXPO_PUBLIC_OWNER_NAME",
};

for (const [systemVar, expoVar] of Object.entries(mappings)) {
  if (process.env[systemVar] && !process.env[expoVar]) {
    process.env[expoVar] = process.env[systemVar];
  }
}
