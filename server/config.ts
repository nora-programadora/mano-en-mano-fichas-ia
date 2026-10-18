import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface Taxonomy {
  subcategories: Record<string, string[]>;
  colors: Record<string, string>;
  unknownValue: string;
}

export interface JsonSchema {
  required: string[];
  properties: Record<string, any>;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readText = (...parts: string[]) => fs.readFileSync(path.join(root, ...parts), "utf8");

export const config = {
  port: Number(process.env.PORT ?? 3001),
  ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
  model: process.env.OLLAMA_MODEL ?? "gemma3:4b",
  timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 180_000),
  maxPhotos: 4,
  maxPhotoBytes: 8 * 1024 * 1024,
};

export const schema = JSON.parse(readText("schema.json")) as JsonSchema;
export const taxonomy = JSON.parse(readText("taxonomy.json")) as Taxonomy;
export const systemPrompt = readText("prompts", "system.txt");