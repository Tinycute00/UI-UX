import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const baseField =
  "w-full rounded-xl border-2 border-surface-border bg-white text-ink " +
  "placeholder:text-ink-muted/60 " +
  "focus:border-brand-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 " +
  "disabled:opacity-60 disabled:bg-surface-muted";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(baseField, "h-14 px-4 text-lg", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(baseField, "min-h-[120px] p-4 text-lg leading-relaxed resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  children,
  required,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 font-semibold text-ink">
      <span className="text-lg">
        {children}
        {required ? <span className="ml-1 text-danger-600">*</span> : null}
      </span>
      {hint ? <span className="text-base font-normal text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function FormField({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} required={required} hint={hint}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-base font-medium text-danger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
