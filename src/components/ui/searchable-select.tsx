"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { SearchableSelectOptions } from "@/components/ui/searchable-select-options";
import {
  computeSelectMenuPosition,
  filterSelectOptions,
  shouldEnableSelectSearch,
  type SelectMenuPosition,
  type SelectOption,
} from "@/lib/select-options";
import { cn } from "@/lib/utils";

export type SearchableSelectProps = {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

export function SearchableSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches",
  searchable,
  disabled = false,
  className,
  title,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: SearchableSelectProps) {
  const listboxId = React.useId();
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? "",
  );
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [position, setPosition] =
    React.useState<SelectMenuPosition | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const optionRefs = React.useRef<Array<HTMLLIElement | null>>([]);
  const lastDefaultValue = React.useRef(defaultValue);
  const focusedForOpen = React.useRef(false);

  const selectedValue = value ?? uncontrolledValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const canSearch = shouldEnableSelectSearch(options.length, searchable);
  const visibleOptions = canSearch
    ? filterSelectOptions(options, query)
    : [...options];

  React.useEffect(() => {
    if (value !== undefined || defaultValue === lastDefaultValue.current) {
      return;
    }
    lastDefaultValue.current = defaultValue;
    setUncontrolledValue(defaultValue ?? "");
  }, [defaultValue, value]);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setPosition(
      computeSelectMenuPosition({
        trigger: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
        },
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        canSearch,
      }),
    );
  }, [canSearch]);

  const openMenu = React.useCallback(() => {
    if (disabled) return;
    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue,
    );
    setQuery("");
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, options, selectedValue]);

  const closeMenu = React.useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const selectOption = React.useCallback(
    (option: SelectOption | undefined) => {
      if (!option || option.disabled) return;
      if (value === undefined) setUncontrolledValue(option.value);
      onValueChange?.(option.value);
      closeMenu(true);
    },
    [closeMenu, onValueChange, value],
  );

  React.useEffect(() => {
    if (!open) {
      setPosition(null);
      focusedForOpen.current = false;
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open || !position || focusedForOpen.current) return;
    focusedForOpen.current = true;
    if (canSearch) {
      searchRef.current?.focus();
    } else {
      listRef.current?.focus();
    }
  }, [canSearch, open, position]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onViewportChange = () => updatePosition();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const moveActive = (delta: number | "first" | "last") => {
    if (visibleOptions.length === 0) return;
    setActiveIndex((current) => {
      if (delta === "first") return 0;
      if (delta === "last") return visibleOptions.length - 1;
      return (current + delta + visibleOptions.length) % visibleOptions.length;
    });
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        moveActive("first");
        break;
      case "End":
        event.preventDefault();
        moveActive("last");
        break;
      case "Enter":
        event.preventDefault();
        selectOption(visibleOptions[activeIndex]);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu(true);
        break;
      case "Tab":
        closeMenu(true);
        break;
      default:
        break;
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    handleMenuKeyDown(event);
  };

  const activeOptionId =
    open && visibleOptions.length > 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={selectedValue} />
      ) : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        title={title ?? selectedOption?.label}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "searchable-select-js flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            selectedOption ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[80] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
              style={{
                left: position.left,
                width: position.width,
                top: position.top,
                bottom: position.bottom,
              }}
              onKeyDown={handleMenuKeyDown}
            >
              {canSearch ? (
                <div className="relative mb-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    role="combobox"
                    aria-expanded="true"
                    aria-haspopup="listbox"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    aria-label={
                      ariaLabel ? `Search ${ariaLabel}` : "Search options"
                    }
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeOptionId}
                    className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              ) : null}
              <SearchableSelectOptions
                options={visibleOptions}
                selectedValue={selectedValue}
                activeIndex={activeIndex}
                listboxId={listboxId}
                activeOptionId={activeOptionId}
                maxListHeight={position.maxListHeight}
                emptyMessage={emptyMessage}
                ariaLabel={ariaLabel}
                listRef={listRef}
                optionRefs={optionRefs}
                onSelect={selectOption}
                onHover={setActiveIndex}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
