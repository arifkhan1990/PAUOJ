import { MESSAGE_MAX_LENGTH } from "./message-format";

/**
 * Caret-safe draft edits shared by the emoji picker and the entity drawer.
 * These are pure so the composer only has to move the caret and re-render.
 */

export type ComposerDraft = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export type TextInsertion = {
  value: string;
  /** Caret position after the edit, in UTF-16 units. */
  caret: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function range(draft: ComposerDraft): { start: number; end: number } {
  const start = clamp(Math.trunc(draft.selectionStart), 0, draft.value.length);
  const end = clamp(Math.trunc(draft.selectionEnd), start, draft.value.length);
  return { start, end };
}

/** Replaces the current selection, refusing edits that exceed the cap. */
export function replaceSelection(
  draft: ComposerDraft,
  insert: string,
  maxLength = MESSAGE_MAX_LENGTH,
): TextInsertion | null {
  if (!insert) return null;
  const { start, end } = range(draft);
  const value = draft.value.slice(0, start) + insert + draft.value.slice(end);
  if (value.length > maxLength) return null;
  return { value, caret: start + insert.length };
}

/** Inserts an emoji at the caret (or over the selection). */
export function insertEmoji(
  draft: ComposerDraft,
  emoji: string,
  maxLength = MESSAGE_MAX_LENGTH,
): TextInsertion | null {
  return replaceSelection(draft, emoji, maxLength);
}

/**
 * Replaces an `@trigger` range with a reference token plus one trailing space.
 * An existing whitespace after the range is reused so the draft never gets a
 * double space in the middle of a sentence.
 */
export function insertReference(
  draft: ComposerDraft,
  token: string,
  maxLength = MESSAGE_MAX_LENGTH,
): TextInsertion | null {
  if (!token) return null;
  const { start, end } = range(draft);
  const following = draft.value.charAt(end);
  const separator = following === "" || !/\s/.test(following) ? " " : "";
  const insert = `${token}${separator}`;
  const value = draft.value.slice(0, start) + insert + draft.value.slice(end);
  if (value.length > maxLength) return null;
  return { value, caret: start + insert.length };
}
