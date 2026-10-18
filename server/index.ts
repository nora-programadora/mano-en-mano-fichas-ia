import express from "express";
import cors from "cors";
import multer from "multer";
import { config } from "./config.js";
import { generateRaw, ollamaStatus, OllamaError } from "./ollama.js";
import { normalize, validate } from "./listing.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxPhotoBytes, files: config.maxPhotos },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

app.get("/health", async (_req, res) => {
  res.json({ ok: true, model: config.model, ollama: await ollamaStatus() });
});

app.post("/generate-listing", upload.array("photos", config.maxPhotos), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: "Envía al menos una foto (JPG, PNG o WEBP) en el campo 'photos'." });
    return;
  }

  const started = Date.now();
  try {
    const raw = await generateRaw(files.map((f) => f.buffer.toString("base64")));

    const result = validate(raw);
    if (!result.ok) {
      res.status(422).json({ error: "El modelo devolvió datos que no cumplen el esquema.", details: result.errors });
      return;
    }

    const { listing, warnings, missingFields } = normalize(result.data);
    res.json({
      listing,
      warnings,
      missingFields,
      meta: {
        model: config.model,
        photos: files.length,
        seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
      },
    });
  } catch (err) {
    if (err instanceof OllamaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Error al subir las fotos: ${err.message}` });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(config.port, () => {
  console.log(`API lista en http://localhost:${config.port} (modelo: ${config.model}, Ollama: ${config.ollamaUrl})`);
});