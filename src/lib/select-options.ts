export const SEARCHABLE_SELECT_THRESHOLD = 5;

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

/**
 * Search is enabled automatically when a menu has more than five options.
 * Pass `searchable` to force it on or off for a specific field.
 */
export function shouldEnableSelectSearch(
  optionCount: number,
  searchable?: boolean,
): boolean {
  if (typeof searchable === "boolean") return searchable;
  return optionCount > SEARCHABLE_SELECT_THRESHOLD;
}

export function filterSelectOptions(
  options: readonly SelectOption[],
  query: string,
): SelectOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...options];
  return options.filter((option) =>
    [option.label, option.description, option.value]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(needle)),
  );
}

export type SelectMenuPosition = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxListHeight: number;
};

const VIEWPORT_PADDING = 8;
const MENU_GAP = 6;
const MAX_LIST_HEIGHT = 224;
const MIN_MENU_SPACE = 180;
const MIN_LIST_HEIGHT = 48;
const MIN_MENU_WIDTH = 176;
const SEARCH_CHROME_HEIGHT = 48;
const MENU_CHROME_HEIGHT = 8;

/** Places the menu below the trigger, or above it when there is more room. */
export function computeSelectMenuPosition({
  trigger,
  viewportWidth,
  viewportHeight,
  canSearch,
}: {
  trigger: { top: number; bottom: number; left: number; width: number };
  viewportWidth: number;
  viewportHeight: number;
  canSearch: boolean;
}): SelectMenuPosition {
  const spaceBelow =
    viewportHeight - trigger.bottom - VIEWPORT_PADDING - MENU_GAP;
  const spaceAbove = trigger.top - VIEWPORT_PADDING - MENU_GAP;
  const openAbove = spaceBelow < MIN_MENU_SPACE && spaceAbove > spaceBelow;
  const available = Math.max(openAbove ? spaceAbove : spaceBelow, 96);
  const width = Math.min(
    Math.max(trigger.width, MIN_MENU_WIDTH),
    viewportWidth - VIEWPORT_PADDING * 2,
  );
  const left = Math.min(
    Math.max(trigger.left, VIEWPORT_PADDING),
    viewportWidth - width - VIEWPORT_PADDING,
  );
  const chrome = canSearch ? SEARCH_CHROME_HEIGHT : MENU_CHROME_HEIGHT;

  return {
    left,
    width,
    ...(openAbove
      ? { bottom: viewportHeight - trigger.top + MENU_GAP }
      : { top: trigger.bottom + MENU_GAP }),
    maxListHeight: Math.min(
      MAX_LIST_HEIGHT,
      Math.max(available - chrome, MIN_LIST_HEIGHT),
    ),
  };
}

