import type * as React from "react";
import { Check } from "lucide-react";
import type { SelectOption } from "@/lib/select-options";
import { cn } from "@/lib/utils";

export function SearchableSelectOptions({
  options,
  selectedValue,
  activeIndex,
  listboxId,
  activeOptionId,
  maxListHeight,
  emptyMessage,
  ariaLabel,
  listRef,
  optionRefs,
  onSelect,
  onHover,
}: {
  options: readonly SelectOption[];
  selectedValue: string;
  activeIndex: number;
  listboxId: string;
  activeOptionId?: string;
  maxListHeight: number;
  emptyMessage: string;
  ariaLabel?: string;
  listRef: React.RefObject<HTMLUListElement | null>;
  optionRefs: React.RefObject<Array<HTMLLIElement | null>>;
  onSelect: (option: SelectOption) => void;
  onHover: (index: number) => void;
}) {
  return (
    <ul
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={activeOptionId}
      tabIndex={-1}
      className="overflow-y-auto py-0.5 outline-none"
      style={{ maxHeight: maxListHeight }}
    >
      {options.length === 0 ? (
        <li className="px-2 py-3 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </li>
      ) : (
        options.map((option, index) => {
          const isSelected = option.value === selectedValue;
          return (
            <li
              key={option.value}
              id={`${listboxId}-option-${index}`}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              title={option.label}
              onPointerMove={() => onHover(index)}
              onClick={() => onSelect(option)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                index === activeIndex && "bg-muted text-foreground",
                option.disabled && "pointer-events-none opacity-50",
              )}
            >
              <span className="min-w-0">
                <span className="line-clamp-2 break-words">{option.label}</span>
                {option.description ? (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {isSelected ? (
                <Check
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-primary"
                />
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );
}
