import type { SelectOption } from "@/lib/select-options";
import { cn } from "@/lib/utils";

/**
 * Progressive-enhancement control for named GET form fields. The custom
 * trigger hides itself while a native select is visible only when JavaScript
 * is off; after hydration the hidden input takes over and the native select
 * is disabled, so exactly one control submits.
 */
export function SearchableSelectFallback({
  name,
  id,
  ariaLabel,
  value,
  options,
  hydrated,
  className,
}: {
  name: string;
  id?: string;
  ariaLabel?: string;
  value: string;
  options: readonly SelectOption[];
  hydrated: boolean;
  className?: string;
}) {
  return (
    <>
      <input
        type="hidden"
        name={name}
        value={value}
        disabled={!hydrated}
      />
      <select
        name={name}
        id={id ? `${id}-fallback` : undefined}
        aria-label={ariaLabel}
        defaultValue={value}
        disabled={hydrated}
        className={cn(
          "searchable-select-fallback hidden h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs",
          className,
        )}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
