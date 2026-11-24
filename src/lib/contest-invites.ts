/**
 * Contest team invite codes. The alphabet has 32 characters (no `I`, `O`, `0`
 * or `1`) so a random byte maps onto it without modulo bias.
 */
export const CONTEST_INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CONTEST_INVITE_CODE_LENGTH = 8;

/** Maps random bytes onto the invite alphabet. */
export function encodeContestInviteCode(
  bytes: Uint8Array,
  length = CONTEST_INVITE_CODE_LENGTH,
): string {
  if (bytes.length === 0) {
    throw new Error("Invite codes need at least one random byte.");
  }
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const byte = bytes[index % bytes.length] ?? 0;
    code += CONTEST_INVITE_ALPHABET[byte % CONTEST_INVITE_ALPHABET.length];
  }
  return code;
}

/** Users type codes by hand, so accept case and surrounding spaces. */
export function normalizeContestInviteCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidContestInviteCode(value: string): boolean {
  const code = normalizeContestInviteCode(value);
  if (code.length !== CONTEST_INVITE_CODE_LENGTH) return false;
  return [...code].every((char) => CONTEST_INVITE_ALPHABET.includes(char));
}
