import type { RatingChangeResult, RatingParticipant } from "@/lib/rating-types";

export const RATING_K_FACTOR = 32;
export const MINIMUM_RATING = 100;

function expectedScore(player: number, opponent: number): number {
  return 1 / (1 + Math.pow(10, (opponent - player) / 400));
}

/**
 * Competition ranking: closes the gaps left by filtering (e.g. unrated rows
 * dropped between rated ones) while preserving ties. Each row keeps the
 * 1-based position where its tie group starts, so [1, 2, 2, 6] becomes
 * [1, 2, 2, 4] and [1, 1, 3] stays [1, 1, 3]. The true last place therefore
 * keeps rank `count` and scores an actual rating score of 0 in
 * `computeRatingChanges`. The input must already be sorted by `rank`
 * ascending, as scoreboard rows are.
 */
export function compactRanks(
  rows: { userId: string; rank: number }[],
): { userId: string; rank: number }[] {
  let previousOriginal: number | null = null;
  let previousRank = 0;
  return rows.map((row, index) => {
    const rank =
      previousOriginal !== null && row.rank === previousOriginal
        ? previousRank
        : index + 1;
    previousOriginal = row.rank;
    previousRank = rank;
    return { userId: row.userId, rank };
  });
}

function setBit(bits: Uint32Array, value: number): void {
  bits[value >> 5] |= 1 << (value & 31);
}

function hasBit(bits: Uint32Array, value: number): boolean {
  return ((bits[value >> 5] >> (value & 31)) & 1) === 1;
}

type GroupChoice = { bumped: boolean[]; residual: number };

/**
 * Chooses which groups receive one whole unit each so the bumped sizes add
 * up to `units`, serving the best priority first. Groups are never split:
 * a group is bumped only when the groups after it can still complete the
 * total. When no combination of whole-group sizes reaches `units`, the
 * closest achievable total wins and the difference is reported as
 * `residual` (positive: short of `units`, negative: past it). The residual
 * is zero unless every remaining group has two or more members and the
 * sizes cannot compose the total — a degenerate all-tie field — and is then
 * bounded by the largest gap in whole-group subset sums. Deterministic:
 * equal priorities keep array order.
 */
type Reachability = {
  multiSums: Uint32Array[];
  multiTotal: number;
  singlesFrom: number[];
  multisFrom: number[];
};

/**
 * Reachability index for whole-group bump choices, over the visit order:
 * `multiSums[k]` holds every subset sum of the last k multi-member groups,
 * and `singlesFrom`/`multisFrom` count the groups from each position on.
 */
function buildReachability(
  order: { size: number; index: number }[],
): Reachability {
  const count = order.length;
  const multiTotal = order.reduce(
    (sum, entry) => sum + (entry.size >= 2 ? entry.size : 0),
    0,
  );
  const multiSums: Uint32Array[] = [];
  let sums = new Uint32Array((multiTotal >> 5) + 1);
  setBit(sums, 0);
  multiSums.push(sums);
  for (let position = count - 1; position >= 0; position -= 1) {
    const size = order[position].size;
    if (size < 2) continue;
    const next = new Uint32Array(sums);
    for (let value = multiTotal - size; value >= 0; value -= 1) {
      if (hasBit(sums, value)) setBit(next, value + size);
    }
    sums = next;
    multiSums.push(sums);
  }

  const singlesFrom = new Array<number>(count + 1).fill(0);
  const multisFrom = new Array<number>(count + 1).fill(0);
  for (let position = count - 1; position >= 0; position -= 1) {
    singlesFrom[position] =
      singlesFrom[position + 1] + (order[position].size === 1 ? 1 : 0);
    multisFrom[position] =
      multisFrom[position + 1] + (order[position].size >= 2 ? 1 : 0);
  }
  return { multiSums, multiTotal, singlesFrom, multisFrom };
}

/** Whether `need` units can be formed from the groups past a position. */
function coversNeed(
  reach: Reachability,
  need: number,
  multisAvail: number,
  singlesAvail: number,
): boolean {
  if (need <= 0) return true;
  if (singlesAvail >= need) return true;
  const reachable = reach.multiSums[multisAvail];
  if (!reachable) return false;
  for (
    let value = Math.max(0, need - singlesAvail);
    value <= Math.min(need, reach.multiTotal);
    value += 1
  ) {
    if (hasBit(reachable, value)) return true;
  }
  return false;
}

/**
 * Chooses which groups receive one whole unit each so the bumped sizes add
 * up to `units`, serving the best priority first. Groups are never split:
 * a group is bumped only when the groups after it can still complete the
 * total. When no combination of whole-group sizes reaches `units`, the
 * closest achievable total wins and the difference is reported as
 * `residual` (positive: short of `units`, negative: past it). The residual
 * is zero unless every remaining group has two or more members and the
 * sizes cannot compose the total — a degenerate all-tie field — and is then
 * bounded by the largest gap in whole-group subset sums. Deterministic:
 * equal priorities keep array order.
 */
function chooseWholeGroupBumps(
  entries: { size: number; priority: number }[],
  units: number,
): GroupChoice {
  const count = entries.length;
  const bumped = new Array<boolean>(count).fill(false);
  if (units <= 0) return { bumped, residual: 0 };
  if (count === 0) return { bumped, residual: units };

  const order = entries
    .map((entry, index) => ({ ...entry, index }))
    .sort(
      (left, right) =>
        right.priority - left.priority || left.index - right.index,
    );
  const reach = buildReachability(order);

  // Prefer an exact total, then the smallest |residual|; under-shoot wins
  // ties. Bumping everything is always reachable, so the scan terminates.
  const totalSizes = reach.singlesFrom[0] + reach.multiTotal;
  let target = -1;
  for (let distance = 0; target < 0; distance += 1) {
    const under = units - distance;
    if (
      under >= 0 &&
      coversNeed(reach, under, reach.multisFrom[0], reach.singlesFrom[0])
    ) {
      target = under;
      break;
    }
    const over = units + distance;
    if (
      over <= totalSizes &&
      coversNeed(reach, over, reach.multisFrom[0], reach.singlesFrom[0])
    ) {
      target = over;
    }
  }

  let remaining = target;
  for (let position = 0; position < count && remaining > 0; position += 1) {
    const size = order[position].size;
    if (size > remaining) continue;
    const after = position + 1;
    if (coversNeed(reach, remaining - size, reach.multisFrom[after], reach.singlesFrom[after])) {
      bumped[order[position].index] = true;
      remaining -= size;
    }
  }
  return { bumped, residual: units - target };
}

/**
 * Rounds the deltas so their sum is exactly `target`, moving every group of
 * identical deltas (tied rank and equal rating) as one unit: its members
 * all take the floor of their shared value, or all take one point more.
 * Exact sums are reached whenever whole-group sizes can compose the
 * remainder; otherwise the smallest residual is left (see
 * `chooseWholeGroupBumps`) rather than splitting a tie. Deterministic, and
 * the per-player error never exceeds one point.
 */
function roundToExactSum(deltas: number[], target: number): number[] {
  const rounded = deltas.map((delta) => Math.floor(delta));
  // Leftover is provably in [0, deltas.length] because a floor-of-sum is
  // never greater than the sum of floors.
  const leftover = target - rounded.reduce((sum, delta) => sum + delta, 0);
  if (leftover <= 0) return rounded;

  const indexesByDelta = new Map<number, number[]>();
  deltas.forEach((delta, index) => {
    const indexes = indexesByDelta.get(delta);
    if (indexes) indexes.push(index);
    else indexesByDelta.set(delta, [index]);
  });
  const groups = [...indexesByDelta.entries()].map(([delta, indexes]) => ({
    indexes,
    fraction: delta - Math.floor(delta),
  }));
  const { bumped } = chooseWholeGroupBumps(
    groups.map((group) => ({ size: group.indexes.length, priority: group.fraction })),
    leftover,
  );
  groups.forEach((group, groupIndex) => {
    if (!bumped[groupIndex]) return;
    for (const index of group.indexes) rounded[index] += 1;
  });
  return rounded;
}

/**
 * Clamps deltas so no rating drops below the floor. Identical deltas stay
 * identical (equal rating means an equal clamp). Returns the clamped deltas
 * plus the total number of points the floor injected into the pool.
 */
function applyRatingFloor(
  participants: RatingParticipant[],
  deltas: number[],
): { deltas: number[]; injected: number } {
  let injected = 0;
  const clamped = deltas.map((delta, index) => {
    const rating = participants[index]?.rating ?? MINIMUM_RATING;
    const floorDelta = MINIMUM_RATING - rating;
    if (delta >= floorDelta) return delta;
    injected += floorDelta - delta;
    return floorDelta;
  });
  return { deltas: clamped, injected };
}

/**
 * Removes `injected` points from the positive deltas so a floor hit does
 * not inflate the total. Each group of identical deltas is reduced as one
 * unit: a proportional floor share for everyone, plus one extra point for
 * whole groups chosen by `chooseWholeGroupBumps`. Shares never exceed the
 * gain, so the floor still holds and winners never drop below their old
 * rating. If the gains cannot cover the injection (nearly every loser
 * already at the floor), all gains are zeroed and the surplus stays: the
 * floor wins over the zero-sum invariant.
 */
function absorbShortfall(deltas: number[], injected: number): number[] {
  if (injected <= 0) return deltas;
  const gains = deltas.map((delta) => Math.max(0, delta));
  const totalGain = gains.reduce((sum, gain) => sum + gain, 0);
  if (totalGain <= 0 || injected >= totalGain) {
    return deltas.map((delta) => Math.min(delta, 0));
  }

  const shares = gains.map((gain) => Math.floor((injected * gain) / totalGain));
  const leftover = injected - shares.reduce((sum, share) => sum + share, 0);
  if (leftover > 0) {
    const indexesByDelta = new Map<number, number[]>();
    deltas.forEach((delta, index) => {
      if (delta <= 0) return;
      const indexes = indexesByDelta.get(delta);
      if (indexes) indexes.push(index);
      else indexesByDelta.set(delta, [index]);
    });
    const groups = [...indexesByDelta.entries()].map(([delta, indexes]) => ({
      indexes,
      rest: (injected * delta) % totalGain,
    }));
    const { bumped } = chooseWholeGroupBumps(
      groups.map((group) => ({
        size: group.indexes.length,
        priority: group.rest,
      })),
      leftover,
    );
    groups.forEach((group, groupIndex) => {
      if (!bumped[groupIndex]) return;
      for (const index of group.indexes) shares[index] += 1;
    });
  }
  return deltas.map((delta, index) => delta - shares[index]);
}

/**
 * Elo-style rating update for one finished contest. Each player's exact
 * delta is `kFactor * (actual - expected)` where the actual score is the
 * fraction of the field beaten, `(count - rank) / (count - 1)`, and the
 * expected score is the mean pairwise win probability. Tied ranks credit
 * every tied player with beating the whole tie group, so the raw deltas
 * only sum to zero without ties; the mean is subtracted to share that tie
 * bias evenly before rounding. Invariants, in priority order: players with
 * the same rank and rating always receive the same integer delta; the
 * integer deltas sum to exactly zero unless no combination of whole tie
 * groups can compose the remainder (then the smallest residual, documented
 * above, is accepted instead of breaking a tie); and no rating drops below
 * the floor, with floor shortfalls absorbed from the winners' gains.
 */
export function computeRatingChanges(
  participants: RatingParticipant[],
  kFactor = RATING_K_FACTOR,
): RatingChangeResult[] {
  const count = participants.length;
  if (count < 2) return [];

  const exactDeltas = participants.map((player) => {
    const expected =
      participants
        .filter((opponent) => opponent.userId !== player.userId)
        .reduce(
          (sum, opponent) => sum + expectedScore(player.rating, opponent.rating),
          0,
        ) / (count - 1);
    const actual = Math.min(
      1,
      Math.max(0, (count - player.rank) / (count - 1)),
    );
    return kFactor * (actual - expected);
  });

  const meanDelta = exactDeltas.reduce((sum, delta) => sum + delta, 0) / count;
  const centred = exactDeltas.map((delta) => delta - meanDelta);
  // Centred deltas sum to floating-point residue only; rounding that sum
  // (to 0) and distributing the remainder makes the integer sum exact.
  const target = Math.round(centred.reduce((sum, delta) => sum + delta, 0));
  const zeroSum = roundToExactSum(centred, target);

  const { deltas: floored, injected } = applyRatingFloor(
    participants,
    zeroSum,
  );
  const deltas = absorbShortfall(floored, injected);

  return participants.map((player, index) => {
    const newRating = player.rating + deltas[index];
    return {
      userId: player.userId,
      rank: player.rank,
      oldRating: player.rating,
      newRating,
      delta: deltas[index],
    };
  });
}
