export type PlagiarismSubmission = {
  id: string;
  userId: string;
  username: string;
  problemId: string;
  problemTitle: string;
  language: string;
  sourceCode: string;
};

export type PlagiarismPair = {
  problemId: string;
  problemTitle: string;
  similarity: number;
  left: { id: string; username: string; language: string };
  right: { id: string; username: string; language: string };
};

export function normalizeSource(source: string): string[] {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/#.*$/gm, " ")
    .toLowerCase()
    .match(/[a-z_][a-z0-9_]*|\d+|[^\s]/g) ?? [];
}

function shingles(tokens: string[], size = 6): Set<string> {
  if (tokens.length <= size) return new Set(tokens);
  const result = new Set<string>();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

export function similarity(left: string, right: string): number {
  const a = shingles(normalizeSource(left));
  const b = shingles(normalizeSource(right));
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
}

export function findPlagiarismPairs(
  submissions: PlagiarismSubmission[],
  options: { threshold?: number; limit?: number } = {},
): PlagiarismPair[] {
  const threshold = options.threshold ?? 0.75;
  const limit = options.limit ?? 25;
  const byProblem = new Map<string, PlagiarismSubmission[]>();
  for (const submission of submissions) {
    const list = byProblem.get(submission.problemId) ?? [];
    list.push(submission);
    byProblem.set(submission.problemId, list);
  }

  const pairs = new Map<string, PlagiarismPair>();
  for (const [problemId, list] of byProblem) {
    for (let leftIndex = 0; leftIndex < list.length; leftIndex += 1) {
      const left = list[leftIndex];
      if (!left) continue;
      for (let rightIndex = leftIndex + 1; rightIndex < list.length; rightIndex += 1) {
        const right = list[rightIndex];
        if (!right || right.userId === left.userId) continue;
        const score = similarity(left.sourceCode, right.sourceCode);
        if (score < threshold) continue;
        const key = `${problemId}:${[left.userId, right.userId].sort().join(":")}`;
        const previous = pairs.get(key);
        const rounded = Math.round(score * 1000) / 10;
        if (previous && previous.similarity >= rounded) continue;
        pairs.set(key, {
          problemId,
          problemTitle: left.problemTitle,
          similarity: rounded,
          left: {
            id: left.id,
            username: left.username,
            language: left.language,
          },
          right: {
            id: right.id,
            username: right.username,
            language: right.language,
          },
        });
      }
    }
  }

  return [...pairs.values()]
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}
