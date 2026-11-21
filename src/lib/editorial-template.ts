export const EDITORIAL_OUTLINE = `## Approach

State the key observation, then explain why it works.

- Read the input and keep only the values the answer needs.
- Sweep the elements once, updating the running answer.

## Complexity

- Time: \`O(n)\` — one pass over the input.
- Space: \`O(1)\` — only a constant number of counters.

## Reference solution

\`\`\`cpp
long long solve(const vector<long long>& values) {
    long long answer = 0;
    for (long long value : values) answer += value;
    return answer;
}
\`\`\`

## Edge cases

- Empty or single-element input.
- Values at the minimum and maximum bounds; use \`long long\` for large sums.
`;
