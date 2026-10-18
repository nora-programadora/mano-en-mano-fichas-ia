import type { GenerateResponse } from "./types";

// En desarrollo usa el proxy de Vite (/api). En producción define VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function generateListing(files: File[]): Promise<GenerateResponse> {
  const body = new FormData();
  files.forEach((f) => body.append("photos", f));

  let res: Response;
  try {
    res = await fetch(`${API_URL}/generate-listing`, { method: "POST", body });
  } catch {
    throw new Error("Could not connect to the server. Is it running on port 3001?");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data as GenerateResponse;
}