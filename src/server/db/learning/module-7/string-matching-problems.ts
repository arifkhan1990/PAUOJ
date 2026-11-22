import type { SeedProblem } from "../../seed-problems";
import { spaceOutput } from "../generated-tests";

export const STRING_MATCHING_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-string-matching-g1",
    title: "Find All Occurrences",
    statement:
      "রাফি ল্যাবরিপোর্টের ভেতরে একটা কী-ওয়ার্ড কোন কোন জায়গায় এসেছে সেগুলোর তালিকা বানাতে চান। একটা টেক্সট আর একটা প্যাটার্ন দেওয়া থাকবে — প্যাটার্নটি যেসব জায়গায় টেক্সটের ভেতরে পুরোপুরি মিলে যায়, সেইসব শুরুর পজিশন বের করুন।\n\nপজিশনগুলো ১ দিয়ে শুরু হওয়া ইনডেক্স হিসেবে দিন এবং ক্রমানুসারে প্রিন্ট করুন। কোনো মিল না থাকলে `-1` প্রিন্ট করুন। মিলগুলো একে অপরের উপর পড়তে পারে।\n\nউদাহরণ: `aaaa`-এ `aa` মিলে যায় তিনটা জায়গায় — `1 2 3`।",
    inputFormat:
      "প্রথম লাইনে টেক্সট `T`, দ্বিতীয় লাইনে প্যাটার্ন `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর দিয়ে গঠিত।",
    outputFormat:
      "সব শুরুর পজিশন (১-ভিত্তিক) ক্রমানুসারে স্পেস দিয়ে এক লাইনে প্রিন্ট করুন। কোনো মিল না থাকলে `-1`।",
    constraints:
      "`1 <= |P| <= |T| <= 5000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "### ধারণা\n\nসবচেয়ে সহজ উপায় প্রতিটি শুরুর ইনডেক্স থেকে পুরো প্যাটার্ন মেলানো, কিন্তু মিল না হওয়া পর্যন্ত যা যা মিলিয়েছেন সেটা কাজে লাগালেই KMP হয়ে যায়। `pi[i]` বলে `P[0..i]`-এর সবচেয়ে লম্বা প্রপার প্রিফিক্স যেটা সাফিক্সও; মিল ভাঙলে `j` সরাসরি `0` না করে `pi[j - 1]`-এ নিয়ে যাওয়া যায়, কারণ সেই অংশ আগেই মিলিয়ে ফেলা হয়েছে।\n\n### ধাপে ধাপে\n\n1. `P`-এর prefix function নিন (`O(|P|)`)।\n2. `T` বাঁ থেকে ডানে একবার ঘুরুন, প্রতিটি অক্ষর দিয়ে `j` এগিয়ে নিন।\n3. `j == len(P)` হলে শুরুর ইনডেক্স `i - len(P) + 1`; সেটা ১ যোগ করে তালিকায় রাখুন।\n4. তারপর `j = pi[j - 1]` করে টানা মিলও ধরুন।\n5. তালিকা খালি হলে `-1`, নাহলে সব পজিশন স্পেস দিয়ে প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\nT, P = lines[0], lines[1]\nm = len(P)\npi = [0] * m\nfor i in range(1, m):\n    j = pi[i - 1]\n    while j > 0 and P[i] != P[j]:\n        j = pi[j - 1]\n    if P[i] == P[j]:\n        j += 1\n    pi[i] = j\nres = []\nj = 0\nfor i, ch in enumerate(T):\n    while j > 0 and ch != P[j]:\n        j = pi[j - 1]\n    if ch == P[j]:\n        j += 1\n    if j == m:\n        res.append(i - m + 2)\n        j = pi[j - 1]\nprint(' '.join(map(str, res)) if res else -1)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(|T| + |P|)`, স্পেস `O(|P|)` শুধু `pi` অ্যারের জন্য। `|T| = |P| = 5000`-এ দুই লুপও সহজে চলে।\n\n### সাধারণ ভুল\n\n- টানা মিল ভুলে যাওয়া: `aaaa`-এ `aa` খুঁজলে উত্তর `1 2 3`; পাওয়ার পর `j = pi[j - 1]` না করলে শুধু `1 3` আসবে।\n- ০-ভিত্তিক ইনডেক্স সরাসরি প্রিন্ট করা — চাওয়া হয়েছে ১ দিয়ে শুরু হওয়া পজিশন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "campuscode\ncode\n", expectedOutput: "7\n", isSample: true },
      { input: "aaaa\naa\n", expectedOutput: "1 2 3\n", isSample: true },
      { input: "abc\nd\n", expectedOutput: "-1\n", isSample: false },
      { input: "ababa\naba\n", expectedOutput: "1 3\n", isSample: false },
      { input: "primeasia\na\n", expectedOutput: "6 9\n", isSample: false },
      {
        input: `${"ab".repeat(1249)}z${"ab".repeat(1250)}\n${"ab".repeat(1249)}\n`,
        expectedOutput: "1 2500 2502\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nT, P = lines[0], lines[1]\nm = len(P)\npi = [0] * m\nfor i in range(1, m):\n    j = pi[i - 1]\n    while j > 0 and P[i] != P[j]:\n        j = pi[j - 1]\n    if P[i] == P[j]:\n        j += 1\n    pi[i] = j\nres = []\nj = 0\nfor i, ch in enumerate(T):\n    while j > 0 and ch != P[j]:\n        j = pi[j - 1]\n    if ch == P[j]:\n        j += 1\n    if j == m:\n        res.append(i - m + 2)\n        j = pi[j - 1]\nprint(' '.join(map(str, res)) if res else -1)\n",
  },
  {
    slug: "learn-m7-string-matching-g2",
    title: "Prefix Function",
    statement:
      "নুসরাত KMP অ্যালগরিদম নিজে থেকে বানাচ্ছেন, আর তার প্রথম ধাপ হলো prefix function বা LPS array তৈরি করা। একটা স্ট্রিং দেওয়া থাকবে — প্রতিটি ইনডেক্সের জন্য `pi[i]` বের করুন।\n\n`pi[i]` হলো `S[0..i]` অংশের এমন সবচেয়ে লম্বা প্রপার প্রিফিক্স যেটা সেই অংশের সাফিক্সও বলে যায়, তার দৈর্ঘ্য (proper মানে পুরো অংশটা নয়)।\n\nউদাহরণ: `abcab` এর `pi` হলো `0 0 0 1 2` — `i = 4`-এ `ab` প্রিফিক্স ও সাফিক্স উভয়েই আছে।",
    inputFormat: "এক লাইনে একটা স্ট্রিং `S` (শুধু ছোট হাতের ইংরেজি অক্ষর)।",
    outputFormat:
      "`pi[0]`, `pi[1]`, ..., `pi[n-1]` স্পেস দিয়ে এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= |S| <= 2000`",
    editorial:
      "### ধারণা\n\n`pi[i]` বের করার সময় ধরুন আমরা জানি `S[0..i-1]` অংশের সবচেয়ে লম্বা মিলটা ছিল `j`। এখন `S[i]` যদি `S[j]`-এর সাথে মেলে, তাহলে `j + 1` হলো নতুন উত্তর। মিল না হলে ছোট একটা বর্ডারে নেমে আসা যায়, কারণ `pi[j - 1]` আগের মিলের মধ্যেও মিল; এভাবে শূন্য না হওয়া পর্যন্ত `j = pi[j - 1]` করা যায়।\n\n### ধাপে ধাপে\n\n1. `pi` অ্যারে `0` দিয়ে শুরু করুন (`pi[0]` সবসময় `0`)।\n2. `i = 1` থেকে `n - 1`: `j = pi[i - 1]` ধরুন।\n3. `j > 0` এবং `S[i] != S[j]` হলে `j = pi[j - 1]`।\n4. `S[i] == S[j]` হলে `j += 1`; শেষে `pi[i] = j`।\n5. সব `i`-এর জন্য পুনরাবৃত্তি করে অ্যারে প্রিন্ট করুন।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nn = len(s)\npi = [0] * n\nfor i in range(1, n):\n    j = pi[i - 1]\n    while j > 0 and s[i] != s[j]:\n        j = pi[j - 1]\n    if s[i] == s[j]:\n        j += 1\n    pi[i] = j\nprint(' '.join(map(str, pi)))\n```\n\nC++-তে একই লজিক:\n\n```cpp\nvector<int> pi(n);\nfor (int i = 1; i < n; i++) {\n    int j = pi[i - 1];\n    while (j > 0 && s[i] != s[j]) j = pi[j - 1];\n    if (s[i] == s[j]) j++;\n    pi[i] = j;\n}\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(|S|)` — `while` লুপ মোটে যতবার `j` বাড়ে ততবারই কমে, তাই প্রতিটি ধাপ `O(1)` গড়ে। স্পেস `O(|S|)`।\n\n### সাধারণ ভুল\n\n- মিল না হলে `j = 0` করে দেওয়া — `pi` ছাড়া শুরু থেকে আবার মিলিয়ে দেখতে হয়, সময় বেড়ে যায় এবং বর্ডারের লাভ মিলিয়ে যায়।\n- `pi[i] = i + 1` লিখে দেওয়া — proper border পুরো অংশ হতে পারে না, সর্বোচ্চ `i`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "aaaa\n", expectedOutput: "0 1 2 3\n", isSample: true },
      { input: "abcab\n", expectedOutput: "0 0 0 1 2\n", isSample: true },
      { input: "a\n", expectedOutput: "0\n", isSample: false },
      { input: "abababab\n", expectedOutput: "0 0 1 2 3 4 5 6\n", isSample: false },
      { input: "xyz\n", expectedOutput: "0 0 0\n", isSample: false },
      { input: "aabaaab\n", expectedOutput: "0 1 0 1 2 2 3\n", isSample: false },
      {
        input: `${"ab".repeat(1000)}\n`,
        expectedOutput: spaceOutput([
          0,
          0,
          ...Array.from({ length: 1998 }, (_, i) => i + 1),
        ]),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nn = len(s)\npi = [0] * n\nfor i in range(1, n):\n    j = pi[i - 1]\n    while j > 0 and s[i] != s[j]:\n        j = pi[j - 1]\n    if s[i] == s[j]:\n        j += 1\n    pi[i] = j\nprint(' '.join(map(str, pi)))\n",
  },
  {
    slug: "learn-m7-string-matching-e1",
    title: "Is the Word There?",
    statement:
      "সাদিয়া নিজের নোটে কোন শব্দটা আছে কিনা এক নজরে জানতে চান। একটা টেক্সট আর একটা শব্দ দেওয়া থাকবে — শব্দটি কি টেক্সটের অংশ হিসেবে (পাশাপাশি, একটানা) আছে না কিনা বলুন।\n\nউদাহরণ: টেক্সট `campus code lab` এবং শব্দ `code` হলে উত্তর `YES`; শব্দ `university` হলে `NO`।",
    inputFormat:
      "প্রথম লাইনে টেক্সট `T` (স্পেস থাকতে পারে), দ্বিতীয় লাইনে শব্দ `W`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর ও স্পেস দিয়ে গঠিত।",
    outputFormat: "`W` পাওয়া গেলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= |W| <= |T| <= 1000`",
    editorial:
      "### ধারণা\n\nশব্দটা টেক্সটের কোনো অংশে পাশাপাশি আছে কিনা — এটাই সাবস্ট্রিং চেক। Python-এ `W in T` বা `T.find(W) != -1` সরাসরি এই কাজ করে। নিজে বানাতে চাইলে প্রতিটি শুরুর ইনডেক্স থেকে পুরো শব্দ মেলিয়ে দেখুন — ছোট ইনপুটে সময় `O(|T| * |W|)` যথেষ্ট।\n\n### ধাপে ধাপে\n\n1. টেক্সট আর শব্দ দুটো আলাদা লাইন থেকে পড়ে নিন (`splitlines()` দিয়ে, শেষের নিউলাইন বাদ)।\n2. `W in T` দিয়ে যাচাই করুন।\n3. মিললে `YES`, নাহলে `NO` প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\nT, W = lines[0], lines[1]\nprint('YES' if W in T else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(|T| + |W|)` (CPython সার্চ), স্পেস `O(|T| + |W|)` ইনপুট ধরে। নিজে লুপ লিখলে `O(|T| * |W|)`, যা `|T| = 1000`-এও চলে।\n\n### সাধারণ ভুল\n\n- টেক্সট আর শব্দের ক্রম উল্টিয়ে দেওয়া — `T in W` লিখলে বড় টেক্সটে সবসময় `NO`।\n- স্পেস সহ টেক্সট পড়তে গিয়ে `split()`-এর বদলে শুধু প্রথম শব্দটা নিয়ে ফেলা — `campus code lab` থেকে তখন কেবল `campus` আসবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching"],
    tests: [
      { input: "campus code lab\ncode\n", expectedOutput: "YES\n", isSample: true },
      { input: "primeasia\nuniversity\n", expectedOutput: "NO\n", isSample: true },
      { input: "a\na\n", expectedOutput: "YES\n", isSample: false },
      { input: "abcdef\nf\n", expectedOutput: "YES\n", isSample: false },
      { input: "abc\nabc\n", expectedOutput: "YES\n", isSample: false },
      { input: "abab\naba\n", expectedOutput: "YES\n", isSample: false },
      {
        input: `${"x".repeat(1000)}\nxy\n`,
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nT, W = lines[0], lines[1]\nprint('YES' if W in T else 'NO')\n",
  },
  {
    slug: "learn-m7-string-matching-m1",
    title: "Count the Pattern",
    statement:
      "তানভীর সার্ভার লজ স্ক্যান করছেন — কোনো সাসপেক্ট IP প্যাটার্ন কয়বার এসেছে সেটা গুনতে চান। দীর্ঘ টেক্সট আর প্যাটার্ন দেওয়া থাকবে; প্যাটার্নের মিলগুলো একে অপরের উপর পড়তে পারে এবং প্রতিটিই গুনবে।\n\nউদাহরণ: `aaaa`-এ `aa` তিনবার পাওয়া যায় (শুরু `1`, `2`, `3`), তাই উত্তর `3`।",
    inputFormat:
      "প্রথম লাইনে টেক্সট `T`, দ্বিতীয় লাইনে প্যাটার্ন `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat: "মিলগুলোর সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= |P| <= |T| <= 200000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "### ধারণা\n\nএখানে ইনপুট বড়, তাই প্রতিটি শুরু থেকে মেলানো যায় না (`O(|T| * |P|)` = `4 * 10^10` তুলনা)। KMP-এ প্রতিটি অক্ষর সর্বোচ্চ কয়েকবার পরীক্ষা হয়, তাই মোট সময় থাকে `O(|T| + |P|)`। মিল পাওয়ার পর `j = pi[j - 1]` করলে টানা মিলও ধরা পড়ে — এটাই এই সমস্যার মূল শর্ত।\n\n### ধাপে ধাপে\n\n1. `|P| > |T|` হলে সঙ্গে সঙ্গে `0` প্রিন্ট করে থামুন।\n2. `P`-এর prefix function নিন।\n3. `T`-এর প্রতিটি অক্ষর দিয়ে `j` এগিয়ে নিন; `j == |P|` হলে কাউন্টার `1` বাড়িয়ে `j = pi[j - 1]` করুন।\n4. কাউন্টার প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\nT, P = lines[0], lines[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    pi = [0] * m\n    for i in range(1, m):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    j = 0\n    count = 0\n    for ch in T:\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == m:\n            count += 1\n            j = pi[j - 1]\n    print(count)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(|T| + |P|)`, স্পেস `O(|P|)`। `|T| = 200000`-এ Python-এও এক সেকেন্ডের কমে চলে।\n\n### সাধারণ ভুল\n\n- ওভারল্যাপ মিল বাদ দেওয়া: `aaaa`-এ `aa` তখন মাত্র `2` আসবে, কিন্তু সঠিক উত্তর `3`।\n- `T` পড়ার সময় লাইন ভাঙা: টেক্সটে স্পেস না থাকলেও `split()` ব্যবহার করলে শেষের নিউলাইনজনিত সমস্যা এড়ানো যায়, তবে দুই লাইন পড়াই নিরাপদ।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "aaaa\naa\n", expectedOutput: "3\n", isSample: true },
      { input: "abcde\nxyz\n", expectedOutput: "0\n", isSample: true },
      { input: "ababa\naba\n", expectedOutput: "2\n", isSample: false },
      { input: "a\na\n", expectedOutput: "1\n", isSample: false },
      { input: "aaaaa\na\n", expectedOutput: "5\n", isSample: false },
      { input: "xyzxyz\nxyz\n", expectedOutput: "2\n", isSample: false },
      {
        input: `${"a".repeat(200000)}\n${"a".repeat(100000)}\n`,
        expectedOutput: "100001\n",
        isSample: false,
      },
      {
        input: `${"ab".repeat(100000)}\nabab\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nT, P = lines[0], lines[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    pi = [0] * m\n    for i in range(1, m):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    j = 0\n    count = 0\n    for ch in T:\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == m:\n            count += 1\n            j = pi[j - 1]\n    print(count)\n",
  },
  {
    slug: "learn-m7-string-matching-h1",
    title: "Pattern in a Repeated Text",
    statement:
      "ক্যাম্পাস ফেস্টিভালের পোস্টারে একটা ছোট স্লোগান `S` বারবার লেখা হয়েছে — মোট `K` বার। সদি জানতে চান এই লম্বা টেক্সটে (যেটা `S`-এর `K` কাপ জোড়া লাগিয়ে তৈরি) প্যাটার্ন `P` কয়বার এসেছে।\n\nমিলগুলো একে অপরের উপর পড়তে পারে এবং প্রতিটিই গুনবে। টেক্সট সরাসরি বানানো যাবে না — এর দৈর্ঘ্য `K * |S|` হতে পারে `10^14` পর্যন্ত।\n\nউদাহরণ: `S = ab`, `P = ab`, `K = 3` → টেক্সট `ababab`, উত্তর `3`।",
    inputFormat:
      "তিন লাইন: প্রথম লাইনে `S`, দ্বিতীয় লাইনে `P`, তৃতীয় লাইনে `K`। সব স্ট্রিং শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat: "মিলগুলোর মোট সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= |S| <= 100000`\n`1 <= |P| <= 100000`\n`1 <= K <= 10^9`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "### ধারণা\n\nটেক্সট `T = S` কে `K` বার জোড়া, তাই `T` অসীম পুনরাবৃত্ত স্ট্রিং `S^∞`-এর প্রথম `K * |S|` অক্ষর। মূল পর্যবেক্ষণ: যেকোনো পজিশন `i` থেকে মিল কিনা কেবল `i mod |S|`-এর উপর নির্ভর করে, কারণ স্ট্রিংটা প্রতি `|S|` অক্ষরে পুনরাবৃত্ত।\n\nতাই দুই ভাগে ভাগ করুন:\n\n1. **কোন কোন ভাগে (residue) মিল হয়:** `W = S`-এর যথেষ্ট কাপ জোড়া (দৈর্ঘ্য `|S| + |P|`) বানিয়ে KMP চালান এবং শুরু `0` থেকে `|S| - 1` পর্যন্ত পজিশনের মিল ধরুন।\n2. **সেই ভাগ থেকে কয়বার মিল হবে:** residue `r`-এ শুরু হওয়া পজিশনগুলো `q * |S| + r` (`q = 0, 1, ...`)। প্রতিটির জন্য শর্ত `q * |S| + r + |P| <= K * |S|`, অর্থাৎ `q <= (K * |S| - |P| - r) // |S|`। এই সীমার মধ্যে যতটা `q` বসে, উত্তর সেতটা।\n\n### ধাপে ধাপে\n\n1. `|P| > K * |S|` হলে উত্তর `0` (টেক্সটেই জায়গা নেই)।\n2. `W` বানান: `S`-এর `ceil((|S| + |P|) / |S|)` কাপ, তারপর প্রথম `|S| + |P|` অক্ষর।\n3. `W`-এ KMP চালিয়ে শুরু `r < |S|` যেসব মিল পাওয়া যায় সেগুলো `match[r] = 1` করে রাখুন।\n4. প্রতিটি `r`-এর জন্য উপরের সূত্রে বৈধ `q`-এর সংখ্যা যোগ করুন।\n5. মোট যোগফল প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\nS, P = lines[0], lines[1]\nK = int(lines[2])\nL, M = len(S), len(P)\nif M > K * L:\n    print(0)\nelse:\n    need = L + M\n    W = (S * ((need + L - 1) // L))[:need]\n    pi = [0] * M\n    for i in range(1, M):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    match = [0] * L\n    j = 0\n    for i, ch in enumerate(W):\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == M:\n            start = i - M + 1\n            if start < L:\n                match[start] = 1\n            j = pi[j - 1]\n    total = 0\n    for r in range(L):\n        if match[r]:\n            q = min(K - 1, (K * L - M - r) // L)\n            if q >= 0:\n                total += q + 1\n    print(total)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(|S| + |P|)`, স্পেস `O(|S| + |P|)`। টেক্সটের দৈর্ঘ্য `10^14` হলেও আমরা কেবল এক কাপের মতো অংশই ধরে থাকি।\n\n### সাধারণ ভুল\n\n- পুরো টেক্সট বানানোর চেষ্টা করা — `K * |S|` মেমোরি/সময় নিয়ে সরাসরি TLE/MLE।\n- শুধু একটা কাপের মিল ধরে বাকি `K - 1` কাপ গুনে ফেলা: শেষ কাপে প্যাটার্ন কাটা পড়তে পারে, তাই `q`-এর সীমা `K * |S| - |P|` দিয়ে মাপা জরুরি।\n- `match` অ্যারেতে `start < |S|` শর্ত না রাখা — পুনরাবৃত্তির শেষ অংশে ভুল রেসিডিউ ধরা পড়ে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "ab\nab\n1\n", expectedOutput: "1\n", isSample: true },
      { input: "ab\nab\n3\n", expectedOutput: "3\n", isSample: true },
      { input: "aba\nba\n2\n", expectedOutput: "2\n", isSample: false },
      { input: "a\naa\n3\n", expectedOutput: "2\n", isSample: false },
      { input: "abc\nd\n10\n", expectedOutput: "0\n", isSample: false },
      { input: "abc\nabcabc\n1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "ab\na\n1000000000\n",
        expectedOutput: "1000000000\n",
        isSample: false,
      },
      {
        input: `${"ab".repeat(50000)}\n${"ab".repeat(50000)}\n1000000000\n`,
        expectedOutput: "49999999950001\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nS, P = lines[0], lines[1]\nK = int(lines[2])\nL, M = len(S), len(P)\nif M > K * L:\n    print(0)\nelse:\n    need = L + M\n    W = (S * ((need + L - 1) // L))[:need]\n    pi = [0] * M\n    for i in range(1, M):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    match = [0] * L\n    j = 0\n    for i, ch in enumerate(W):\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == M:\n            start = i - M + 1\n            if start < L:\n                match[start] = 1\n            j = pi[j - 1]\n    total = 0\n    for r in range(L):\n        if match[r]:\n            q = min(K - 1, (K * L - M - r) // L)\n            if q >= 0:\n                total += q + 1\n    print(total)\n",
  },
  {
    slug: "learn-m7-string-matching-x1",
    title: "First Occurrence",
    statement:
      "ফেস্টিভালের ভলান্টিয়ার তালিকায় প্রথমবার যে নামটি এসেছে সেটাই দেখতে চায় সাদিয়া। টেক্সট আর প্যাটার্ন দেওয়া থাকবে — প্যাটার্নের সবচেয়ে আগের মিলটির পজিশন (১-ভিত্তিক) প্রিন্ট করুন। কোনো মিল না থাকলে `-1`।\n\nউদাহরণ: `banana`-এ `nana` আসে পজিশন `3`।",
    inputFormat:
      "প্রথম লাইনে টেক্সট `T`, দ্বিতীয় লাইনে প্যাটার্ন `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat:
      "সবচেয়ে আগের মিলের ১-ভিত্তিক পজিশন, নাহলে `-1`।",
    constraints: "`1 <= |P| <= |T| <= 100000`",
    editorial:
      "### ধারণা\n\nএকেবারে প্রথম মিলটাই চাওয়া হচ্ছে, তাই প্রতিটি শুরুর ইনডেক্স থেকে মিলিয়ে একটা পাওয়া গেলেই থামা যায়। Z-algorithm একটাই পাসে পুরো টেক্সট ঘুরে `Z[i]` বের করে, তারপর `Z`-এর মান `|P|` বরাবর যে ইনডেক্স পাওয়া যায় সেটাই উত্তর। ছোট ইনপুটে সরাসরি তুলনা করলেও চলে; বড় ইনপুটে Python-এর `T.find(P)` বা KMP ব্যবহার করুন।\n\n### ধাপে ধাপে\n\n1. `T` আর `P` পড়ে নিন।\n2. `idx = T.find(P)` — পাওয়া গেলে `0`-ভিত্তিক ইনডেক্স, নাহলে `-1`।\n3. `idx != -1` হলে `idx + 1` (১-ভিত্তিক) প্রিন্ট করুন, নাহলে `-1`।\n\n```python\nimport sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nidx = T.find(P)\nprint(idx + 1 if idx != -1 else -1)\n```\n\nকিন্তু KMP দিয়ে নিজে বানালে যেকোনো প্রথম মিলেই `break` করলেই হয় — সময় তখনও `O(|T| + |P|)`।\n\n### কমপ্লেক্সিটি\n\nসময় `O(|T| + |P|)`, স্পেস `O(|P|)` (KMP) বা `O(1)` অতিরিক্ত (`find`)।\n\n### সাধারণ ভুল\n\n- `find` ফেরত `0` দিলে সেটাকে মিল না বলে ধরা: Python-এ `0` সত্য নয়, তাই `if idx:` লিখলে পজিশন `1` হারিয়ে যায়; `idx != -1` বা `idx >= 0` লিখুন।\n- সব মিল খুঁজে বের করা — এখানে প্রথমটাই যথেষ্ট, প্রথম পাওয়ার পর থামুন।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "Z Algorithm"],
    tests: [
      { input: "campuslab\nlab\n", expectedOutput: "7\n", isSample: true },
      { input: "abcdef\nz\n", expectedOutput: "-1\n", isSample: true },
      { input: "aaaa\naa\n", expectedOutput: "1\n", isSample: false },
      { input: "abc\nabc\n", expectedOutput: "1\n", isSample: false },
      { input: "banana\nnana\n", expectedOutput: "3\n", isSample: false },
      {
        input: `${"ab".repeat(50000)}\nb${"ab".repeat(49999)}\n`,
        expectedOutput: "2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nidx = T.find(P)\nprint(idx + 1 if idx != -1 else -1)\n",
  },
  {
    slug: "learn-m7-string-matching-x2",
    title: "Count the Borders",
    statement:
      "তানভীর একটা স্ট্রিং নিয়ে বর্ডার খুঁজছেন — এমন প্রপার প্রিফিক্স যেটা সাফিক্সও। একটা স্ট্রিং দেওয়া থাকবে, তার কয়টা বর্ডার আছে সেটা গুনে প্রিন্ট করুন।\n\nবর্ডার হলো এমন উপস্ট্রিং যা শুরুতেও আছে, শেষেও আছে, কিন্তু পুরো স্ট্রিং নয়। প্রতিটা বর্ডারের নিজেও একটা বর্ডার থাকে — এই শৃঙ্খলা ধরেই গুনতে হবে।\n\nউদাহরণ: `aaaa`-এ বর্ডার `a`, `aa`, `aaa` → উত্তর `3`।",
    inputFormat: "এক লাইনে একটা স্ট্রিং `S` (শুধু ছোট হাতের ইংরেজি অক্ষর)।",
    outputFormat: "বর্ডারের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= |S| <= 100000`",
    editorial:
      "### ধারণা\n\nপুরো স্ট্রিংয়ের সবচেয়ে লম্বা বর্ডার হলো `pi[n - 1]`, যেখানে `n = |S|`। আর প্রতিটা বর্ডারের নিজেও বর্ডার — তাই `j = pi[n - 1]` ধরে `j = pi[j - 1]` করতে করতে `0` না হওয়া পর্যন্ত গেলে প্রতিটি ধাপই একটা করে বর্ডার দেয়। শুধু গুনলেই যথেষ্ট, তালিকা বানানো লাগে না।\n\n### ধাপে ধাপে\n\n1. `S` পড়ে prefix function `pi` বানান।\n2. `j = pi[n - 1]` ধরুন, `count = 0`।\n3. `j > 0` হওয়া পর্যন্ত: `count += 1`, তারপর `j = pi[j - 1]`।\n4. `count` প্রিন্ট করুন।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nn = len(s)\npi = [0] * n\nfor i in range(1, n):\n    j = pi[i - 1]\n    while j > 0 and s[i] != s[j]:\n        j = pi[j - 1]\n    if s[i] == s[j]:\n        j += 1\n    pi[i] = j\ncount = 0\nj = pi[n - 1]\nwhile j > 0:\n    count += 1\n    j = pi[j - 1]\nprint(count)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(|S|)` prefix function-এর জন্য, শৃঙ্খলা ঘোরাটাও সর্বোচ্চ `O(|S|)` (প্রতিটি ধাপে `j` কমে)। স্পেস `O(|S|)`।\n\n### সাধারণ ভুল\n\n- `pi[n - 1]` নিয়ে থামে দেওয়া — শুধু সবচেয়ে লম্বা বর্ডার পাওয়া যায়, ছোটগুলো বাদ পড়ে (`aaaa`-এ উত্তর তখন `1`, কিন্তু সঠিক `3`)।\n- `while j > 0` না লিখে `while j >= 0` লিখা — `pi[0] = 0`, তাই অসীম লুপ বা ভুল কাউন্ট।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "aaaa\n", expectedOutput: "3\n", isSample: true },
      { input: "abcab\n", expectedOutput: "1\n", isSample: true },
      { input: "a\n", expectedOutput: "0\n", isSample: false },
      { input: "abababab\n", expectedOutput: "3\n", isSample: false },
      { input: "abcde\n", expectedOutput: "0\n", isSample: false },
      {
        input: `${"a".repeat(100000)}\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
      {
        input: `${"ab".repeat(50000)}\n`,
        expectedOutput: "49999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nn = len(s)\npi = [0] * n\nfor i in range(1, n):\n    j = pi[i - 1]\n    while j > 0 and s[i] != s[j]:\n        j = pi[j - 1]\n    if s[i] == s[j]:\n        j += 1\n    pi[i] = j\ncount = 0\nj = pi[n - 1]\nwhile j > 0:\n    count += 1\n    j = pi[j - 1]\nprint(count)\n",
  },
];
