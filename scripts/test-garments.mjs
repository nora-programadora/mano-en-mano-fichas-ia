// Prueba por lotes: manda cada foto de una carpeta a Ollama con el prompt y el
// esquema del proyecto, valida el resultado y guarda un JSON y un CSV en results/.
//
// Uso:
//   node scripts/test-garments.mjs [carpeta-de-fotos]
//   OLLAMA_MODEL=gemma3:12b node scripts/test-garments.mjs private-photos
//
// Requiere Node 20+ (usa fetch nativo). No necesita instalar paquetes.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";
const photosDir = process.argv[2] ?? "private-photos";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(await fs.readFile(path.join(root, "schema.json"), "utf8"));
const taxonomy = JSON.parse(await fs.readFile(path.join(root, "taxonomy.json"), "utf8"));
const systemPrompt = await fs.readFile(path.join(root, "prompts", "system.txt"), "utf8");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function analyze(file) {
  const image = (await fs.readFile(file)).toString("base64");
  const started = Date.now();

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: schema,
      options: { temperature: 0 },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Genera la ficha de esta prenda.", images: [image] },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Ollama respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const seconds = Number(((Date.now() - started) / 1000).toFixed(1));
  return { result: JSON.parse(data.message.content), seconds };
}

function check(result) {
  const issues = [];
  const { category, subcategory, color } = result;
  if (category !== "unknown" && subcategory !== "unknown") {
    const valid = taxonomy.subcategories[category] ?? [];
    if (!valid.includes(subcategory)) issues.push("subcategory no pertenece a category");
  }
  if (color !== "unknown" && !(color in taxonomy.colors)) issues.push("color fuera de la paleta");
  return issues;
}

const csvCell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;

// --- main ---
let files;
try {
  files = (await fs.readdir(photosDir))
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .sort();
} catch {
  console.error(`No pude leer la carpeta "${photosDir}". Crea la carpeta y pon ahí tus fotos.`);
  process.exit(1);
}
if (files.length === 0) {
  console.error(`No encontré imágenes (.jpg, .png, .webp) en "${photosDir}".`);
  process.exit(1);
}

console.log(`Modelo: ${MODEL} | Ollama: ${OLLAMA_URL} | Fotos: ${files.length}\n`);

const rows = [];
for (const f of files) {
  try {
    const { result, seconds } = await analyze(path.join(photosDir, f));
    const issues = check(result);
    rows.push({ file: f, seconds, result, issues });
    console.log(
      `✔ ${f} (${seconds}s) → ${result.name} | ${result.category}/${result.subcategory} | ` +
        `${result.condition} | ${result.color}${issues.length ? "  ⚠ " + issues.join("; ") : ""}`,
    );
  } catch (err) {
    rows.push({ file: f, seconds: null, result: null, issues: [String(err.message)] });
    console.log(`✖ ${f} → ${err.message}`);
    if (String(err.cause?.code ?? "").includes("ECONNREFUSED") || err.message.includes("fetch failed")) {
      console.error("\nNo pude conectar con Ollama. ¿Está corriendo y la URL es correcta (OLLAMA_URL)?");
      break;
    }
  }
}

await fs.mkdir(path.join(root, "results"), { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const base = path.join(root, "results", `${MODEL.replace(/[^\w.-]/g, "-")}_${stamp}`);

await fs.writeFile(`${base}.json`, JSON.stringify(rows, null, 2), "utf8");

const cols = ["name", "category", "subcategory", "style", "gender", "brand", "condition", "color", "size", "materials", "productDefects", "description"];
const header = ["file", "seconds", ...cols, "issues", "notas_correcto_o_error"];
const lines = [header.map(csvCell).join(",")];
for (const r of rows) {
  const vals = [r.file, r.seconds, ...cols.map((c) => (Array.isArray(r.result?.[c]) ? r.result[c].join("; ") : r.result?.[c])), r.issues.join("; "), ""];
  lines.push(vals.map(csvCell).join(","));
}
await fs.writeFile(`${base}.csv`, "\uFEFF" + lines.join("\n"), "utf8");

const ok = rows.filter((r) => r.result);
const avg = ok.length ? (ok.reduce((s, r) => s + r.seconds, 0) / ok.length).toFixed(1) : "-";
console.log(`\nListo. ${ok.length}/${rows.length} fotos procesadas, ${avg}s promedio.`);
console.log(`Resultados: ${base}.csv`);
