import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

function parseOrigins(value) {
  const raw = (value ?? "").trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resolveProjectPath(value, fallbackRelativePath) {
  const raw = (value ?? "").trim();

  if (!raw) {
    return path.resolve(projectRoot, fallbackRelativePath);
  }

  if (path.isAbsolute(raw)) {
    return path.normalize(raw);
  }

  return path.resolve(projectRoot, raw);
}

export const config = {
  projectRoot,
  port: parsePositiveInteger(process.env.PORT, 8080),
  adminPassword: (process.env.ADMIN_PASSWORD ?? "1234").trim() || "1234",
  corsAllowedOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:5173"),
  dbFilePath: resolveProjectPath(process.env.DB_FILE, "data/db.json"),
  uploadDirPath: resolveProjectPath(process.env.UPLOAD_DIR, "uploads"),
  uploadMaxSizeBytes: parsePositiveInteger(process.env.UPLOAD_MAX_SIZE_BYTES, 15728640),
  defaultWhatsappNumber: (process.env.WHATSAPP_NUMBER ?? "5546999999999").trim(),
  defaultInstagramHandle: (process.env.INSTAGRAM_HANDLE ?? "@judocandoi").trim(),
  defaultAcademyAddress: (process.env.ACADEMY_ADDRESS ?? "Avenida Central, 123 - Candoi/PR").trim(),
  defaultGoogleMapsEmbed: (
    process.env.GOOGLE_MAPS_EMBED ?? "https://www.google.com/maps?q=Candoi%20PR&output=embed"
  ).trim()
};
