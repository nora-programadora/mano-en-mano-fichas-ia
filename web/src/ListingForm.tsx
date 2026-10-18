import type { ReactNode } from "react";
import taxonomy from "../../taxonomy.json";
import type { Listing } from "./types";

const categories = taxonomy.categories as string[];
const subcategoriesByCategory = taxonomy.subcategories as Record<string, string[]>;
const colors = taxonomy.colors as Record<string, string>;

interface Props {
  value: Listing;
  missing: Set<string>;
  onChange: (next: Listing) => void;
}

function Field({ label, missing, children }: { label: string; missing?: boolean; children: ReactNode }) {
  return (
    <label className={`field${missing ? " needs-input" : ""}`}>
      <span className="label">
        {label}
        {missing && <em>Fill in</em>}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">— Not set —</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function ListingForm({ value, missing, onChange }: Props) {
  const set = <K extends keyof Listing>(key: K, v: Listing[K]) => onChange({ ...value, [key]: v });
  const subcategories = value.category ? (subcategoriesByCategory[value.category] ?? []) : [];

  function changeCategory(category: string | null) {
    const nextSubs = category ? (subcategoriesByCategory[category] ?? []) : [];
    const keep = value.subcategory && nextSubs.includes(value.subcategory) ? value.subcategory : null;
    onChange({ ...value, category, subcategory: keep });
  }

  function changeColor(color: string | null) {
    onChange({ ...value, color, colorHex: color ? (colors[color] ?? null) : null });
  }

  function toggleMaterial(m: string) {
    set("materials", value.materials.includes(m) ? value.materials.filter((x) => x !== m) : [...value.materials, m]);
  }

  return (
    <div className="form-grid">
      <div className="full">
        <Field label="Title">
          <input type="text" maxLength={60} value={value.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
      </div>

      <div className="full">
        <Field label="Description">
          <textarea rows={3} value={value.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </div>

      <Field label="Category" missing={missing.has("category")}>
        <Select value={value.category} options={categories} onChange={changeCategory} />
      </Field>

      <Field label="Subcategory" missing={missing.has("subcategory")}>
        <Select value={value.subcategory} options={subcategories} onChange={(v) => set("subcategory", v)} />
      </Field>

      <Field label="Style" missing={missing.has("style")}>
        <Select value={value.style} options={taxonomy.styles} onChange={(v) => set("style", v)} />
      </Field>

      <Field label="Gender" missing={missing.has("gender")}>
        <Select value={value.gender} options={taxonomy.genders} onChange={(v) => set("gender", v)} />
      </Field>

      <Field label="Condition" missing={missing.has("condition")}>
        <Select value={value.condition} options={taxonomy.conditions} onChange={(v) => set("condition", v)} />
      </Field>

      <Field label="Color" missing={missing.has("color")}>
        <div className="color-row">
          <span className="swatch" style={{ background: value.colorHex ?? "transparent" }} />
          <Select value={value.color} options={Object.keys(colors)} onChange={changeColor} />
        </div>
      </Field>

      <Field label="Brand" missing={missing.has("brand")}>
        <input type="text" value={value.brand ?? ""} onChange={(e) => set("brand", e.target.value || null)} />
      </Field>

      <Field label="Size" missing={missing.has("size")}>
        <Select value={value.size} options={taxonomy.sizes} onChange={(v) => set("size", v)} />
      </Field>

      <div className="full">
        <span className="label">Materials</span>
        <div className="chips">
          {taxonomy.materials.map((m) => (
            <label key={m} className={`chip${value.materials.includes(m) ? " on" : ""}`}>
              <input type="checkbox" checked={value.materials.includes(m)} onChange={() => toggleMaterial(m)} />
              {m}
            </label>
          ))}
        </div>
      </div>

      <div className="full">
        <Field label="Visible defects">
          <textarea
            rows={2}
            placeholder="None visible"
            value={value.productDefects}
            onChange={(e) => set("productDefects", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
