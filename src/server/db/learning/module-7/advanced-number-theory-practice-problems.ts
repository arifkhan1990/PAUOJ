import type { SeedProblem } from "../../seed-problems";

export const ADVANCED_NUMBER_THEORY_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-advanced-number-theory-e2",
    title: "Modular Inverse",
    statement:
      "ক্রিপ্টো ল্যাবে গুণের উল্টো কাজ লাগে: মডিউল `p`-এর ঘরে `a`-কে কোন সংখ্যা দিয়ে গুণ করলে ফল `1` হবে? সেই সংখ্যাটাই `a`-এর modular inverse। `p` যদি প্রাইম হয়, Fermat-এর উপপাদ্য বলে `a^(p-2) mod p`-ই সেই বিপরীত।\n\n`a` আর প্রাইম `p` দেওয়া থাকবে (`a < p`); `a`-এর বিপরীত সংখ্যাটা প্রিন্ট করো।\n\nউদাহরণ: `a = 3`, `p = 7` → `3 * 5 = 15`, আর `15 mod 7 = 1`, তাই উত্তর `5`।",
    inputFormat: "এক লাইনে `a` ও `p`।",
    outputFormat: "`a`-এর modular inverse এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= a < p <= 10^9`\n`p` একটা প্রাইম।",
    editorial:
      "## ধারণা\n\nFermat-এর ছোট উপপাদ্য: `p` প্রাইম আর `a` তার গুণিতক না হলে `a^(p-1) ≡ 1 (mod p)`। দুই পাশে `a^-1` গুণ করলে দাঁড়ায় `a^(p-2) ≡ a^-1 (mod p)`। তাই উত্তরটা আসলে একটা ঘাত-মডিউল হিসাব — binary exponentiation-এ `O(log p)` ধাপে হয়ে যায়, ঠিক যে কৌশল নিয়ে ঘাত-মডিউল সমস্যায় কাজ হয়েছে। প্রতি ধাপে মডিউল নিলে মান কখনো `p^2`-এর বেশি হয় না।\n\n## ধাপে ধাপে\n\n1. `a` ও `p` পড়ে `e = p - 2` ধরো।\n2. `result = 1`, `base = a % p` দিয়ে binary exponentiation চালাও।\n3. `e`-এর সেট বিটে `result = result * base % p`।\n4. প্রতি ধাপে `base = base * base % p` করে `e >>= 1`।\n5. `result` প্রিন্ট করো।\n\n```python\nimport sys\na, p = map(int, sys.stdin.read().split())\nresult = 1 % p\nbase = a % p\ne = p - 2\nwhile e > 0:\n    if e & 1:\n        result = result * base % p\n    base = base * base % p\n    e >>= 1\nprint(result)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(log p)`, স্পেস `O(1)`। `p = 10^9`-এ মাত্র ৩০ ধাপ।\n\n## সাধারণ ভুল\n\n- **`a = 1`-এ আলাদা কিছু ভাবা:** `1^(p-2) = 1`, সূত্রই যথেষ্ট।\n- **`p` প্রাইম না হলে এই সূত্র খাটানো:** তখন `a^(p-2)` বিপরীত দেবে না; Euler-এর totient দিয়ে `a^(phi(p)-1)` লাগবে — এই সমস্যায় `p` সবসময় প্রাইম।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Modular Arithmetic", "Binary Exponentiation"],
    tests: [
      { input: "3 7\n", expectedOutput: "5\n", isSample: true },
      { input: "4 5\n", expectedOutput: "4\n", isSample: true },
      { input: "1 999999937\n", expectedOutput: "1\n", isSample: false },
      {
        input: "2 1000000007\n",
        expectedOutput: "500000004\n",
        isSample: false,
      },
      {
        input: "999999936 999999937\n",
        expectedOutput: "999999936\n",
        isSample: false,
      },
      {
        input: "123456789 1000000007\n",
        expectedOutput: "18633540\n",
        isSample: false,
      },
      { input: "6 97\n", expectedOutput: "81\n", isSample: false },
    ],
    referencePython:
      "import sys\na, p = map(int, sys.stdin.read().split())\nresult = 1 % p\nbase = a % p\ne = p - 2\nwhile e > 0:\n    if e & 1:\n        result = result * base % p\n    base = base * base % p\n    e >>= 1\nprint(result)\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-e3",
    title: "Divisor Sum",
    statement:
      "ছুটির দিনে সাদিয়া সংখ্যা নিয়ে একটা টেবিল বানাচ্ছিলেন: কোনো সংখ্যার সব ভাজক যোগ করলে কত হয়। ছোট সংখ্যায় হাতে হিসাব চলে, কিন্তু বড় সংখ্যায় একটা একটা ভাজক খুঁজতে বসা চলবে না — মৌলিক ভাঙন থেকে একবারে বের করতে হবে।\n\n`n` দেওয়া থাকবে; তার সব ধনাত্মক ভাজকের যোগফল `σ(n)` প্রিন্ট করো (ভাজক মানে `n`-কে নিঃশেষে ভাগ করে এমন সংখ্যা, `n` নিজেসহ)।\n\nউদাহরণ: `n = 6` → ভাজক `1, 2, 3, 6`, যোগফল `12`।",
    inputFormat: "এক লাইনে একটা পূর্ণসংখ্যা `n`।",
    outputFormat: "`σ(n)` এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 10^12`",
    editorial:
      "## ধারণা\n\nভাজক একটা একটা খুঁজে যোগ করার বদলে মৌলিক ভাঙন ব্যবহার করো। `n = p1^e1 * p2^e2 * ...` হলে ভাজকের যোগফল `σ(n) = (1 + p1 + ... + p1^e1) * (1 + p2 + ... + p2^e2) * ...` — প্রতিটি মৌলিক ঘাত থেকে একটা করে ভাজক বাছলে প্রতিটি ভাজক ঠিক একবারই তৈরি হয়। প্রতিটি ধারার যোগফল সরাসরি সূত্রে: `1 + p + ... + p^e = (p^(e+1) - 1) / (p - 1)`। `sqrt(n)` পর্যন্ত ভাঙন চালালেই সব মৌলিক পাওয়া যায় — ঠিক যেভাবে totient-এর ভাজক বের করা হয়।\n\n## ধাপে ধাপে\n\n1. `x = n`, `result = 1` ধরো।\n2. `d = 2` থেকে `d * d <= x` পর্যন্ত ঘুরো (`2`-এর পর শুধু বিজোড়)।\n3. `x % d == 0` হলে ঘাত `e` গুনো, `x` থেকে `d`-এর সব ঘাত বাদ দাও, আর `result *= (d^(e+1) - 1) // (d - 1)` করো।\n4. শেষে `x > 1` হলে `x` নিজেই একটা মৌলিক ভাজক — `result *= (x^2 - 1) // (x - 1)` (মানে `1 + x`)।\n5. `result` প্রিন্ট করো।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nresult = 1\nx = n\nd = 2\nwhile d * d <= x:\n    if x % d == 0:\n        e = 0\n        while x % d == 0:\n            x //= d\n            e += 1\n        result *= (d ** (e + 1) - 1) // (d - 1)\n    d += 1 if d == 2 else 2\nif x > 1:\n    result *= (x * x - 1) // (x - 1)\nprint(result)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(sqrt(n))` — `n = 10^12`-এ প্রায় `10^6` ধাপ। স্পেস `O(1)`।\n\n## সাধারণ ভুল\n\n- **ভাজক একটা একটা খুঁজে যোগ করা:** বড় `n`-এ অসম্ভব ধীর; ভাঙন থেকে গুণফল বের করো।\n- **শেষে অবশিষ্ট `x > 1` বাদ দেওয়া:** বড় মৌলিক ভাজকটা তখন হারিয়ে যায় — `n = 2 * বড় প্রাইম` ধরনের সংখ্যায় উত্তর অর্ধেকের কাছাকাছিও আসবে না।\n- **ঘাত গুনতে গিয়ে `e`-এর জায়গায় ভুল মান বসানো:** প্রতিটি মৌলিক পুরোপুরি বাদ দিয়ে তারপর সূত্রে বসাও।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Prime Factorization"],
    tests: [
      { input: "6\n", expectedOutput: "12\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "12\n", expectedOutput: "28\n", isSample: false },
      { input: "7\n", expectedOutput: "8\n", isSample: false },
      {
        input: "1000000007\n",
        expectedOutput: "1000000008\n",
        isSample: false,
      },
      {
        input: "1000000000000\n",
        expectedOutput: "2499694822171\n",
        isSample: false,
      },
      {
        input: "999999999989\n",
        expectedOutput: "999999999990\n",
        isSample: false,
      },
      {
        input: "999999999999\n",
        expectedOutput: "2063316971520\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nresult = 1\nx = n\nd = 2\nwhile d * d <= x:\n    if x % d == 0:\n        e = 0\n        while x % d == 0:\n            x //= d\n            e += 1\n        result *= (d ** (e + 1) - 1) // (d - 1)\n    d += 1 if d == 2 else 2\nif x > 1:\n    result *= (x * x - 1) // (x - 1)\nprint(result)\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-m2",
    title: "Huge Power",
    statement:
      "ল্যাবের হ্যাশ চেইনে `a`-এর `n` ঘাত দরকার, কিন্তু `n` এত বড় যে `10^18` ধাপ ঘুরে হিসাব করা অসম্ভব। মডিউল `m` ছোট, আর `a` আর `m`-এর gcd নিয়ে কোনো শর্ত নেই।\n\n`a^n mod m` প্রিন্ট করো। ছোট `n`-এ সরাসরি ঘাত করা যায়; বড় `n`-এ Euler-এর totient দিয়ে ঘাত ছোট করে নিতে হবে।\n\nউদাহরণ: `a = 2`, `n = 10`, `m = 1000` → `2^10 = 1024`, `1024 mod 1000 = 24`।",
    inputFormat: "এক লাইনে `a`, `n` ও `m`।",
    outputFormat: "`a^n mod m` এক লাইনে প্রিন্ট করো।",
    constraints:
      "`0 <= a <= 10^9`\n`1 <= n <= 10^18`\n`1 <= m <= 10^9`",
    editorial:
      "## ধারণা\n\n`a` আর `m` সহগুণ হলে Euler-এর উপপাদ্য বলে `a^phi(m) ≡ 1 (mod m)` — ঘাতের উপরে `phi(m)`-এর একটা চক্র বসে যায়। সহগুণ না হলেও একটা শক্তিশালী সাধারণ রূপ খাটে: `n` যথেষ্ট বড় হলে (`n >= 60`, যখন `m <= 10^9`) `a^n ≡ a^(phi(m) + (n mod phi(m))) (mod m)` — যেকোনো `a`-এর জন্য। তাই পথ দুইটা: `n` ছোট হলে সরাসরি binary exponentiation; `n` বড় হলে `phi(m)` বের করে (মৌলিক ভাঙনে, totient সমস্যার মতোই) ঘাত `phi(m) + (n mod phi(m))`-এ নামিয়ে হিসাব করো।\n\n## ধাপে ধাপে\n\n1. `m = 1` হলে উত্তর `0`।\n2. `n < 100` হলে `pow(a, n, m)` সরাসরি বের করো।\n3. নাহলে `phi(m)` বের করো — `sqrt(m)` পর্যন্ত ভাঙন, প্রতিটি ভাজকে `result -= result // d`।\n4. ঘাত ধরো `e = phi(m) + (n mod phi(m))`; উত্তর `pow(a, e, m)`।\n\n```python\nimport sys\na, n, m = map(int, sys.stdin.read().split())\ndef phi(x):\n    result = xx = x\n    d = 2\n    while d * d <= xx:\n        if xx % d == 0:\n            while xx % d == 0:\n                xx //= d\n            result -= result // d\n        d += 1 if d == 2 else 2\n    if xx > 1:\n        result -= result // xx\n    return result\nif m == 1:\n    print(0)\nelif n < 100:\n    print(pow(a, n, m))\nelse:\n    ph = phi(m)\n    print(pow(a, n % ph + ph, m))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(sqrt(m) + log n)`, স্পেস `O(1)`। `m = 10^9`-এ ভাঙনে প্রায় `3 * 10^4` ধাপ।\n\n## সাধারণ ভুল\n\n- **সব কেসে `n mod phi(m)` ব্যবহার করা:** সহগুণ না হলে সেটা ভুল দেয় — `6^n mod 8`-এ (`n >= 3`) সঠিক উত্তর `0`, কিন্তু খাটো ঘাতে সেটা আসে না; `phi(m)` যোগ করাই নিয়মটা শুদ্ধ করে।\n- **ছোট `n`-এও totient-এর ঘাত বসানো:** `n = 1`-এ `a^(phi(m) + 1) mod m`-এর মান `a mod m`-এর সমান নাও হতে পারে; শর্ত বড় `n`-এর, ছোট `n` সরাসরি করো।\n- **`m = 1` ভুলে যাওয়া:** যেকোনো সংখ্যার ভাগশেষ শূন্য, তাই উত্তর `0`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Modular Arithmetic", "Euler Totient"],
    tests: [
      { input: "2 10 1000\n", expectedOutput: "24\n", isSample: true },
      { input: "3 1 5\n", expectedOutput: "3\n", isSample: true },
      {
        input: "6 1000000000000000000 8\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      { input: "2 59 1000000000\n", expectedOutput: "303423488\n", isSample: false },
      { input: "2 60 1000000000\n", expectedOutput: "606846976\n", isSample: false },
      {
        input: "123456789 987654321987654321 999999937\n",
        expectedOutput: "393010071\n",
        isSample: false,
      },
      { input: "0 5 7\n", expectedOutput: "0\n", isSample: false },
      {
        input: "1 1000000000000000000 1\n",
        expectedOutput: "0\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\na, n, m = map(int, sys.stdin.read().split())\ndef phi(x):\n    result = xx = x\n    d = 2\n    while d * d <= xx:\n        if xx % d == 0:\n            while xx % d == 0:\n                xx //= d\n            result -= result // d\n        d += 1 if d == 2 else 2\n    if xx > 1:\n        result -= result // xx\n    return result\nif m == 1:\n    print(0)\nelif n < 100:\n    print(pow(a, n, m))\nelse:\n    ph = phi(m)\n    print(pow(a, n % ph + ph, m))\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-m3",
    title: "Fence Painting",
    statement:
      "হোস্টেলের সামনে `n`-খানা তক্তার বেড়া নুসরাতের দল রঙ করবে। রঙ আছে `k`টা, প্রতিটি তক্তায় ঠিক একটা রঙ। নিয়ম একটাই: পাশাপাশি **তিনটা** তক্তায় একই রঙ হতে পারবে না (দুইটা পাশাপাশি একই রঙ চলবে)।\n\nএমনভাবে পুরো বেড়া রঙ করার উপায় কয়টি? সংখ্যাটা বিশাল হতে পারে, তাই উত্তর `M`-এর মডিউলে প্রিন্ট করো।\n\nউদাহরণ: `n = 3`, `k = 2` → মোট `2^3 = 8` সাজেশন থেকে `aaa` আর `bbb` বাদ — উত্তর `6`।",
    inputFormat: "এক লাইনে `n`, `k` ও `M`।",
    outputFormat: "রঙ করার উপায়ের সংখ্যা `M`-এর মডিউলে এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 10^18`\n`1 <= k <= 10^9`\n`1 <= M <= 10^9`",
    editorial:
      "## ধারণা\n\nগুনো শেষ তক্তাটা ধরে: হয় সে আগের তক্তার রঙ থেকে ভিন্ন, নাহল শেষ দুই তক্তা একই রঙে। প্রথম কেসে আগের `n-1` তক্তা যেকোনো বৈধ সাজেশন হতে পারে, শেষটার রঙের `k - 1`টা বিকল্প আছে। দ্বিতীয় কেসে শেষ দুই তক্তা একই রঙ `c`, আর `n-2` নং তক্তার রঙ `c`-র চেয়ে ভিন্ন হতে বাধ্য — প্রথম `n-2` তক্তার যেকোনো বৈধ সাজেশনের পর `c` বাছার `k - 1`টা রাস্তা। দুই কেস যোগ করলেই ধারা: `f(n) = (k - 1) * (f(n - 1) + f(n - 2))`, ভিত্তি `f(1) = k`, `f(2) = k * k`। ধারাটা linear, তাই `[f(n), f(n-1)] = A * [f(n-1), f(n-2)]` যেখানে `A = [[k-1, k-1], [1, 0]]` — আর `A^(n-2)` binary exponentiation-এ `O(log n)` ধাপে।\n\n## ধাপে ধাপে\n\n1. `M = 1` হলে উত্তর `0`; নাহলে `k %= M` নাও।\n2. `n = 1` → উত্তর `k`; `n = 2` → উত্তর `k * k % M`।\n3. `A = [[k-1, k-1], [1, 0]]` (সব মান `M`-এ) বানাও।\n4. `A^(n-2)` binary exponentiation-এ বের করো।\n5. `A^(n-2)`-এর প্রথম সারি দিয়ে `[f(2), f(1)]` গুণ করে `f(n)` প্রিন্ট করো।\n\n```python\nimport sys\nn, k, M = map(int, sys.stdin.read().split())\nif M == 1:\n    print(0)\nelse:\n    k %= M\n    if n == 1:\n        print(k % M)\n    else:\n        f2 = k * k % M\n        f1 = k % M\n        a = (k - 1) % M\n        def mul(X, Y):\n            return [[(X[0][0] * Y[0][0] + X[0][1] * Y[1][0]) % M,\n                     (X[0][0] * Y[0][1] + X[0][1] * Y[1][1]) % M],\n                    [(X[1][0] * Y[0][0] + X[1][1] * Y[1][0]) % M,\n                     (X[1][0] * Y[0][1] + X[1][1] * Y[1][1]) % M]]\n        A = [[a, a], [1 % M, 0]]\n        R = [[1 % M, 0], [0, 1 % M]]\n        e = n - 2\n        while e:\n            if e & 1:\n                R = mul(R, A)\n            A = mul(A, A)\n            e >>= 1\n        print((R[0][0] * f2 + R[0][1] * f1) % M)\n```\n\n## কমপ্লেক্সিটি\n\n`O(log n)` ধাপ, প্রতি ধাপে একটা ২x২ ম্যাট্রিক্স গুণ — মোট ৮টা গুণ-মডিউল প্রতি ধাপে। স্পেস `O(1)`।\n\n## সাধারণ ভুল\n\n- **`n = 2`-তে ধারার সূত্র চাপিয়ে দেওয়া:** `f(2) = k * k` (দুইটা একই রঙ বৈধ); সূত্র `n >= 3` থেকে চলে।\n- **`k % M = 0` হলে `(k - 1)` হিসাব:** `(k - 1) % M` তখন `M - 1` হবে — Python-এ `%` এটা ঠিক রাখে, অন্য ভাষায় নেগেটিভ হতে পারে, তাই সতর্ক হও।\n- **গুণের মাঝে মডিউল না নেওয়া:** `k` প্রায় `10^9` হলে `k * k` প্রায় `10^18` — ৩২-বিট পূর্ণসংখ্যায় ধরে রাখা যাবে না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Matrix Exponentiation", "Dynamic Programming"],
    tests: [
      { input: "3 2 1000\n", expectedOutput: "6\n", isSample: true },
      { input: "1 5 100\n", expectedOutput: "5\n", isSample: true },
      { input: "2 3 100\n", expectedOutput: "9\n", isSample: false },
      { input: "4 2 1000\n", expectedOutput: "10\n", isSample: false },
      {
        input: "10 2 1000000007\n",
        expectedOutput: "178\n",
        isSample: false,
      },
      {
        input: "1000000000000000000 7 1000000007\n",
        expectedOutput: "187250816\n",
        isSample: false,
      },
      {
        input: "5 1000000000 999999937\n",
        expectedOutput: "991694340\n",
        isSample: false,
      },
      { input: "2 1000000000 1\n", expectedOutput: "0\n", isSample: false },
    ],
    referencePython:
      "import sys\nn, k, M = map(int, sys.stdin.read().split())\nif M == 1:\n    print(0)\nelse:\n    k %= M\n    if n == 1:\n        print(k % M)\n    else:\n        f2 = k * k % M\n        f1 = k % M\n        a = (k - 1) % M\n        def mul(X, Y):\n            return [[(X[0][0] * Y[0][0] + X[0][1] * Y[1][0]) % M,\n                     (X[0][0] * Y[0][1] + X[0][1] * Y[1][1]) % M],\n                    [(X[1][0] * Y[0][0] + X[1][1] * Y[1][0]) % M,\n                     (X[1][0] * Y[0][1] + X[1][1] * Y[1][1]) % M]]\n        A = [[a, a], [1 % M, 0]]\n        R = [[1 % M, 0], [0, 1 % M]]\n        e = n - 2\n        while e:\n            if e & 1:\n                R = mul(R, A)\n            A = mul(A, A)\n            e >>= 1\n        print((R[0][0] * f2 + R[0][1] * f1) % M)\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-h2",
    title: "Power Cycle Length",
    statement:
      "রফি লক্ষা করলেন `a`-এর ঘাতগুলো মডিউল `m`-এ ঘুরে ফিরে একই মানে আসে — যেমন মডিউল `7`-এ `2`-এর ঘাত: `2, 4, 1, 2, 4, ...`। প্রশ্ন হলো কত ঘাত পরে প্রথমবার `1` ফিরে আসে — অর্থাৎ ক্ষুদ্রতম ধনাত্মক `x` যাতে `a^x ≡ 1 (mod m)`। `a` আর `m` সহগুণ করা নিশ্চিত।\n\n`a` ও `m` দেওয়া থাকবে; সেই ক্ষুদ্রতম `x` প্রিন্ট করো।\n\nউদাহরণ: `a = 2`, `m = 7` → `2^1 = 2`, `2^2 = 4`, `2^3 = 8 ≡ 1` → উত্তর `3`।",
    inputFormat: "এক লাইনে `a` ও `m`।",
    outputFormat: "ক্ষুদ্রতম ধনাত্মক `x` এক লাইনে প্রিন্ট করো।",
    constraints:
      "`2 <= m <= 10^9`\n`1 <= a < m`\n`gcd(a, m) = 1` (নিশ্চিত করা থাকে)",
    editorial:
      "## ধারণা\n\nEuler-এর উপপাদ্য বলে সহগুণ হলে `a^phi(m) ≡ 1 (mod m)` — তাই কাঙ্ক্ষিত `x` অবশ্যই `phi(m)`-এর কোনো ভাজক। কেন ভাজক? ধরো `phi(m) = q * x + r` যেখানে `0 < r < x`; তখন `a^r ≡ a^phi(m) * (a^x)^(-q) ≡ 1 (mod m)` আসত — কিন্তু `r < x` হওয়া `x`-এর ক্ষুদ্রতম হওয়ার সাথে সাংঘর্ষিক। তাই `r = 0`-ই একমাত্র সম্ভব। কাজেই পথ: `phi(m)` বের করো, তার সব ভাজক ছোট থেকে বড় সাজাও, প্রথম যেটাতে `pow(a, d, m) == 1` সেটাই উত্তর। ভাজক বের করতে `phi(m)`-এর মৌলিক ভাঙন লাগবে — `m < 10^9`-এ ভাজক সংখ্যা কখনোই দুই হাজার ছাড়ায় না।\n\n## ধাপে ধাপে\n\n1. `phi(m)` বের করো (`sqrt(m)` পর্যন্ত ভাঙন, totient সমস্যার মতোই)।\n2. `phi(m)`-এর সব ভাজক বের করে ছোট থেকে বড় সাজাও।\n3. প্রতিটি ভাজক `d`-তে `pow(a, d, m)` যাচাই করো; প্রথম সফল `d`-ই উত্তর।\n4. উত্তর পাওয়া মাত্র লুপ থামাও।\n\n```python\nimport sys\na, m = map(int, sys.stdin.read().split())\ndef phi(x):\n    result = xx = x\n    d = 2\n    while d * d <= xx:\n        if xx % d == 0:\n            while xx % d == 0:\n                xx //= d\n            result -= result // d\n        d += 1 if d == 2 else 2\n    if xx > 1:\n        result -= result // xx\n    return result\nph = phi(m)\ndivs = []\nd = 1\nwhile d * d <= ph:\n    if ph % d == 0:\n        divs.append(d)\n        if d != ph // d:\n            divs.append(ph // d)\n    d += 1\ndivs.sort()\nfor dd in divs:\n    if pow(a, dd, m) == 1:\n        print(dd)\n        break\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(sqrt(m) + d(phi) * log m)`, যেখানে `d(phi)` = `phi(m)`-এর ভাজক সংখ্যা (এই সীমায় সর্বোচ্চ প্রায় ১৩০০); প্রতিটি পরীক্ষায় `O(log m)` ধাপের ঘাত। স্পেস `O(d(phi))`।\n\n## সাধারণ ভুল\n\n- **`m`-এর ভাজক ঘোরানো:** উত্তর `phi(m)`-এর ভাজক, `m`-এর নয় — `m = 9`, `a = 2`-এ উত্তর `6`, যেটা `9`-এর ভাজক নয়।\n- **বড় ভাজক আগে পরীক্ষা করা:** ক্ষুদ্রতমটা চাই, তাই ছোট থেকে সাজিয়ে প্রথম মিলেই থামো।\n- **`a = 1`-এ আলাদা কেস খোঁজা:** ভাজক `1` পরীক্ষাতেই `pow(1, 1, m) = 1` — উত্তর `1` এমনিতেই বেরিয়ে আসে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Euler Totient", "Modular Arithmetic"],
    tests: [
      { input: "2 7\n", expectedOutput: "3\n", isSample: true },
      { input: "1 5\n", expectedOutput: "1\n", isSample: true },
      { input: "3 10\n", expectedOutput: "4\n", isSample: false },
      { input: "2 9\n", expectedOutput: "6\n", isSample: false },
      { input: "3 1048576\n", expectedOutput: "262144\n", isSample: false },
      {
        input: "3 1000000007\n",
        expectedOutput: "500000003\n",
        isSample: false,
      },
      { input: "5 999999937\n", expectedOutput: "1338688\n", isSample: false },
      {
        input: "999999936 999999937\n",
        expectedOutput: "2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\na, m = map(int, sys.stdin.read().split())\ndef phi(x):\n    result = xx = x\n    d = 2\n    while d * d <= xx:\n        if xx % d == 0:\n            while xx % d == 0:\n                xx //= d\n            result -= result // d\n        d += 1 if d == 2 else 2\n    if xx > 1:\n        result -= result // xx\n    return result\nph = phi(m)\ndivs = []\nd = 1\nwhile d * d <= ph:\n    if ph % d == 0:\n        divs.append(d)\n        if d != ph // d:\n            divs.append(ph // d)\n    d += 1\ndivs.sort()\nfor dd in divs:\n    if pow(a, dd, m) == 1:\n        print(dd)\n        break\n",
  },
];
