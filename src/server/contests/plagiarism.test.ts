import { describe, expect, it } from "vitest";
import { findPlagiarismPairs, similarity } from "./plagiarism";

const base = `#include <bits/stdc++.h>
using namespace std;
int main() {
  int n;
  cin >> n;
  cout << n * 2 << endl;
  return 0;
}`;

describe("source similarity", () => {
  it("detects copied sources despite whitespace and comments", () => {
    const copy = `// my solution
    #include <bits/stdc++.h>
    using namespace std;
    int main(){ int n; cin>>n; cout<<n*2<<endl; return 0; }`;
    expect(similarity(base, copy)).toBeGreaterThan(0.8);
  });

  it("keeps unrelated solutions below the threshold", () => {
    const other = `def solve():
    values = list(map(int, input().split()))
    print(sum(values))`;
    expect(similarity(base, other)).toBeLessThan(0.3);
  });
});

describe("findPlagiarismPairs", () => {
  it("groups by problem and skips the same user", () => {
    const pairs = findPlagiarismPairs(
      [
        {
          id: "s1",
          userId: "u1",
          username: "alice",
          problemId: "p1",
          problemTitle: "A",
          language: "cpp",
          sourceCode: base,
        },
        {
          id: "s2",
          userId: "u2",
          username: "bob",
          problemId: "p1",
          problemTitle: "A",
          language: "cpp",
          sourceCode: base,
        },
        {
          id: "s3",
          userId: "u1",
          username: "alice",
          problemId: "p1",
          problemTitle: "A",
          language: "cpp",
          sourceCode: base,
        },
      ],
      { threshold: 0.7 },
    );
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.left.username).toBe("alice");
    expect(pairs[0]?.right.username).toBe("bob");
  });
});
