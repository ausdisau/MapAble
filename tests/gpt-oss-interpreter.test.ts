import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createOpenAICompatibleMock = vi.fn();
const gatewayMock = vi.fn();
const googleMock = vi.fn();

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: (...args: unknown[]) =>
    createOpenAICompatibleMock(...args),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    gateway: (...args: unknown[]) => gatewayMock(...args),
  };
});

vi.mock("@ai-sdk/google", () => ({
  google: (...args: unknown[]) => googleMock(...args),
}));

import {
  canonicalizeInterpreterModelId,
  getInterpreterDisplayName,
  isGptOssConfigured,
  isGptOssModelId,
  isSearchInterpreterConfigured,
} from "@/lib/config/search-interpreter";
import {
  getInterpreterEngineId,
  getInterpreterModel,
} from "@/lib/search/interpreter/get-model";
import {
  getModel,
  isModelAllowedForTask,
  listModels,
} from "@/lib/ai-platform/models/registry";
import { resolveModelForCapability } from "@/lib/ai-platform/models/gateway";

const ENV_KEYS = [
  "SEARCH_INTERPRETER_ENABLED",
  "SEARCH_INTERPRETER_MODEL",
  "GPT_OSS_BASE_URL",
  "GPT_OSS_API_KEY",
  "AI_GATEWAY_API_KEY",
  "VERCEL_AI_GATEWAY_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "MAPABLE_AI_PLATFORM_ENABLED",
  "MAPABLE_AI_MODEL_GENERATION_ENABLED",
  "MAPABLE_AI_GLOBAL_KILL_SWITCH",
] as const;

const originalEnv = new Map<string, string | undefined>();

function snapshotEnv() {
  for (const key of ENV_KEYS) {
    originalEnv.set(key, process.env[key]);
  }
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearInterpreterEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("gpt-oss interpreter config", () => {
  beforeEach(() => {
    snapshotEnv();
    clearInterpreterEnv();
    createOpenAICompatibleMock.mockReset();
    gatewayMock.mockReset();
    googleMock.mockReset();
  });

  afterEach(() => {
    restoreEnv();
  });

  it("recognizes gpt-oss model ids", () => {
    expect(isGptOssModelId("openai/gpt-oss-120b")).toBe(true);
    expect(isGptOssModelId("gpt-oss-120b")).toBe(true);
    expect(isGptOssModelId("google/gemini-3.5-flash")).toBe(false);
    expect(canonicalizeInterpreterModelId("gpt-oss-120b")).toBe(
      "openai/gpt-oss-120b",
    );
  });

  it("requires GPT_OSS_BASE_URL when model is gpt-oss", () => {
    process.env.SEARCH_INTERPRETER_ENABLED = "true";
    process.env.SEARCH_INTERPRETER_MODEL = "openai/gpt-oss-120b";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "google-key";

    expect(isSearchInterpreterConfigured()).toBe(false);
    expect(isGptOssConfigured()).toBe(false);
    expect(getInterpreterDisplayName()).toBe("unavailable");

    process.env.GPT_OSS_BASE_URL = "http://localhost:8000/v1";
    expect(isSearchInterpreterConfigured()).toBe(true);
    expect(isGptOssConfigured()).toBe(true);
    expect(getInterpreterDisplayName()).toBe("gpt-oss-120b");
  });

  it("keeps Gemini path when gateway/google keys exist and model is Gemini", () => {
    process.env.SEARCH_INTERPRETER_ENABLED = "true";
    process.env.SEARCH_INTERPRETER_MODEL = "google/gemini-3.5-flash";
    process.env.AI_GATEWAY_API_KEY = "gw-key";

    expect(isSearchInterpreterConfigured()).toBe(true);
    expect(isGptOssConfigured()).toBe(false);
    expect(getInterpreterDisplayName()).toBe("Gemini 3.5 Flash");
  });
});

describe("getInterpreterModel gpt-oss routing", () => {
  beforeEach(() => {
    snapshotEnv();
    clearInterpreterEnv();
    createOpenAICompatibleMock.mockReset();
    gatewayMock.mockReset();
    googleMock.mockReset();
  });

  afterEach(() => {
    restoreEnv();
  });

  it("routes to openai-compatible when gpt-oss is configured", () => {
    process.env.SEARCH_INTERPRETER_ENABLED = "true";
    process.env.SEARCH_INTERPRETER_MODEL = "openai/gpt-oss-120b";
    process.env.GPT_OSS_BASE_URL = "http://localhost:8000/v1";
    process.env.GPT_OSS_API_KEY = "secret";

    const providerFn = vi.fn(() => ({ provider: "gpt-oss-model" }));
    createOpenAICompatibleMock.mockReturnValue(providerFn);
    gatewayMock.mockReturnValue({ provider: "gateway" });
    googleMock.mockReturnValue({ provider: "google" });

    const model = getInterpreterModel();

    expect(createOpenAICompatibleMock).toHaveBeenCalledWith({
      name: "gpt-oss",
      baseURL: "http://localhost:8000/v1",
      apiKey: "secret",
    });
    expect(providerFn).toHaveBeenCalledWith("gpt-oss-120b");
    expect(model).toEqual({ provider: "gpt-oss-model" });
    expect(gatewayMock).not.toHaveBeenCalled();
    expect(googleMock).not.toHaveBeenCalled();
    expect(getInterpreterEngineId()).toBe(
      "ai-sdk/openai-compatible/gpt-oss-120b",
    );
  });

  it("uses AI Gateway for Gemini when configured", () => {
    process.env.SEARCH_INTERPRETER_ENABLED = "true";
    process.env.SEARCH_INTERPRETER_MODEL = "google/gemini-3.5-flash";
    process.env.AI_GATEWAY_API_KEY = "gw-key";

    gatewayMock.mockReturnValue({ provider: "gateway" });

    const model = getInterpreterModel();

    expect(gatewayMock).toHaveBeenCalledWith("google/gemini-3.5-flash");
    expect(model).toEqual({ provider: "gateway" });
    expect(createOpenAICompatibleMock).not.toHaveBeenCalled();
  });

  it("throws when gpt-oss model is selected without base URL", () => {
    process.env.SEARCH_INTERPRETER_ENABLED = "true";
    process.env.SEARCH_INTERPRETER_MODEL = "gpt-oss-120b";

    expect(() => getInterpreterModel()).toThrow(
      "Search interpreter is not configured",
    );
  });
});

describe("gpt-oss model registry", () => {
  it("allowlists openai/gpt-oss-120b for interpreter tasks", () => {
    const model = getModel("openai/gpt-oss-120b");
    expect(model?.provider).toBe("openai_compatible");
    expect(model?.displayName).toBe("gpt-oss-120b");
    expect(
      isModelAllowedForTask("openai/gpt-oss-120b", "search.nl_interpreter"),
    ).toBe(true);
    expect(
      isModelAllowedForTask(
        "openai/gpt-oss-120b",
        "provider_finder.reply_generator",
      ),
    ).toBe(true);
    expect(listModels().some((m) => m.id === "openai/gpt-oss-120b")).toBe(true);
  });
});

describe("resolveModelForCapability gpt-oss", () => {
  beforeEach(() => {
    snapshotEnv();
    clearInterpreterEnv();
    createOpenAICompatibleMock.mockReset();
    gatewayMock.mockReset();
    googleMock.mockReset();
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  afterEach(() => {
    restoreEnv();
  });

  it("resolves openai-compatible model for search.nl_interpreter", () => {
    process.env.SEARCH_INTERPRETER_ENABLED = "true";
    process.env.SEARCH_INTERPRETER_MODEL = "gpt-oss-120b";
    process.env.GPT_OSS_BASE_URL = "http://127.0.0.1:8000/v1";

    const providerFn = vi.fn(() => ({ provider: "gpt-oss-model" }));
    createOpenAICompatibleMock.mockReturnValue(providerFn);

    const resolved = resolveModelForCapability({
      capabilityKey: "search.nl_interpreter",
    });

    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.modelId).toBe("openai/gpt-oss-120b");
      expect(resolved.engineId).toBe("ai-sdk/openai-compatible/gpt-oss-120b");
      expect(resolved.model).toEqual({ provider: "gpt-oss-model" });
    }
  });
});
