import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {S3Client, GetObjectCommand} from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  PORT = 8080,
  NODE_ENV = "production",
  PUBLIC_API_BASE = "",
  ALLOWED_ORIGIN = "https://contimech.org",
  SESSION_SECRET,
  COOKIE_DOMAIN,
  PROJECT_PORTAL_PASSWORD_HASH,
  PROJECTS_FILE = "./projects.json",
  AWS_REGION = "eu-central-1",
  S3_BUCKET,
  LOCAL_PROJECT_DIR = "./private-project-slides"
} = process.env;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set and must be at least 32 characters long.");
}

if (!PROJECT_PORTAL_PASSWORD_HASH) {
  throw new Error("PROJECT_PORTAL_PASSWORD_HASH must be set. Generate it with: npm run hash-password -- '<password>'");
}

const app = express();
const s3 = new S3Client({region: AWS_REGION});

const cookieName = "contimech_project_session";
const isProduction = NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: {policy: "same-site"}
}));
app.use(express.json({limit: "32kb"}));
app.use(cookieParser());
app.use(cors({
  origin: ALLOWED_ORIGIN.split(",").map((item) => item.trim()),
  credentials: true
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {error: "Too many authorization attempts. Try again later."}
});

const readProjects = () => {
  const filePath = path.resolve(__dirname, PROJECTS_FILE);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
};

const publicProject = (project) => ({
  id: project.id,
  title: project.title,
  domain: project.domain,
  summary: project.summary,
  tags: project.tags || [],
  slide_url: `${PUBLIC_API_BASE}/api/projects/${encodeURIComponent(project.id)}/slide`
});

const createToken = () => jwt.sign(
  {scope: "project-portal"},
  SESSION_SECRET,
  {algorithm: "HS256", expiresIn: "8h"}
);

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/"
};

if (COOKIE_DOMAIN) {
  cookieOptions.domain = COOKIE_DOMAIN;
}

const requireAuth = (req, res, next) => {
  const token = req.cookies[cookieName];
  if (!token) {
    return res.status(401).json({error: "Authorization required."});
  }

  try {
    const payload = jwt.verify(token, SESSION_SECRET, {algorithms: ["HS256"]});
    if (payload.scope !== "project-portal") {
      return res.status(403).json({error: "Invalid access scope."});
    }
    return next();
  } catch (_) {
    return res.status(401).json({error: "Session expired or invalid."});
  }
};

app.get("/api/health", (_, res) => {
  res.json({status: "ok"});
});

app.get("/api/session", (req, res) => {
  try {
    const token = req.cookies[cookieName];
    if (!token) return res.json({authenticated: false});
    const payload = jwt.verify(token, SESSION_SECRET, {algorithms: ["HS256"]});
    return res.json({authenticated: payload.scope === "project-portal"});
  } catch (_) {
    return res.json({authenticated: false});
  }
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const password = String(req.body?.password || "");
  if (password.length < 8 || password.length > 256) {
    return res.status(400).json({error: "Invalid password format."});
  }

  const valid = await bcrypt.compare(password, PROJECT_PORTAL_PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({error: "Incorrect access password."});
  }

  res.cookie(cookieName, createToken(), cookieOptions);
  return res.json({authenticated: true});
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(cookieName, {...cookieOptions, maxAge: undefined});
  res.json({authenticated: false});
});

app.get("/api/projects", requireAuth, (_, res) => {
  const projects = readProjects().map(publicProject);
  res.setHeader("Cache-Control", "no-store");
  res.json({projects});
});

app.get("/api/projects/:id/slide", requireAuth, async (req, res) => {
  const projects = readProjects();
  const project = projects.find((item) => item.id === req.params.id);

  if (!project || !project.slide) {
    return res.status(404).json({error: "Project slide not found."});
  }

  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", project.slide.contentType || "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${project.id}.pdf"`);

  if (project.slide.storage === "s3") {
    if (!S3_BUCKET) {
      return res.status(500).json({error: "S3_BUCKET is not configured."});
    }

    const object = await s3.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: project.slide.key
    }));

    return object.Body.pipe(res);
  }

  if (project.slide.storage === "local") {
    const safeBase = path.resolve(__dirname, LOCAL_PROJECT_DIR);
    const filePath = path.resolve(safeBase, project.slide.path || "");
    if (!filePath.startsWith(safeBase)) {
      return res.status(400).json({error: "Invalid file path."});
    }
    return res.sendFile(filePath);
  }

  return res.status(500).json({error: "Unsupported slide storage type."});
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({error: "Internal server error."});
});

app.listen(PORT, () => {
  console.log(`ContiMech project portal backend listening on port ${PORT}`);
});
