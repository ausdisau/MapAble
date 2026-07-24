"use client";

import { useRef, useState } from "react";

import {
  CONTACT_CONSENT_SCOPES,
  ConsentScopeCheckbox,
} from "@/components/consent/ConsentScopeCheckbox";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SensitiveDataBanner } from "@/components/forms/SensitiveDataBanner";
import {
  CONTACT_TOPICS,
  contactTopicLabels,
  type ContactTopic,
} from "@/lib/contact/contact-form-schema";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type FieldErrors = Partial<
  Record<"name" | "email" | "topic" | "message" | "consent" | "form", string>
>;

const FIELD_ORDER = ["contact-name", "contact-email", "contact-topic", "contact-message"] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("general");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [successMessage, setSuccessMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function focusFirstInvalid(nextErrors: FieldErrors) {
    const map: Record<string, string> = {
      name: "contact-name",
      email: "contact-email",
      topic: "contact-topic",
      message: "contact-message",
      consent: "contact-consent-legend",
    };
    for (const key of ["name", "email", "topic", "message", "consent"] as const) {
      if (!nextErrors[key]) continue;
      const id = map[key];
      const el = document.getElementById(id);
      if (el instanceof HTMLElement) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    for (const id of FIELD_ORDER) {
      const el = document.getElementById(id);
      if (el instanceof HTMLElement) {
        el.focus();
        return;
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Enter your name.";
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    if (message.trim().length < 20) {
      nextErrors.message = "Please add a few more details (at least 20 characters).";
    }
    if (!consentIds.includes("contact_response")) {
      nextErrors.consent =
        "Confirm you allow MapAble to use your contact details to reply.";
    }
    if (!consentIds.includes("no_sensitive_upload")) {
      nextErrors.consent =
        "Confirm you have not pasted NDIS plan or clinical records into this form.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("idle");
      queueMicrotask(() => focusFirstInvalid(nextErrors));
      return;
    }

    setErrors({});
    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          company,
          consentScopes: consentIds,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setErrors({ form: data.error ?? "Could not send your message." });
        setStatus("idle");
        return;
      }

      setSuccessMessage(data.message ?? "Thanks — your message was received.");
      setStatus("success");
      setName("");
      setEmail("");
      setTopic("general");
      setMessage("");
      setCompany("");
      setConsentIds([]);
    } catch {
      setErrors({
        form: "Network error. Check your connection and try again.",
      });
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`${mapablePublicCardClass} border-[#005B7F]/15 bg-[#F6FBFC]`}
        role="status"
        aria-live="polite"
      >
        <p className={mapablePublicSectionTitleClass}>Message sent</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{successMessage}</p>
        <button
          type="button"
          className={`${mapablePublicPrimaryButtonClass} mt-6`}
          onClick={() => {
            setStatus("idle");
            setSuccessMessage("");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className={`${mapablePublicCardClass} border-[#005B7F]/15 bg-white`}
      aria-labelledby="contact-form-heading"
    >
      <p className={mapablePublicSectionTitleClass}>Send a message</p>
      <h2
        id="contact-form-heading"
        className="mapable-display mt-2 text-xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-2xl"
      >
        Tell us how we can help
      </h2>

      <SensitiveDataBanner className="mt-4" id="contact-sensitive-banner" />

      {errors.form ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errors.form}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        <AccessibleFormField
          id="contact-name"
          label="Your name"
          required
          error={errors.name}
        >
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={formInputClass}
            aria-invalid={errors.name ? true : undefined}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="contact-email"
          label="Email address"
          hint="We will reply to this address. Do not include NDIS plan numbers in this field."
          required
          error={errors.email}
        >
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={formInputClass}
            aria-invalid={errors.email ? true : undefined}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="contact-topic"
          label="Topic"
          required
          error={errors.topic}
        >
          <select
            id="contact-topic"
            name="topic"
            required
            value={topic}
            onChange={(event) => setTopic(event.target.value as ContactTopic)}
            className={formInputClass}
            aria-invalid={errors.topic ? true : undefined}
          >
            {CONTACT_TOPICS.map((value) => (
              <option key={value} value={value}>
                {contactTopicLabels[value]}
              </option>
            ))}
          </select>
        </AccessibleFormField>

        <AccessibleFormField
          id="contact-message"
          label="Message"
          hint="Keep this to a short enquiry. Do not paste plan PDFs or clinical notes."
          required
          error={errors.message}
        >
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={`${formInputClass} min-h-[9rem] resize-y`}
            aria-invalid={errors.message ? true : undefined}
          />
        </AccessibleFormField>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-company">Company</label>
          <input
            id="contact-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>

        <ConsentScopeCheckbox
          scopes={CONTACT_CONSENT_SCOPES}
          checkedIds={consentIds}
          onChange={setConsentIds}
          requiredScopeIds={CONTACT_CONSENT_SCOPES.map((s) => s.id)}
          error={errors.consent}
          legend="Consent before sending"
        />
        {/* Focus target for consent errors */}
        <span id="contact-consent-legend" tabIndex={-1} className="sr-only">
          Consent section
        </span>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`${mapablePublicPrimaryButtonClass} w-full sm:w-auto disabled:opacity-60`}
        >
          {status === "loading" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
