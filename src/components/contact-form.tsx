"use client";

import { useState, type FormEvent } from "react";
import { ApiError, contactApi } from "@/lib/api-client";
import { contactCategories } from "@/lib/validation";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  website: string;
};

const INITIAL: FormState = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  category: "General inquiry",
  message: "",
  website: "",
};

function validate(values: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = "Enter a valid email address.";
  if (values.phone && values.phone.trim().length > 40) errors.phone = "Phone number is too long.";
  if (values.subject.trim().length < 3) errors.subject = "Subject must be at least 3 characters.";
  if (values.message.trim().length < 10) errors.message = "Message must be at least 10 characters.";
  if (values.message.trim().length > 4000) errors.message = "Message is too long (4000 characters max).";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return; // duplicate submission protection

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setStatus("error");
      setFeedback("Please correct the highlighted fields and try again.");
      return;
    }

    setStatus("sending");
    setFeedback("");

    try {
      await contactApi.send({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        subject: values.subject.trim(),
        category: values.category,
        message: values.message.trim(),
        website: values.website,
      });
      setStatus("sent");
      setValues(INITIAL);
      setFeedback("Thank you — your message has been received. Our team will respond shortly.");
    } catch (error) {
      setStatus("error");
      if (error instanceof ApiError) {
        setFeedback(error.message);
        if (error.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.errors)) {
            mapped[key] = messages[0] ?? "Invalid value.";
          }
          setErrors(mapped);
        }
      } else {
        setFeedback("Unable to send your message right now. Please try again later.");
      }
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none";

  function fieldClass(field: keyof FormState) {
    return `${inputClass} ${errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-brand"}`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div aria-live="polite" className="sr-only">
        {status === "sending" ? "Sending your message" : feedback}
      </div>

      {feedback ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`rounded-md border px-4 py-3 text-sm ${
            status === "sent"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Full name <span aria-hidden="true">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={fieldClass("fullName")}
          />
          {errors.fullName ? (
            <p id="fullName-error" className="mt-1 text-xs text-red-600">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={fieldClass("email")}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1 text-xs text-red-600">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            className={fieldClass("phone")}
          />
        </div>

        <div>
          <label htmlFor="category" className="text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={(event) => update("category", event.target.value)}
            className={`${inputClass} border-slate-300 focus:border-brand`}
          >
            {contactCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-sm font-medium text-slate-700">
          Subject <span aria-hidden="true">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          required
          value={values.subject}
          onChange={(event) => update("subject", event.target.value)}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          className={fieldClass("subject")}
        />
        {errors.subject ? (
          <p id="subject-error" className="mt-1 text-xs text-red-600">
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium text-slate-700">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : "message-hint"}
          className={fieldClass("message")}
        />
        {errors.message ? (
          <p id="message-error" className="mt-1 text-xs text-red-600">
            {errors.message}
          </p>
        ) : (
          <p id="message-hint" className="mt-1 text-xs text-slate-500">
            {values.message.length}/4000 characters
          </p>
        )}
      </div>

      {/* Honeypot field - hidden from real users, catches bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
