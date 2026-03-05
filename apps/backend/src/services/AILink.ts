// ─── AILink — Provider-agnostic AI service ────────────────────────────────────
//
// Dev:  AI_PROVIDER=ollama  → runs locally via Ollama (free)
// Prod: AI_PROVIDER=vertex  → Google Vertex AI / Gemini
//
// Usage:
//   const ai = getAILink();
//   const vec = await ai.embed("How to reset tire pressure?");
//   for await (const chunk of ai.chat(prompt)) { stream(chunk); }

export interface AILinkService {
  embed(text: string): Promise<number[]>;
  chat(
    prompt:       string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown>;
  isAvailable(): Promise<boolean>;
}

// ─── Ollama (Dev) ─────────────────────────────────────────────────────────────

class OllamaAILink implements AILinkService {
  private baseUrls:   string[];
  private chatModel:  string;
  private embedModel: string;

  constructor() {
    const envBaseUrl = process.env.OLLAMA_BASE_URL;
    this.baseUrls = [
      envBaseUrl,
      "http://localhost:11434",
      "http://127.0.0.1:11434",
      "http://host.docker.internal:11434",
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);
    this.chatModel  = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2";
    this.embedModel = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
  }

  private async request(
    path: string,
    init?: RequestInit & { timeoutMs?: number }
  ): Promise<Response> {
    let lastError: unknown;

    for (const baseUrl of this.baseUrls) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          ...init,
          signal: AbortSignal.timeout(init?.timeoutMs ?? 5000),
        });
        if (res.ok) return res;
        lastError = new Error(`[Ollama] ${res.status} ${res.statusText} via ${baseUrl}${path}`);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error("[Ollama] Unknown connection failure");
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await this.request("/api/tags", { timeoutMs: 3000 });
      return res.ok;
    } catch {
      return false;
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.request("/api/embeddings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:  this.embedModel,
        prompt: text,
      }),
    });

    const data = await res.json() as { embedding: number[] };
    return data.embedding;
  }

  async *chat(
    prompt:       string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const res = await this.request("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:    this.chatModel,
        messages,
        stream:   true,
        options: {
          temperature: 0.2,   // Low temp — factual answers from manual
          top_p:       0.9,
          num_predict: 512,
        },
      }),
    });

    if (!res.body) throw new Error("[Ollama] Chat response stream unavailable");

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line) as {
            message?: { content?: string };
            done?: boolean;
          };
          if (json.message?.content) {
            yield json.message.content;
          }
          if (json.done) return;
        } catch {
          // Skip malformed lines
        }
      }
    }
  }
}

// ─── Vertex AI / Gemini (Production) ─────────────────────────────────────────

class VertexAILink implements AILinkService {
  private apiKey:    string;
  private projectId: string;
  private location:  string;
  private model:     string;

  constructor() {
    this.apiKey    = process.env.VERTEX_API_KEY    ?? "";
    this.projectId = process.env.VERTEX_PROJECT_ID ?? "";
    this.location  = process.env.VERTEX_LOCATION   ?? "us-central1";
    this.model     = "gemini-1.5-flash";
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.projectId);
  }

  async embed(text: string): Promise<number[]> {
    const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/text-embedding-004:predict`;

    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        instances: [{ content: text }],
        parameters: { outputDimensionality: 768 },
      }),
    });

    if (!res.ok) throw new Error(`[Vertex] Embed failed: ${await res.text()}`);

    const data = await res.json() as {
      predictions: Array<{ embeddings: { values: number[] } }>;
    };
    if (!data.predictions?.[0]?.embeddings?.values) {
      throw new Error(`[Vertex] Embed failed: Invalid response structure`);
    }
    return data.predictions[0].embeddings.values;
  }

  async *chat(
    prompt:        string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

    const body: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:     0.2,
        maxOutputTokens: 512,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      throw new Error(`[Vertex] Chat failed: ${await res.text()}`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(line.slice(6)) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // Skip
        }
      }
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _instance: AILinkService | null = null;

export function getAILink(): AILinkService {
  if (_instance) return _instance;

  const provider = process.env.AI_PROVIDER ?? "ollama";

  if (provider === "vertex") {
    console.log("🤖 AILink → Google Vertex AI / Gemini");
    _instance = new VertexAILink();
  } else {
    console.log("🤖 AILink → Ollama (local dev)");
    _instance = new OllamaAILink();
  }

  return _instance;
}
