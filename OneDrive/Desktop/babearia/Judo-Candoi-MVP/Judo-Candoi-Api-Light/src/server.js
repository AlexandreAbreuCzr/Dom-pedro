import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import multer from "multer";
import { config } from "./config.js";
import { buildSiteContent } from "./content.js";
import { conflict, errorHandler, notFound, unauthorized, badRequest } from "./errors.js";
import { JsonStore } from "./store.js";
import {
  parsePositiveId,
  validateBlogPostUpsertPayload,
  validateLeadCreatePayload,
  validatePrideStudentUpsertPayload,
  validateSiteSettingsUpdatePayload,
  validateSponsorUpsertPayload
} from "./validators.js";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_FOLDERS = new Set(["blog", "sponsors", "site", "gallery", "general"]);

const app = express();
const store = new JsonStore(config);

store.load();
fs.mkdirSync(config.uploadDirPath, { recursive: true });

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.corsAllowedOrigins.length === 0 || config.corsAllowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-Password"]
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.uploadMaxSizeBytes
  }
});

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  "/uploads",
  express.static(config.uploadDirPath, {
    maxAge: "30d"
  })
);

function sortByDisplayOrderAndId(a, b) {
  const byDisplayOrder = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

  if (byDisplayOrder !== 0) {
    return byDisplayOrder;
  }

  return (a.id ?? 0) - (b.id ?? 0);
}

function normalizeBlogContent(content, excerpt) {
  if (typeof content !== "string" || content.trim().length === 0) {
    return excerpt;
  }

  return content.trim();
}

function normalizeImageUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function toBlogAdminResponse(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: normalizeBlogContent(post.content, post.excerpt),
    imageUrl: normalizeImageUrl(post.imageUrl),
    active: Boolean(post.active),
    displayOrder: post.displayOrder ?? 0
  };
}

function toPrideAdminResponse(student) {
  return {
    id: student.id,
    name: student.name,
    achievement: student.achievement,
    month: student.month,
    imageUrl: student.imageUrl,
    active: Boolean(student.active),
    displayOrder: student.displayOrder ?? 0
  };
}

function toSponsorAdminResponse(sponsor) {
  return {
    id: sponsor.id,
    name: sponsor.name,
    description: sponsor.description,
    logoUrl: sponsor.logoUrl,
    websiteUrl: sponsor.websiteUrl,
    active: Boolean(sponsor.active),
    displayOrder: sponsor.displayOrder ?? 0
  };
}

function toSiteSettingsAdminResponse(settings) {
  return {
    id: settings.id,
    brandName: settings.brandName,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    impactPhrase: settings.impactPhrase,
    callToActionPrimaryLabel: settings.callToActionPrimaryLabel,
    callToActionPrimaryUrl: settings.callToActionPrimaryUrl,
    callToActionSecondaryLabel: settings.callToActionSecondaryLabel,
    aboutTitle: settings.aboutTitle,
    aboutStory: settings.aboutStory,
    aboutHighlight: settings.aboutHighlight,
    trialTitle: settings.trialTitle,
    trialDescription: settings.trialDescription,
    finalCallToAction: settings.finalCallToAction,
    counterStudents: settings.counterStudents,
    counterMedals: settings.counterMedals,
    counterYears: settings.counterYears,
    medalCompetitions: settings.medalCompetitions,
    medalFights: settings.medalFights,
    medalGold: settings.medalGold,
    medalSilver: settings.medalSilver,
    medalBronze: settings.medalBronze,
    whatsappNumber: settings.whatsappNumber,
    instagramHandle: settings.instagramHandle,
    academyAddress: settings.academyAddress,
    googleMapsEmbed: settings.googleMapsEmbed
  };
}

function extractExtension(fileName) {
  if (typeof fileName !== "string") {
    return "";
  }

  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).trim().toLowerCase();
}

function padTwo(value) {
  return String(value).padStart(2, "0");
}

function timestampPrefix(date = new Date()) {
  const year = date.getFullYear();
  const month = padTwo(date.getMonth() + 1);
  const day = padTwo(date.getDate());
  const hour = padTwo(date.getHours());
  const minute = padTwo(date.getMinutes());
  const second = padTwo(date.getSeconds());

  return `${year}${month}${day}${hour}${minute}${second}`;
}

function buildFileName(extension) {
  const prefix = timestampPrefix();
  const randomPart = randomUUID().replaceAll("-", "");
  return `${prefix}-${randomPart}.${extension}`;
}

function normalizeFolder(requestedFolder) {
  if (typeof requestedFolder !== "string" || requestedFolder.trim().length === 0) {
    return "general";
  }

  const normalized = requestedFolder.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!ALLOWED_FOLDERS.has(normalized)) {
    return "general";
  }

  return normalized;
}

function normalizeContentType(providedContentType, extension) {
  if (typeof providedContentType === "string" && providedContentType.trim().length > 0) {
    return providedContentType.trim();
  }

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

function resolveImageFilePath(relativePath) {
  const absoluteUploadRoot = path.resolve(config.uploadDirPath);
  const resolvedPath = path.resolve(absoluteUploadRoot, relativePath ?? "");

  if (resolvedPath !== absoluteUploadRoot && !resolvedPath.startsWith(`${absoluteUploadRoot}${path.sep}`)) {
    throw notFound("Imagem nao encontrada para id informado.");
  }

  return resolvedPath;
}

function requireAdminPassword(req, _res, next) {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const providedPassword = req.get("X-Admin-Password");

  if (
    typeof providedPassword === "string" &&
    providedPassword.trim().length > 0 &&
    providedPassword === config.adminPassword
  ) {
    next();
    return;
  }

  next(unauthorized("Senha do painel invalida."));
}

app.get("/api/v1/site/content", (_req, res) => {
  const settings = store.getSiteSettings();
  const blogPosts = store
    .listBlogPosts()
    .filter((post) => post.active)
    .sort(sortByDisplayOrderAndId);
  const sponsors = store
    .listSponsors()
    .filter((sponsor) => sponsor.active)
    .sort(sortByDisplayOrderAndId);
  const prideStudents = store
    .listPrideStudents()
    .filter((student) => student.active)
    .sort(sortByDisplayOrderAndId);

  const content = buildSiteContent(settings, blogPosts, sponsors, prideStudents);
  res.status(200).json(content);
});

app.post("/api/v1/leads/experimental-class", (req, res, next) => {
  try {
    const payload = validateLeadCreatePayload(req.body);
    const createdLead = store.createLead(payload);

    res.status(201).json({
      id: createdLead.id,
      name: createdLead.name,
      age: createdLead.age,
      phone: createdLead.phone,
      objective: createdLead.objective,
      createdAt: createdLead.createdAt,
      message: "Solicitacao recebida com sucesso. Entraremos em contato pelo WhatsApp."
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/leads/experimental-class", (_req, res) => {
  const leads = store.listLeads().map((lead) => ({
    id: lead.id,
    name: lead.name,
    age: lead.age,
    phone: lead.phone,
    objective: lead.objective,
    createdAt: lead.createdAt,
    message: "Solicitacao armazenada"
  }));

  res.status(200).json(leads);
});

function sendUploadedImage(req, res, next) {
  try {
    const imageId = parsePositiveId(req.params.imageId);
    const image = store.findUploadedImageById(imageId);

    if (!image) {
      throw notFound(`Imagem nao encontrada para id: ${imageId}`);
    }

    const imagePath = resolveImageFilePath(image.relativePath);

    if (!fs.existsSync(imagePath)) {
      throw notFound(`Imagem nao encontrada para id: ${imageId}`);
    }

    const bytes = fs.readFileSync(imagePath);

    res
      .status(200)
      .set("Cache-Control", "public, max-age=2592000")
      .set("Content-Type", image.contentType || "application/octet-stream")
      .set("Content-Length", String(image.sizeInBytes ?? bytes.length))
      .send(bytes);
  } catch (error) {
    next(error);
  }
}

app.get("/api/v1/uploads/images/:imageId", sendUploadedImage);
app.get("/api/v1/uploads/images/:imageId/:fileName", sendUploadedImage);

const adminRouter = express.Router();
adminRouter.use(requireAdminPassword);

adminRouter.get("/auth/check", (_req, res) => {
  res.status(200).json({ status: "authorized" });
});

adminRouter.get("/site-settings", (_req, res) => {
  const settings = store.getSiteSettings();
  res.status(200).json(toSiteSettingsAdminResponse(settings));
});

adminRouter.put("/site-settings", (req, res, next) => {
  try {
    const payload = validateSiteSettingsUpdatePayload(req.body);
    const updated = store.updateSiteSettings(payload);
    res.status(200).json(toSiteSettingsAdminResponse(updated));
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/blog-posts", (_req, res) => {
  const posts = store.listBlogPosts().map(toBlogAdminResponse);
  res.status(200).json(posts);
});

adminRouter.post("/blog-posts", (req, res, next) => {
  try {
    const payload = validateBlogPostUpsertPayload(req.body);

    if (store.hasBlogSlug(payload.slug)) {
      throw conflict("Violacao de integridade de dados.", "Slug ja cadastrado");
    }

    const created = store.createBlogPost(payload);
    res.status(201).json(toBlogAdminResponse(created));
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/blog-posts/:id", (req, res, next) => {
  try {
    const id = parsePositiveId(req.params.id);
    const payload = validateBlogPostUpsertPayload(req.body);

    const existing = store.findBlogPostById(id);
    if (!existing) {
      throw notFound(`Post do blog nao encontrado para id: ${id}`);
    }

    if (store.hasBlogSlug(payload.slug, id)) {
      throw conflict("Violacao de integridade de dados.", "Slug ja cadastrado");
    }

    const updated = store.updateBlogPost(id, payload);
    res.status(200).json(toBlogAdminResponse(updated));
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/blog-posts/:id", (req, res, next) => {
  try {
    const id = parsePositiveId(req.params.id);
    const deleted = store.deleteBlogPost(id);

    if (!deleted) {
      throw notFound(`Post do blog nao encontrado para id: ${id}`);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/pride-students", (_req, res) => {
  const students = store.listPrideStudents().map(toPrideAdminResponse);
  res.status(200).json(students);
});

adminRouter.post("/pride-students", (req, res, next) => {
  try {
    const payload = validatePrideStudentUpsertPayload(req.body);
    const created = store.createPrideStudent(payload);
    res.status(201).json(toPrideAdminResponse(created));
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/pride-students/:id", (req, res, next) => {
  try {
    const id = parsePositiveId(req.params.id);
    const payload = validatePrideStudentUpsertPayload(req.body);

    const existing = store.findPrideStudentById(id);
    if (!existing) {
      throw notFound(`Aluno destaque nao encontrado para id: ${id}`);
    }

    const updated = store.updatePrideStudent(id, payload);
    res.status(200).json(toPrideAdminResponse(updated));
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/pride-students/:id", (req, res, next) => {
  try {
    const id = parsePositiveId(req.params.id);
    const deleted = store.deletePrideStudent(id);

    if (!deleted) {
      throw notFound(`Aluno destaque nao encontrado para id: ${id}`);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/sponsors", (_req, res) => {
  const sponsors = store.listSponsors().map(toSponsorAdminResponse);
  res.status(200).json(sponsors);
});

adminRouter.post("/sponsors", (req, res, next) => {
  try {
    const payload = validateSponsorUpsertPayload(req.body);
    const created = store.createSponsor(payload);
    res.status(201).json(toSponsorAdminResponse(created));
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/sponsors/:id", (req, res, next) => {
  try {
    const id = parsePositiveId(req.params.id);
    const payload = validateSponsorUpsertPayload(req.body);

    const existing = store.findSponsorById(id);
    if (!existing) {
      throw notFound(`Patrocinador nao encontrado para id: ${id}`);
    }

    const updated = store.updateSponsor(id, payload);
    res.status(200).json(toSponsorAdminResponse(updated));
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/sponsors/:id", (req, res, next) => {
  try {
    const id = parsePositiveId(req.params.id);
    const deleted = store.deleteSponsor(id);

    if (!deleted) {
      throw notFound(`Patrocinador nao encontrado para id: ${id}`);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/uploads/images", upload.single("file"), (req, res, next) => {
  try {
    const file = req.file;

    if (!file || file.size === 0) {
      throw badRequest("Selecione uma imagem para enviar.");
    }

    const extension = extractExtension(file.originalname);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw badRequest("Formato invalido. Use JPG, PNG, WEBP ou GIF.");
    }

    if (typeof file.mimetype !== "string" || !file.mimetype.toLowerCase().startsWith("image/")) {
      throw badRequest("Apenas arquivos de imagem sao permitidos.");
    }

    const folder = normalizeFolder(req.body?.folder);
    const fileName = buildFileName(extension);
    const contentType = normalizeContentType(file.mimetype, extension);

    const targetFolder = path.join(config.uploadDirPath, folder);
    fs.mkdirSync(targetFolder, { recursive: true });

    const absoluteFilePath = path.join(targetFolder, fileName);
    fs.writeFileSync(absoluteFilePath, file.buffer);

    const relativePath = path.relative(config.uploadDirPath, absoluteFilePath).split(path.sep).join("/");

    const savedImage = store.createUploadedImage({
      fileName,
      folder,
      contentType,
      extension,
      relativePath,
      sizeInBytes: file.size
    });

    const url = `/api/v1/uploads/images/${savedImage.id}/${fileName}`;

    res.status(200).json({
      url,
      fileName,
      sizeInBytes: file.size
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1/admin", adminRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((_req, _res, next) => {
  next(notFound("Recurso nao encontrado."));
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Judo-Candoi-Api-Light rodando em http://localhost:${config.port}`);
});


