import type { SeedProblem } from "../../seed-problems";
import { spaceOutput } from "../generated-tests";

export const STRING_MATCHING_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-string-matching-e2",
    title: "Smallest Repeating Block",
    statement:
      "ফেস্টিভালের ব্যানারে সাদিয়ার দল একটা ছোট স্লোগান আবার আবার লিখে পুরো লেখা বানিয়েছিল। ব্যানার দেখে সবাই ভাবছিল — পুরো লেখাটা আসলে কোন ছোট ব্লক পাশাপাশি কয়বার লিখে তৈরি? একটা স্ট্রিং `S` দেওয়া থাকবে; যদি `S`-কে কোনো ছোট ব্লক বারবার জোড়া লাগিয়ে ঠিক `S` বানানো যায়, তাহলে সবচেয়ে ছোট সেই ব্লকটা প্রিন্ট করো। এমন কোনো ছোট ব্লক না থাকলে `S` নিজেই একমাত্র উত্তর।\n\nউদাহরণ: `ababab` হলো `ab` তিনবার, তাই উত্তর `ab`; `aba`-কে ছোট ব্লকে ভাঙা যায় না, তাই উত্তর `aba`।",
    inputFormat:
      "এক লাইনে স্ট্রিং `S` (শুধু ছোট হাতের ইংরেজি অক্ষর)।",
    outputFormat: "সবচেয়ে ছোট পুনরাবৃত্ত ব্লকটা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= |S| <= 200000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nprefix function-এর সবচেয়ে বড় বর্ডারই এখানে কাজ করে। `pi[n-1]` বলে `S`-এর শেষে যে অংশটা আছে ঠিক ততটা শুরুতেও আছে। তাহলে `p = n - pi[n-1]` হলো স্ট্রিংটার ক্ষুদ্রতম period: প্রতিটি `i`-এ `S[i] = S[i + p]`। যদি `n` কে `p` নিঃশেষে ভাগ করা যায় (`n % p == 0`), তাহলে `S` আসলে প্রথম `p` অক্ষরের ব্লক `n / p` বার লেখা। নাহলে ছোট ব্লকের কোনো ব্যবস্থাই `n` পূরণ করে না — শেষ ব্লকটা কাটা পড়ে, তখন উত্তর পুরো `S`।\n\n## ধাপে ধাপে\n\n1. `S` পড়ে prefix function `pi` বানাও (`O(n)`)।\n2. `p = n - pi[n-1]` ধরো।\n3. `n % p == 0` হলে উত্তর `S`-এর প্রথম `p` অক্ষর।\n4. নাহলে উত্তর পুরো `S` প্রিন্ট করো।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nn = len(s)\npi = [0] * n\nfor i in range(1, n):\n    j = pi[i - 1]\n    while j > 0 and s[i] != s[j]:\n        j = pi[j - 1]\n    if s[i] == s[j]:\n        j += 1\n    pi[i] = j\np = n - pi[n - 1]\nprint(s[:p] if n % p == 0 else s)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` শুধু `pi` অ্যারের জন্য। `n = 200000`-এও Python-এ দ্রুত চলে।\n\n## সাধারণ ভুল\n\n- **`n % p` যাচাই না করা:** `aba`-র period `p = 2`, কিন্তু `3 % 2 != 0` — ব্লক `ab` দিয়ে `aba` বানানো যায় না, উত্তর পুরো স্ট্রিং।\n- **আলাদা করে ছোট period খোঁজা:** `pi[n-1]`-ই সবচেয়ে বড় বর্ডার, তাই `n - pi[n-1]`-ই ক্ষুদ্রতম period; বর্ডারের শৃঙ্খলা ঘুরে আরেকটা মান বসানো ভুল উত্তর দেয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "ababab\n", expectedOutput: "ab\n", isSample: true },
      { input: "aba\n", expectedOutput: "aba\n", isSample: true },
      { input: "aaaa\n", expectedOutput: "a\n", isSample: false },
      { input: "a\n", expectedOutput: "a\n", isSample: false },
      { input: "abcabcabc\n", expectedOutput: "abc\n", isSample: false },
      { input: "abababa\n", expectedOutput: "abababa\n", isSample: false },
      {
        input: `${"ab".repeat(100000)}\n`,
        expectedOutput: "ab\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nn = len(s)\npi = [0] * n\nfor i in range(1, n):\n    j = pi[i - 1]\n    while j > 0 and s[i] != s[j]:\n        j = pi[j - 1]\n    if s[i] == s[j]:\n        j += 1\n    pi[i] = j\np = n - pi[n - 1]\nprint(s[:p] if n % p == 0 else s)\n",
  },
  {
    slug: "learn-m7-string-matching-e3",
    title: "Word Hash",
    statement:
      "নুসরাত Rabin-Karp শেখার প্রথম ধাপ হিসেবে হ্যাশ বের করার কাজটা নিজে করছিলেন। নিয়মটা সরল: শব্দের প্রতিটি অক্ষরকে তার ASCII মানের সংখ্যা ভেবে বাঁ থেকে ডানে একটা চলমান হ্যাশ বানানো — প্রতি ধাপে `h = (h * B + অক্ষরের মান) mod M`।\n\nএকটা শব্দ `S` আর দুটো সংখ্যা `B` ও `M` দেওয়া থাকবে; পুরো শব্দটা প্রক্রিয়া করার পর হ্যাশটা প্রিন্ট করো।\n\nউদাহরণ: `S = abc`, `B = 2`, `M = 1000000007` হলে ধাপে ধাপে হ্যাশ `97 → 292 → 683`, তাই উত্তর `683`।",
    inputFormat:
      "এক লাইনে `S`, `B` ও `M` — স্পেস দিয়ে আলাদা (`S`-এ স্পেস নেই)।",
    outputFormat: "শেষ হ্যাশ মানটা এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= |S| <= 100000`\n`1 <= B <= 10^9`\n`1 <= M <= 10^9`\n`S` শুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nRabin-Karp-এর হ্যাশ আসলে একটা সংখ্যা: স্ট্রিংটাকে `B` ভিত্তির একটা সংখ্যা মনে করো, প্রতিটি অক্ষরের ASCII মান এক একটা অঙ্ক। বাঁ থেকে প্রতিটি অক্ষরে `h = (h * B + ord(ch)) % M` চালালে শেষে যে মান থাকে সেটাই হ্যাশ। প্রতি ধাপে মডিউল নিলে মান `M^2`-এর বেশি হয় না, তাই বড় শব্দেও হিসাব হালকা থাকে। পরে এক ধাপে পুরোনো অক্ষর বাদ দিয়ে নতুন অক্ষর যোগ করলেই স্লাইডিং আপডেট পাওয়া যায় — Rabin-Karp ম্যাচিংয়ের ভিত্তি ওটাই; এই সমস্যায় শুধু একটাই পাস লাগবে।\n\n## ধাপে ধাপে\n\n1. `S`, `B`, `M` পড়ে নাও।\n2. `h = 0` ধরে অক্ষরগুলো বাঁ থেকে একটা একটা ঘুরো।\n3. প্রতিটি অক্ষরে `h = (h * B + ord(ch)) % M` করো।\n4. শেষে `h` প্রিন্ট করো।\n\n```python\nimport sys\ndata = sys.stdin.read().split()\ns = data[0]\nB = int(data[1])\nM = int(data[2])\nh = 0\nfor ch in s:\n    h = (h * B + ord(ch)) % M\nprint(h)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(|S|)`, স্পেস `O(1)` অতিরিক্ত। `|S| = 100000`-এও তাৎক্ষণিক।\n\n## সাধারণ ভুল\n\n- **প্রতি ধাপে মডিউল না নেওয়া:** শেষে একবার নিলে এখানে হয়তো মান ঠিক আসবে, কিন্তু স্লাইডিং আপডেটে বিয়োগ করতে গেলে নেগেটিভ মান জন্মায় — অভ্যাসটা এখানেই গড়ে নাও।\n- **`ord(ch)`-এর জায়গায় সরাসরি `ch` যোগ করা:** স্ট্রিং আর সংখ্যা মেশানোর কারণে প্রোগ্রাম থেমে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "Hashing"],
    tests: [
      {
        input: "abc 2 1000000007\n",
        expectedOutput: "683\n",
        isSample: true,
      },
      { input: "a 5 97\n", expectedOutput: "0\n", isSample: true },
      { input: "aaa 3 100\n", expectedOutput: "61\n", isSample: false },
      {
        input: "campus 7 1000000007\n",
        expectedOutput: "1940599\n",
        isSample: false,
      },
      {
        input: "code 131 998244353\n",
        expectedOutput: "224479081\n",
        isSample: false,
      },
      { input: "ab 1 50\n", expectedOutput: "45\n", isSample: false },
      {
        input: `${"z".repeat(100000)} 131 999999937\n`,
        expectedOutput: "108660539\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = sys.stdin.read().split()\ns = data[0]\nB = int(data[1])\nM = int(data[2])\nh = 0\nfor ch in s:\n    h = (h * B + ord(ch)) % M\nprint(h)\n",
  },
  {
    slug: "learn-m7-string-matching-m2",
    title: "One Mistake Allowed",
    statement:
      "লজ স্ক্যানারে টাইপো থাকতেই পারে — এই ভেবে তানভির প্যাটার্ন ম্যাচিং ঢিলা করেছিলেন। টেক্সটের যেসব জায়গায় প্যাটার্নটা হুবহু মিলে তার সাথে সে এমন জায়গাগুলোও ধরতে চান যেখানে **ঠিক একটা** অক্ষর ভিন্ন হলেও বাকি সব অক্ষর মিলে যায়।\n\nটেক্সট `T` আর প্যাটার্ন `P` দেওয়া থাকবে; যেসব শুরু-পজিশন থেকে প্যাটার্নটা মিলে বা একটার বেশি নয় ভুল নিয়ে মিলে, সেই শুরু-পজিশনগুলোর সংখ্যা গুনে প্রিন্ট করো। মিলগুলো একে অপরের উপর পড়তে পারে।\n\nউদাহরণ: `T = aabb`, `P = aab` — প্রথম শুরুতে পুরো মিল, দ্বিতীয় শুরুতে (`abb` বনাম `aab`) ঠিক একটা অক্ষর ভিন্ন; তাই উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `T`, দ্বিতীয় লাইনে `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat: "শর্ত পূরণ করা শুরু-পজিশনের সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= |P| <= |T| <= 200000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nপ্রতিটি শুরু-পজিশন আলাদা করে মিলিয়ে দেখলে সময় `O(|T| * |P|)` — এই সীমায় অকল্পনীয়। বদলে দুই দিক থেকে Z-algorithm চালাও। `P#T`-এর Z-array থেকে প্রতিটি পজিশন `i`-এ `pre[i]` পাওয়া যায়: `T[i...]` আর `P`-এর সাধারণ প্রিফিক্স কত লম্বা। উল্টো দিকে `rev(P)#rev(T)` চালিয়ে সাফিক্সের হিসাব মেলে: `suf[j]` মানে `T`-এর `n-1-j` পজিশনে শেষ হওয়া অংশ আর `P`-এর সাধারণ সাফিক্স কত লম্বা। এখন `i` থেকে শুরু হওয়া জানালায় (`T[i..i+m-1]`) শুরুতে `pre[i]` টা অক্ষর মিলেছে, আর জানালার শেষ প্রান্ত `end = i + m - 1`-এ পেছন থেকে `suf[n-1-end]` টা মিলেছে। মাঝে সর্বোচ্চ একটা অক্ষর অমিল হলে মোট মিল `pre + suf >= m - 1` — এই শর্তটাই গুনে রাখো।\n\n## ধাপে ধাপে\n\n1. `|P| > |T|` হলে উত্তর `0`।\n2. `S1 = P + '#' + T` বানিয়ে Z-array নাও; `pre[i] = z1[m + 1 + i]`।\n3. `S2 = rev(P) + '#' + rev(T)` বানিয়ে Z-array নাও; জানালার শেষ `end`-এর জন্য পেছনের মিল `suf[n - 1 - end]`।\n4. প্রতিটি শুরু `i`-এ `pre[i] + suf[n - 1 - (i + m - 1)] >= m - 1` হলে কাউন্টার বাড়াও।\n5. কাউন্টার প্রিন্ট করো।\n\n```python\nimport sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    def z_func(s):\n        z = [0] * len(s)\n        l = r = 0\n        for i in range(1, len(s)):\n            if i < r:\n                z[i] = min(r - i, z[i - l])\n            while i + z[i] < len(s) and s[z[i]] == s[i + z[i]]:\n                z[i] += 1\n            if i + z[i] > r:\n                l, r = i, i + z[i]\n        return z\n    pre = z_func(P + '#' + T)[m + 1:]\n    suf = z_func(P[::-1] + '#' + T[::-1])[m + 1:]\n    cnt = 0\n    for i in range(n - m + 1):\n        if pre[i] + suf[n - 1 - (i + m - 1)] >= m - 1:\n            cnt += 1\n    print(cnt)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(|T| + |P|)` — দুইটা Z-array, প্রতিটি এক পাসে। স্পেস `O(|T| + |P|)`।\n\n## সাধারণ ভুল\n\n- **পুরো মিলের জন্য আলাদা শর্ত লেখা:** `pre + suf >= m - 1` শর্ত নিজেই পুরো মিল ঢেকে দেয় (`pre = m` হলে শর্ত সত্যই); আলাদা কেস বাড়ালে ভুল ঢোকার সুযোগ বাড়ে।\n- **উল্টো দিকের ইনডেক্স ম্যাপিং ভুল করা:** `rev(T)`-তে পজিশন `j` মানে আসল `T`-তে পজিশন `n - 1 - j`; এই জোড়া না মেলালে শেষ প্রান্তের মান ভুল জায়গা থেকে আসে।\n- **সেপারেটর ছাড়া জোড়া লাগানো:** `#` ছাড়া Z-array-তে `P`-এর বর্ডার টেক্সটে ঢুকে মান বড় দেখায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "Z Algorithm"],
    tests: [
      { input: "aabb\naab\n", expectedOutput: "2\n", isSample: true },
      { input: "aaaa\naa\n", expectedOutput: "3\n", isSample: true },
      { input: "abcd\nxx\n", expectedOutput: "0\n", isSample: false },
      { input: "abab\nba\n", expectedOutput: "1\n", isSample: false },
      { input: "ab\nabc\n", expectedOutput: "0\n", isSample: false },
      { input: "abcba\na\n", expectedOutput: "5\n", isSample: false },
      { input: "banana\nana\n", expectedOutput: "2\n", isSample: false },
      {
        input: `${"ab".repeat(100000)}\n${"ab".repeat(50000)}\n`,
        expectedOutput: "50001\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    def z_func(s):\n        z = [0] * len(s)\n        l = r = 0\n        for i in range(1, len(s)):\n            if i < r:\n                z[i] = min(r - i, z[i - l])\n            while i + z[i] < len(s) and s[z[i]] == s[i + z[i]]:\n                z[i] += 1\n            if i + z[i] > r:\n                l, r = i, i + z[i]\n        return z\n    pre = z_func(P + '#' + T)[m + 1:]\n    suf = z_func(P[::-1] + '#' + T[::-1])[m + 1:]\n    cnt = 0\n    for i in range(n - m + 1):\n        if pre[i] + suf[n - 1 - (i + m - 1)] >= m - 1:\n            cnt += 1\n    print(cnt)\n",
  },
  {
    slug: "learn-m7-string-matching-m3",
    title: "Circular Match",
    statement:
      "ফেস্টিভালের গোল ব্যানারে স্লোগানটা বৃত্তাকারে লেখা — শেষ অক্ষরের পর আবার শুরুর অক্ষর আসে। রফি জানতে চাইলেন এই বৃত্তাকার লেখায় প্যাটার্ন `P` কয়টা জায়গায় মেলে — মিল ব্যানারের শেষ হয়ে শুরুতে মোড়ানোও হতে পারে।\n\nটেক্সট `T`-কে বৃত্তাকার ধরো: যেকোনো শুরু-পজিশন থেকে ঘড়ির কাঁটার দিকে `m` অক্ষর নিলে যে অংশ দাঁড়ায়, সেটা `P`-এর সমান হলে একটা মিল। মিলগুলো একে অপরের উপর পড়তে পারে।\n\nউদাহরণ: বৃত্তাকার `abab`-এ `ab` মেলে পজিশন `1` আর `3` থেকে → উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `T`, দ্বিতীয় লাইনে `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat: "বৃত্তাকার মিলের সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= |P|, |T| <= 100000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nবৃত্তাকার টেক্সটে শুরু-পজিশন `i` থেকে `m` অক্ষর নিলে যা পাওয়া যায় তা ঠিক `T + T`-এর পজিশন `i` থেকে `m` অক্ষরের অংশ — মোড়ানো অংশটা দ্বিতীয় কপি থেকে এসে যায়। তাই `T`-কে দুইবার জোড়া লাগিয়ে সেখানে KMP চালাও, আর যেসব মিলের শুরু `i < n` সেগুলোই বৃত্তাকার মিল। শুরু `i >= n` মিলগুলো দ্বিতীয় কপির ভেতরের মিল — প্রতিটি আসলে প্রথম কপির কোনো না কোনো মিলের পুনরাবৃত্তি, তাই গুনতে হয় না। `m > n` হলে বৃত্তেই `m` অক্ষরের জায়গা নেই, উত্তর `0`।\n\n## ধাপে ধাপে\n\n1. `m > n` হলে `0` প্রিন্ট করে থামো।\n2. `S = T + T` বানাও।\n3. `P`-এর prefix function নিয়ে `S`-এর উপর KMP চালাও।\n4. মিল পাওয়ার শুরু `i < n` হলে কাউন্টার বাড়াও; `i >= n` হলে বাদ দাও।\n5. কাউন্টার প্রিন্ট করো।\n\n```python\nimport sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    S = T + T\n    pi = [0] * m\n    for i in range(1, m):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    j = 0\n    cnt = 0\n    for i, ch in enumerate(S):\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == m:\n            if i - m + 1 < n:\n                cnt += 1\n            j = pi[j - 1]\n    print(cnt)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(|T| + |P|)`, স্পেস `O(|T| + |P|)` — দ্বিগুণ টেক্সট স্পেস বাড়ায়, সময় বাড়ায় না।\n\n## সাধারণ ভুল\n\n- **সব মিল গুনে ফেলা:** `T + T`-তে শুরু `i >= n` মিলগুলো প্রথম কপির মিলেরই পুনরাবৃত্তি — গুনলে উত্তর দ্বিগুণ হয়ে যায়।\n- **`m > n` কেস ভুলে যাওয়া:** বৃত্তে টেক্সটের চেয়ে লম্বা প্যাটার্ন বসে না; `T + T`-তে মিল খুঁজলেও সেই জানালা আসল বৃত্তের বাইরের অক্ষর ধরে।\n- **তিন কপি জোড়া লাগানো:** `m <= n` থাকায় দুই কপিতেই সব বৈধ জানালা আঁটে (`i + m <= n - 1 + n`); বেশি কপিতে বাদ-দেওয়া মিল বাড়ে, উত্তর একই থাকে — শুধু অযথা কাজ।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "abab\nab\n", expectedOutput: "2\n", isSample: true },
      { input: "aaa\naa\n", expectedOutput: "3\n", isSample: true },
      { input: "abc\ncab\n", expectedOutput: "1\n", isSample: false },
      { input: "ab\naba\n", expectedOutput: "0\n", isSample: false },
      { input: "abc\nabcabc\n", expectedOutput: "0\n", isSample: false },
      { input: "a\na\n", expectedOutput: "1\n", isSample: false },
      { input: "abcabc\ncab\n", expectedOutput: "2\n", isSample: false },
      {
        input: `${"ab".repeat(50000)}\n${"ab".repeat(25000)}\n`,
        expectedOutput: "50000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    S = T + T\n    pi = [0] * m\n    for i in range(1, m):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    j = 0\n    cnt = 0\n    for i, ch in enumerate(S):\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == m:\n            if i - m + 1 < n:\n                cnt += 1\n            j = pi[j - 1]\n    print(cnt)\n",
  },
  {
    slug: "learn-m7-string-matching-h2",
    title: "Count Every Prefix",
    statement:
      "নুসরাত একটা লম্বা লেকচার নোটের ভেতরে কী-ওয়ার্ড প্যাটার্ন `P`-এর পুরো ছবি বের করছিলেন: প্যাটার্নটা নিজে কয়বার আছে তার সাথে তার **প্রতিটি প্রিফিক্স** আলাদাভাবে কয়বার এসেছে সেটাও জানা দরকার।\n\nটেক্সট `T` আর প্যাটার্ন `P` দেওয়া থাকবে। প্রতিটি `k = 1, 2, ..., m`-এর জন্য (`m = |P|`) `P`-এর প্রথম `k` অক্ষরের অংশটা `T`-এর ভেতরে পাশাপাশি (একটানা) কয়বার এসেছে সেটা বের করো। `m`টি সংখ্যা একই লাইনে স্পেস দিয়ে প্রিন্ট করো।\n\nউদাহরণ: `T = ababab`, `P = aba` — প্রিফিক্স `a` ৩ বার, `ab` ৩ বার, `aba` ২ বার → উত্তর `3 3 2`।",
    inputFormat:
      "প্রথম লাইনে `T`, দ্বিতীয় লাইনে `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat:
      "`m`টি সংখ্যা — প্রতিটি প্রিফিক্সের মিল সংখ্যা — একই লাইনে স্পেস দিয়ে।",
    constraints: "`1 <= |P|, |T| <= 200000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nKMP চালানোর সময় প্রতিটি অক্ষর পড়ে যে অবস্থায় পৌঁছায় সেটা `j` — মানে `T`-এর ওই পজিশনে শেষ হওয়া `P`-এর প্রিফিক্স ঠিক `j` টা অক্ষর লম্বা। রাজ্য `j`-এ পৌঁছানোর সংখ্যা `cnt[j]` গুনে রাখো। কিন্তু রাজ্য `j`-এ শেষ হলে তার ছোট প্রিফিক্সগুলোও তো ওই পজিশনেই শেষ হয় — কোনগুলো? `pi`-এর শৃঙ্খলা বলে দেয়: `j`-এর বর্ডার `pi[j-1]`, তার বর্ডার `pi[pi[j-1]-1]`, এভাবে নেমে যাওয়া প্রতিটি মান ওই পজিশনে শেষ হওয়া এক একটা প্রিফিক্স। তাই প্রতিটি `k`-এর উত্তর = `k` এবং `k`-এর শৃঙ্খলায় থাকা সব রাজ্যের `cnt`-এর যোগফল। বড় `k` থেকে ছোটর দিকে একবার পাসে `cnt[pi[k-1]] += cnt[k]` করলেই সব শৃঙ্খলার যোগ ঢালাই হয়ে যায় — কারণ `pi[k-1] < k`, তাই কোনো `k`-এর যোগ শেষ করার আগেই তার উপরের সবার যোগ তাতে এসে পড়েছে।\n\n## ধাপে ধাপে\n\n1. `P`-এর prefix function বানাও।\n2. `T`-এর উপর KMP চালাও; প্রতিটি অক্ষরের পর রাজ্য `j`-এ `cnt[j] += 1` করো, আর `j == m` হলে `j = pi[m-1]` করে নামাও।\n3. `k = m` থেকে `1` পর্যন্ত উল্টো ক্রমে `cnt[pi[k-1]] += cnt[k]` চালাও।\n4. `cnt[1]` থেকে `cnt[m]` স্পেস দিয়ে প্রিন্ট করো।\n\n```python\nimport sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nn, m = len(T), len(P)\npi = [0] * m\nfor i in range(1, m):\n    j = pi[i - 1]\n    while j > 0 and P[i] != P[j]:\n        j = pi[j - 1]\n    if P[i] == P[j]:\n        j += 1\n    pi[i] = j\ncnt = [0] * (m + 1)\nj = 0\nfor ch in T:\n    while j > 0 and ch != P[j]:\n        j = pi[j - 1]\n    if ch == P[j]:\n        j += 1\n    cnt[j] += 1\n    if j == m:\n        j = pi[j - 1]\nfor k in range(m, 0, -1):\n    cnt[pi[k - 1]] += cnt[k]\nprint(' '.join(map(str, cnt[1:])))\n```\n\n## কমপ্লেক্সিটি\n\nKMP `O(|T| + |P|)`, শৃঙ্খলা-ঢালাই `O(m)` — মোট `O(|T| + |P|)`, স্পেস `O(m)`।\n\n## সাধারণ ভুল\n\n- **মিল পাওয়ার পর `j` নামাতে ভুলে যাওয়া:** `j == m` থাকলে পরের অক্ষরে `P[j]` ইনডেক্স সীমা ছাড়িয়ে যায় — `j = pi[m-1]` না করলে প্রোগ্রাম থেমে যায়।\n- **প্রতিটি পজিশনে পুরো শৃঙ্খলা ঘুরে যোগ করা:** তাহলে সময় `O(|T| * m)` হয়ে যায়; উল্টো ক্রমে একবার ঢালাইই একই কাজ `O(m)`-তে করে।\n- **`|P| > |T|`-এর প্রিফিক্স নিয়ে ভাবনা:** এমন প্রিফিক্স কখনো মিলতে পারে না — রাজ্য সেখানে কখনো পৌঁছায় না, `cnt` শূন্যই থাকে, আলাদা কিছু করা লাগে না।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "ababab\naba\n", expectedOutput: "3 3 2\n", isSample: true },
      { input: "abcabc\nabc\n", expectedOutput: "2 2 2\n", isSample: true },
      { input: "aaa\na\n", expectedOutput: "3\n", isSample: false },
      { input: "ba\nab\n", expectedOutput: "1 0\n", isSample: false },
      { input: "ab\nabcd\n", expectedOutput: "1 1 0 0\n", isSample: false },
      {
        input: `${"a".repeat(1000)}\n${"a".repeat(10)}\n`,
        expectedOutput: spaceOutput(Array.from({ length: 10 }, (_, i) => 1000 - i)),
        isSample: false,
      },
      {
        input: `${"ab".repeat(100000)}\n${"ab".repeat(500)}\n`,
        expectedOutput: spaceOutput(
          Array.from({ length: 1000 }, (_, i) => {
            const k = i + 1;
            return k % 2 === 0 ? 100001 - k / 2 : 100000 - (k - 1) / 2;
          }),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = sys.stdin.read().split()\nT, P = data[0], data[1]\nn, m = len(T), len(P)\npi = [0] * m\nfor i in range(1, m):\n    j = pi[i - 1]\n    while j > 0 and P[i] != P[j]:\n        j = pi[j - 1]\n    if P[i] == P[j]:\n        j += 1\n    pi[i] = j\ncnt = [0] * (m + 1)\nj = 0\nfor ch in T:\n    while j > 0 and ch != P[j]:\n        j = pi[j - 1]\n    if ch == P[j]:\n        j += 1\n    cnt[j] += 1\n    if j == m:\n        j = pi[j - 1]\nfor k in range(m, 0, -1):\n    cnt[pi[k - 1]] += cnt[k]\nprint(' '.join(map(str, cnt[1:])))\n",
  },
];
