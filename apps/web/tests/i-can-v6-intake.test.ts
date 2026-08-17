import { beforeEach, describe, expect, it, vi } from "vitest";

import { assertAllDomainsCovered } from "@/lib/intake/i-can-domains";
import { isICanIntakeEnabled } from "@/lib/config/i-can-intake";
import {
  ICAN_INTAKE_STORAGE_KEY,
  useIntakeStore,
} from "@/lib/intake/use-intake-store";
import {
  ICAN_V6_DOMAIN_IDS,
  ICanV6IntakeSchema,
  createEmptyDomains,
  type ICanV6DomainEntry,
} from "@/lib/validation/i-can-v6";

function completedEntry(
  overrides: Partial<ICanV6DomainEntry> = {},
): ICanV6DomainEntry {
  return {
    supportNeedLevel: "limited",
    frequency: "regularly",
    notes: "Needs intermittent support",
    completed: true,
    ...overrides,
  };
}

function completeAllDomains() {
  const domains = createEmptyDomains();
  for (const id of ICAN_V6_DOMAIN_IDS) {
    domains[id] = completedEntry();
  }
  return domains;
}

describe("I-CAN v6 validation", () => {
  it("covers metadata for every domain id", () => {
    expect(() => assertAllDomainsCovered()).not.toThrow();
  });

  it("rejects incomplete submission", () => {
    const result = ICanV6IntakeSchema.safeParse({
      domains: createEmptyDomains(),
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing consent literals", () => {
    const result = ICanV6IntakeSchema.safeParse({
      domains: completeAllDomains(),
      consentDraftProcessing: false,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully completed payload", () => {
    const result = ICanV6IntakeSchema.safeParse({
      domains: completeAllDomains(),
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
      clientSessionId: "session-1",
    });
    expect(result.success).toBe(true);
  });

  it("strips HTML from notes", () => {
    const result = ICanV6IntakeSchema.safeParse({
      domains: {
        ...completeAllDomains(),
        communication: completedEntry({
          notes: "<script>alert(1)</script>Needs support",
        }),
      },
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domains.communication.notes).toBe("Needs support");
    }
  });
});

describe("useIntakeStore", () => {
  beforeEach(() => {
    useIntakeStore.getState().clear();
  });

  it("updates a domain and validates only when complete", () => {
    const store = useIntakeStore.getState();
    store.updateDomain("communication", {
      supportNeedLevel: "extensive",
      frequency: "daily",
      notes: "AAC preferred",
      completed: true,
    });
    expect(useIntakeStore.getState().domains.communication.supportNeedLevel).toBe(
      "extensive",
    );

    const invalid = useIntakeStore.getState().validateForSubmit();
    expect(invalid.success).toBe(false);

    useIntakeStore.getState().hydrateFromPartial({
      domains: completeAllDomains(),
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    const valid = useIntakeStore.getState().validateForSubmit();
    expect(valid.success).toBe(true);
  });

  it("clears session state", () => {
    useIntakeStore.getState().updateDomain("mobility", {
      notes: "wheelchair",
      completed: true,
      supportNeedLevel: "limited",
      frequency: "daily",
    });
    useIntakeStore.getState().clear();
    expect(useIntakeStore.getState().domains.mobility.notes).toBe("");
    expect(useIntakeStore.getState().consentDraftProcessing).toBe(false);
  });

  it("uses the expected sessionStorage key", () => {
    expect(ICAN_INTAKE_STORAGE_KEY).toBe("mapable-ican-v6-intake");
  });
});

describe("isICanIntakeEnabled", () => {
  it("is off by default", () => {
    expect(isICanIntakeEnabled({})).toBe(false);
    expect(isICanIntakeEnabled({ MAPABLE_ICAN_INTAKE_ENABLED: "false" })).toBe(
      false,
    );
    expect(isICanIntakeEnabled({ MAPABLE_ICAN_INTAKE_ENABLED: "true" })).toBe(
      true,
    );
  });
});

describe("POST /api/participants/intake gate", () => {
  it("returns 503 when flag is off", async () => {
    vi.resetModules();
    vi.stubEnv("MAPABLE_ICAN_INTAKE_ENABLED", "false");
    const { POST } = await import("@/app/api/participants/intake/route");
    const res = await POST(
      new Request("http://localhost/api/participants/intake", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(503);
    vi.unstubAllEnvs();
  });
});
