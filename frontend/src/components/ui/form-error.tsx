import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  className?: string;
}

/**
 * Displays validation errors below form fields
 * 
 * Usage:
 * <FormError message={errors.email} />
 */
export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium text-red-600 mt-1 ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Form field wrapper with automatic error handling
 * 
 * Usage:
 * <FormField
 *   label="Email"
 *   error={errors.email}
 *   required
 * >
 *   <input {...register("email")} />
 * </FormField>
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  helperText,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {error && <FormError message={error} />}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}
