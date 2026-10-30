"use client";

// Form building blocks. Every input has a visible label, and errors show
// in red next to the field and in a list at the top of the form (NFR-1).

import { useEffect, useRef } from "react";
import type { Option } from "../../lib/options";
import type { FormState } from "../../lib/validate";

type Values = FormState["values"];

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

type Common = {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  errors: Record<string, string>;
  values: Values;
  // Makes ids unique when the same form shows more than once on a page
  idSuffix?: string;
};

function Label({ id, label, optional }: { id: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={id}>
      {label} {optional && <span className="optional">(optional)</span>}
    </label>
  );
}

export function TextField({
  name,
  label,
  hint,
  optional,
  errors,
  values,
  idSuffix,
  type = "text",
  autoComplete,
  multiline,
  inputMode,
}: Common & {
  type?: "text" | "email" | "tel" | "password";
  autoComplete?: string;
  multiline?: boolean;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
}) {
  const id = `f-${name}${idSuffix ?? ""}`;
  const error = errors[name];
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <Label id={id} label={label} optional={optional} />
      {hint && (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {multiline ? (
        <textarea id={id} name={name} defaultValue={asText(values[name])} aria-describedby={described} aria-invalid={!!error} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          defaultValue={type === "password" ? undefined : asText(values[name])}
          aria-describedby={described}
          aria-invalid={!!error}
        />
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  name,
  label,
  hint,
  optional,
  errors,
  values,
  options,
  idSuffix,
  placeholder = "Choose one",
}: Common & { options: Option[]; placeholder?: string }) {
  const id = `f-${name}${idSuffix ?? ""}`;
  const error = errors[name];
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <Label id={id} label={label} optional={optional} />
      {hint && (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      <select id={id} name={name} defaultValue={asText(values[name])} aria-describedby={described} aria-invalid={!!error}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

// A group of big checkboxes (many) or radio buttons (one)
export function ChoiceField({
  name,
  label,
  hint,
  optional,
  errors,
  values,
  options,
  many,
  idSuffix,
  onChange,
}: Common & { options: Option[]; many?: boolean; onChange?: (value: string) => void }) {
  const id = `f-${name}${idSuffix ?? ""}`;
  const error = errors[name];
  const chosen = asList(values[name]);
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <fieldset aria-describedby={error ? `${id}-error` : undefined}>
        <legend id={id} tabIndex={-1}>
          {label} {optional && <span className="optional">(optional)</span>}
        </legend>
        {hint && <span className="hint">{hint}</span>}
        <div className="choices">
          {options.map((o) => (
            <label className="choice" key={o.value || "none"} htmlFor={`${id}-${o.value || "none"}`}>
              <input
                type={many ? "checkbox" : "radio"}
                id={`${id}-${o.value || "none"}`}
                name={name}
                value={o.value}
                defaultChecked={chosen.includes(o.value)}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

// The red box at the top listing every problem, each one a link to its field.
// It takes focus so screen readers announce it right away.
export function ErrorSummary({ state, labels }: { state: FormState; labels?: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(state.errors);
  useEffect(() => {
    if (state.status === "error") ref.current?.focus();
  }, [state.status, state.attempt]);
  if (state.status !== "error" || entries.length === 0) return null;
  return (
    <div className="error-summary" ref={ref} tabIndex={-1} role="alert">
      <h2>Please fix {entries.length === 1 ? "this item" : "these items"}</h2>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            {field === "form" ? (
              message
            ) : (
              <a href={`#f-${field}`} title={labels?.[field]}>
                {message}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Shown in place of the form once it is saved
export function SuccessPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);
  return (
    <div className="success-panel" ref={ref} tabIndex={-1} role="status">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Hidden from people. Spam robots fill in every box, so a filled-in one means a robot.
export function RobotTrap() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label htmlFor="f-website">Leave this empty</label>
      <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function SubmitButton({ pending, children, pendingText = "Sending..." }: { pending: boolean; children: React.ReactNode; pendingText?: string }) {
  return (
    <button type="submit" className="button button-wide" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
