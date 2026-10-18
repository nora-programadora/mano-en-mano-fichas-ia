import { schema, taxonomy } from "./config.js";

type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: string[] };

/** Revisa que la respuesta cumpla schema.json (campos, tipos y valores permitidos). */
export function validate(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["La respuesta no es un objeto JSON."] };
  }
  const obj = raw as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of schema.required) {
    if (!(key in obj)) errors.push(`Falta el campo "${key}".`);
  }

  for (const [key, def] of Object.entries(schema.properties)) {
    const value = obj[key];
    if (value === undefined) continue;

    if (def.type === "string") {
      if (typeof value !== "string") errors.push(`"${key}" debe ser texto.`);
      else if (def.enum && !def.enum.includes(value)) errors.push(`"${key}": valor no permitido "${value}".`);
    } else if (def.type === "array") {
      if (!Array.isArray(value)) errors.push(`"${key}" debe ser una lista.`);
      else {
        for (const item of value) {
          if (typeof item !== "string" || (def.items?.enum && !def.items.enum.includes(item))) {
            errors.push(`"${key}": valor no permitido "${String(item)}".`);
          }
        }
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, data: obj };
}

const NAME_MAX = 60;

/** Convierte "unknown" en null, valida categoría/subcategoría y agrega el color en hex. */
export function normalize(data: Record<string, unknown>) {
  const warnings: string[] = [];
  const orNull = (v: unknown) => (v === taxonomy.unknownValue || v === "" ? null : (v as string));

  const category = orNull(data.category);
  let subcategory = orNull(data.subcategory);
  if (category && subcategory && !taxonomy.subcategories[category]?.includes(subcategory)) {
    warnings.push(`La subcategoría "${subcategory}" no corresponde a "${category}"; se dejó vacía.`);
    subcategory = null;
  }

  let name = String(data.name ?? "").trim();
  if (name.length > NAME_MAX) {
    name = name.slice(0, NAME_MAX).trim();
    warnings.push(`El título se recortó a ${NAME_MAX} caracteres.`);
  }

  const color = orNull(data.color);
  const defects = String(data.productDefects ?? "").trim();

  const listing = {
    name,
    description: String(data.description ?? "").trim(),
    category,
    subcategory,
    style: orNull(data.style),
    gender: orNull(data.gender),
    brand: orNull(data.brand),
    materials: (data.materials as string[]) ?? [],
    condition: orNull(data.condition),
    color,
    colorHex: color ? (taxonomy.colors[color] ?? null) : null,
    size: orNull(data.size),
    productDefects: defects === taxonomy.unknownValue ? "" : defects,
  };

  // Campos que la vendedora debe completar a mano.
  const reviewable = ["category", "subcategory", "style", "gender", "brand", "condition", "color", "size"] as const;
  const missingFields = reviewable.filter((k) => listing[k] === null);

  return { listing, warnings, missingFields };
}