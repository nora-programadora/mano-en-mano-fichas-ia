import { useEffect, useMemo, useState } from "react";
import { generateListing } from "./api";
import ListingForm from "./ListingForm";
import PhotoPicker from "./PhotoPicker";
import type { GenerateResponse, Listing } from "./types";

// Los 12 campos que llena la IA (para contar cuántos corrige la vendedora).
const AI_FIELDS = [
  "name", "description", "category", "subcategory", "style", "gender",
  "brand", "materials", "condition", "color", "size", "productDefects",
] as const;

type Status = "idle" | "loading" | "ready" | "error";

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [draft, setDraft] = useState<Listing | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status !== "loading") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  async function handleGenerate() {
    setStatus("loading");
    setError("");
    setConfirmed(false);
    try {
      const data = await generateListing(files);
      setResult(data);
      setDraft(data.listing);
      setStatus("ready");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  function reset() {
    setFiles([]);
    setResult(null);
    setDraft(null);
    setConfirmed(false);
    setError("");
    setStatus("idle");
  }

  // Campos que la IA dejó vacíos y que siguen vacíos.
  const missing = useMemo(() => {
    if (!result || !draft) return new Set<string>();
    return new Set(result.missingFields.filter((k) => !draft[k]));
  }, [result, draft]);

  // Campos que la vendedora cambió respecto a la propuesta de la IA.
  const edited = useMemo(() => {
    if (!result || !draft) return [];
    return AI_FIELDS.filter((k) => JSON.stringify(result.listing[k]) !== JSON.stringify(draft[k]));
  }, [result, draft]);

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const loading = status === "loading";

  return (
    <main className="app">
      <header>
        <h1>AI Listing Generator</h1>
        <p>
          Upload photos of your garment and the listing fills itself in. Everything runs on your computer with open-source AI:
          your photos never leave your machine.
        </p>
      </header>

      <section className="card">
        <PhotoPicker files={files} onChange={setFiles} disabled={loading} />
        <div className="actions">
          <button className="primary" disabled={files.length === 0 || loading} onClick={handleGenerate}>
            {loading ? `Analyzing… ${elapsed}s` : result ? "Generate again" : "Generate listing"}
          </button>
          {(result || files.length > 0) && !loading && (
            <button className="ghost" onClick={reset}>
              Start with another garment
            </button>
          )}
        </div>
        {loading && <p className="hint">The model runs on your computer; it can take 15 to 30 seconds.</p>}
        {status === "error" && <p className="error">{error}</p>}
      </section>

      {status === "ready" && result && draft && (
        <section className="card">
          <div className="card-head">
            <h2>Review and edit the listing</h2>
            <span className="meta">
              {result.meta.model} · {result.meta.seconds}s · {result.meta.photos} photo{result.meta.photos > 1 ? "s" : ""}
            </span>
          </div>

          {result.warnings.length > 0 && (
            <ul className="warnings">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <p className="hint">
            The AI suggests, you decide. Fields marked <em>Fill in</em> could not be determined from the photos.
          </p>

          <ListingForm
            value={draft}
            missing={missing}
            onChange={(next) => {
              setDraft(next);
              setConfirmed(false);
            }}
          />

          <div className="actions">
            <button className="primary" onClick={() => setConfirmed(true)}>
              Confirm listing
            </button>
          </div>
        </section>
      )}

      {confirmed && draft && (
        <section className="card">
          <h2>Listing ready</h2>
          <p className="stat">
            You edited <strong>{edited.length}</strong> of {AI_FIELDS.length} fields
            {edited.length > 0 && <span> ({edited.join(", ")})</span>}.
          </p>
          <p className="hint">This is the JSON that would be sent to the Mano en Mano form:</p>
          <pre>{JSON.stringify(draft, null, 2)}</pre>
          <div className="actions">
            <button className="ghost" onClick={copyJson}>
              {copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
