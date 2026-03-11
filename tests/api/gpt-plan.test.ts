// tests/api/gpt-plan.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  AdvisorResponseSchema,
  LLMPlansSchema,
  WizardPayloadSchema,
} from "../../shared/plan";

// ---------------------------------------------------------------------------
// Helpers to load the handler no matter where it lives (src/api or api)
// ---------------------------------------------------------------------------
function resolveApiFile(): string {
  const candidates = [
    path.resolve(process.cwd(), "src/api/gpt-plan.ts"),
    path.resolve(process.cwd(), "api/gpt-plan.ts"),
    path.resolve(process.cwd(), "api/gpt-plan.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Could not find gpt-plan API file. Tried:\n${candidates.join("\n")}`
  );
}

async function importHandler() {
  const file = resolveApiFile();
  const mod = await import(pathToFileURL(file).href);
  if (!mod?.default) {
    throw new Error("API module did not export a default handler function.");
  }
  return mod.default as (req: any, res: any) => Promise<any>;
}

// ---------------------------------------------------------------------------
// Very small mock req/res
// ---------------------------------------------------------------------------
type MockRes = {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  status: (code: number) => MockRes;
  json: (obj: any) => any;
  setHeader: (k: string, v: string) => void;
};

function makeReqRes({
  method = "POST",
  body = {},
  query = {},
}: {
  method?: string;
  body?: any;
  query?: any;
}) {
  const req = { method, body, query } as any;

  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(k: string, v: string) {
      this.headers[k.toLowerCase()] = v;
    },
    json(obj: any) {
      this.body = obj;
      return obj;
    },
  };

  return { req, res };
}

const VALID_USER = WizardPayloadSchema.parse({
  housing: "rent",
  subs: ["Netflix"],
  tools: "auto",
  employment: "employed",
  goal: "30",
  budget: 45,
  remix: false,
});

// ---------------------------------------------------------------------------
// Reset between tests and ensure no real network calls
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();

  // Block actual HTTP
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("fetch was called unexpectedly (OpenAI should be mocked out)");
  }));

  // Minimal env present for module code
  vi.stubEnv("OPENAI_API_KEY", "test-key");
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("API: /api/gpt-plan", () => {
  it("returns legacy LLM shape with USE_MOCK=1", async () => {
    vi.stubEnv("USE_MOCK", "1");

    const handler = await importHandler();
    const { req, res } = makeReqRes({ body: VALID_USER });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const parsed = LLMPlansSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });

  it("respects ?shape=advisor and returns canonical AdvisorResponse", async () => {
    vi.stubEnv("USE_MOCK", "1");

    const handler = await importHandler();
    const { req, res } = makeReqRes({
      body: VALID_USER,
      query: { shape: "advisor" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const parsed = AdvisorResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.plans).toHaveLength(4);
      for (const p of parsed.data.plans) {
        expect(["A", "B", "C", "D"]).toContain(p.id);
        expect(p.apps.length).toBeGreaterThanOrEqual(4);
        expect(p.apps.length).toBeLessThanOrEqual(7);
      }
    }
  });

  it("caches by wizard-hash (second call should not hit OpenAI)", async () => {
    // Keep USE_MOCK=1 for both calls; assert second call reuses cached body
    vi.stubEnv("USE_MOCK", "1");

    const handler = await importHandler();

    // First call populates cache
    const r1 = makeReqRes({ body: VALID_USER });
    await handler(r1.req, r1.res);
    const firstBody = r1.res.body;

    // Second call with same payload
    const fetchSpy = vi.spyOn(globalThis as any, "fetch");
    const r2 = makeReqRes({ body: VALID_USER });
    await handler(r2.req, r2.res);

    expect(r2.res.statusCode).toBe(200);
    const parsed = LLMPlansSchema.safeParse(r2.res.body);
    expect(parsed.success).toBe(true);

    // Confirm it's truly the cached response
    expect(JSON.stringify(r2.res.body)).toBe(JSON.stringify(firstBody));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects invalid payload with 400", async () => {
    const handler = await importHandler();
    const { req, res } = makeReqRes({ body: { goal: "not-valid" } });

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body?.error).toBe("Invalid payload");
  });
});
