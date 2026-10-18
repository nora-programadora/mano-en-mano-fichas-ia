import { config, schema, systemPrompt } from "./config.js";

export class OllamaError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

/** Envía las fotos a Ollama forzando la estructura del esquema con `format`. */
export async function generateRaw(images: string[]): Promise<unknown> {
  const userMessage =
    images.length > 1
      ? "Genera la ficha de esta prenda. Todas las fotos son de la misma prenda."
      : "Genera la ficha de esta prenda.";

  let res: Response;
  try {
    res = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(config.timeoutMs),
      body: JSON.stringify({
        model: config.model,
        stream: false,
        format: schema,
        options: { temperature: 0 },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage, images },
        ],
      }),
    });
  } catch (err) {
    if ((err as Error).name === "TimeoutError") {
      throw new OllamaError("El modelo tardó demasiado en responder.", 504);
    }
    throw new OllamaError(`No pude conectar con Ollama en ${config.ollamaUrl}. ¿Está corriendo?`);
  }

  if (!res.ok) {
    throw new OllamaError(`Ollama respondió ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  try {
    return JSON.parse(data.message?.content ?? "");
  } catch {
    throw new OllamaError("La respuesta del modelo no es un JSON válido.", 422);
  }
}

/** Para /health: ¿Ollama responde y el modelo configurado está descargado? */
export async function ollamaStatus() {
  try {
    const res = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = (await res.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    const modelAvailable = names.includes(config.model) || names.includes(`${config.model}:latest`);
    return { reachable: true, modelAvailable };
  } catch {
    return { reachable: false, modelAvailable: false };
  }
}