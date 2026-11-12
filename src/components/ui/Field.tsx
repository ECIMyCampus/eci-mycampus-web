'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const control =
  'min-h-touch w-full rounded-control border bg-surface px-3 text-base text-ink placeholder:text-ink-subtle ' +
  'transition-colors duration-fast ease-out disabled:opacity-60';

const controlTone = (error?: string) =>
  error ? 'border-accent-ink' : 'border-line-strong hover:border-ink-subtle focus:border-ink-muted';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Texto "opcional" junto a la etiqueta. */
  optional?: boolean;
  children: React.ReactNode;
}

/** Etiqueta, ayuda y error alrededor de un control. El error se anuncia a lectores de pantalla. */
function FieldShell({ id, label, error, hint, optional, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-subtle">Opcional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-accent-ink">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>;

interface TextFieldProps extends InputProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextField({ label, error, hint, optional, ...input }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, controlTone(error))}
        {...input}
      />
    </FieldShell>
  );
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordField({ label, error, hint, optional, ...input }: TextFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(control, controlTone(error), 'pr-12')}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="pressable absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-control text-ink-muted hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
  placeholder: string;
}

export function SelectField({ label, error, hint, optional, options, placeholder, ...select }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, controlTone(error))}
        {...select}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'type'> {
  label: React.ReactNode;
  error?: string;
}

export function CheckboxField({ label, error, ...input }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[rgb(var(--accent))]"
          {...input}
        />
        <label htmlFor={id} className="text-sm leading-snug text-ink-muted">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}
