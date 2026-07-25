"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ICAN_V6_DOMAIN_META } from "@/lib/intake/i-can-domains";
import {
  ICanV6IntakeSchema,
  createEmptyDomains,
  type ICanV6DomainEntry,
  type ICanV6DomainId,
  type ICanV6Intake,
} from "@/lib/validation/i-can-v6";

export const ICAN_INTAKE_STORAGE_KEY = "mapable-ican-v6-intake";

export type IntakeStoreState = {
  currentStepIndex: number;
  domains: Record<ICanV6DomainId, ICanV6DomainEntry>;
  consentDraftProcessing: boolean;
  consentNoClinicalPaste: boolean;
  submissionId: string | null;
  clientSessionId: string;
};

export type IntakeStoreActions = {
  updateDomain: (
    domainId: ICanV6DomainId,
    patch: Partial<ICanV6DomainEntry>,
  ) => void;
  setDomainCompleted: (domainId: ICanV6DomainId, completed: boolean) => void;
  setStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setConsent: (patch: {
    consentDraftProcessing?: boolean;
    consentNoClinicalPaste?: boolean;
  }) => void;
  hydrateFromPartial: (payload: Partial<IntakeStoreState>) => void;
  clear: () => void;
  getPartialPayload: () => {
    domains: Record<ICanV6DomainId, ICanV6DomainEntry>;
    consentDraftProcessing: boolean;
    consentNoClinicalPaste: boolean;
    clientSessionId: string;
  };
  validateForSubmit: () => ReturnType<typeof ICanV6IntakeSchema.safeParse>;
};

export type IntakeStore = IntakeStoreState & IntakeStoreActions;

function newClientSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ican-${Date.now()}`;
}

function initialState(): IntakeStoreState {
  return {
    currentStepIndex: 0,
    domains: createEmptyDomains(),
    consentDraftProcessing: false,
    consentNoClinicalPaste: false,
    submissionId: null,
    clientSessionId: newClientSessionId(),
  };
}

const maxStepIndex = ICAN_V6_DOMAIN_META.length - 1;

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      updateDomain(domainId, patch) {
        set((state) => ({
          domains: {
            ...state.domains,
            [domainId]: {
              ...state.domains[domainId],
              ...patch,
            },
          },
        }));
      },

      setDomainCompleted(domainId, completed) {
        get().updateDomain(domainId, { completed });
      },

      setStep(index) {
        const clamped = Math.max(0, Math.min(maxStepIndex, index));
        set({ currentStepIndex: clamped });
      },

      nextStep() {
        set((state) => ({
          currentStepIndex: Math.min(
            maxStepIndex,
            state.currentStepIndex + 1,
          ),
        }));
      },

      prevStep() {
        set((state) => ({
          currentStepIndex: Math.max(0, state.currentStepIndex - 1),
        }));
      },

      setConsent(patch) {
        set((state) => ({
          consentDraftProcessing:
            patch.consentDraftProcessing ?? state.consentDraftProcessing,
          consentNoClinicalPaste:
            patch.consentNoClinicalPaste ?? state.consentNoClinicalPaste,
        }));
      },

      hydrateFromPartial(payload) {
        set((state) => ({
          ...state,
          ...payload,
          domains: payload.domains
            ? { ...createEmptyDomains(), ...payload.domains }
            : state.domains,
        }));
      },

      clear() {
        set({
          ...initialState(),
          clientSessionId: newClientSessionId(),
        });
      },

      getPartialPayload() {
        const state = get();
        return {
          domains: state.domains,
          consentDraftProcessing: state.consentDraftProcessing,
          consentNoClinicalPaste: state.consentNoClinicalPaste,
          clientSessionId: state.clientSessionId,
        };
      },

      validateForSubmit() {
        const partial = get().getPartialPayload();
        const candidate: ICanV6Intake | Record<string, unknown> = {
          domains: partial.domains,
          consentDraftProcessing: partial.consentDraftProcessing
            ? true
            : false,
          consentNoClinicalPaste: partial.consentNoClinicalPaste ? true : false,
          clientSessionId: partial.clientSessionId,
        };
        return ICanV6IntakeSchema.safeParse(candidate);
      },
    }),
    {
      name: ICAN_INTAKE_STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return sessionStorage;
      }),
      partialize: (state) => ({
        currentStepIndex: state.currentStepIndex,
        domains: state.domains,
        consentDraftProcessing: state.consentDraftProcessing,
        consentNoClinicalPaste: state.consentNoClinicalPaste,
        submissionId: state.submissionId,
        clientSessionId: state.clientSessionId,
      }),
    },
  ),
);
