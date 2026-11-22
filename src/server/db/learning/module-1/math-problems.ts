import type { SeedProblem } from "../../seed-problems";

export const MATH_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-gcd-two-numbers",
    title: "GCD of Two Numbers",
    statement: `প্রাইমএশিয়ার জ্যামিতি ক্লাসে শিক্ষক রফিক সার বোর্ডে দুইটা সংখ্যা লিখে জিজ্ঞেস করলেন — এদের গরিষ্ঠ সাধারণ গুণনীয়ক বা সবচেয়ে বড় সাধারণ ভাগকারী (GCD) কত? অনেক শিক্ষার্থী সব গুণিতক লুপ চালিয়ে খুঁজছে, যা বড় সংখ্যায় কাজে আসে না। তুমি Euclid-এর পুরনো একটা কৌশল দিয়ে এক সেকেন্ডেরও কম সময়ে উত্তরটা বের করো।

এক লাইনে দুইটা পূর্ণসংখ্যা \`a\` আর \`b\` দেওয়া থাকে; তাদের GCD ছাপাও।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`a\` আর \`b\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে GCD।`,
    constraints: `\`1 <= a, b <= 10^18\`
এত বড় সংখ্যায় সব ভাগকারী খোঁজা যায় না, ইটারেটিভ হিসাবই কাজের।`,
    editorial: `## ধারণা
GCD-এর মূল ধারণা: \`gcd(a, b) = gcd(b, a % b)\`। ভাগশেষ কমতে কমতে একসময় \`b\` শূন্য হয়, আর সেই মুহূর্তে বাকি \`a\`-টাই GCD। এভাবে প্রতিবার সংখ্যা দ্রুত ছোট হয়, তাই এত বড় সংখ্যাতেও কয়েক ধাপেই শেষ হয়। শর্ত দুটো ধনাত্মক বলে কোনো বিশেষ হ্যান্ডলিং লাগে না।

## ধাপে ধাপে
1. \`a\` ও \`b\` পড়ো।
2. \`b\` শূন্য না হওয়া পর্যন্ত চালাও: \`a, b = b, a % b\`।
3. লুপ শেষে \`a\` ছাপাও — সেটাই GCD।

\`\`\`python
import sys
a, b = map(int, sys.stdin.read().split())
while b != 0:
    a, b = b, a % b
print(a)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log min(a, b))\` — প্রতি ধাপে সংখ্যা প্রায় অর্ধেক হয়ে যায়। মেমোরি \`O(1)\`। সব ভাগকারী খোঁজার \`O(sqrt(n))\` নিয়মও ১০^১৮-এ চলে না।

## সাধারণ ভুল
- লুপে \`a, b = b, a % b\` না লিখে শুধু \`a = a % b\` করলে ধাপটা এগোয় না বা ভুল ফল দেয় — দুটো মান একসাথে বদলাতে হয়।
- \`a\` আর \`b\` যদি এক হয়, তাহলে GCD নিজেই সেই সংখ্যা; প্রথম ধাপেই \`b = 0\` হয়ে সঠিক উত্তর পাওয়া যায়, সেটা ভুল মনে করবে না।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "GCD"],
    tests: [
      { input: "12 18\n", expectedOutput: "6\n", isSample: true },
      { input: "7 13\n", expectedOutput: "1\n", isSample: true },
      { input: "100 75\n", expectedOutput: "25\n", isSample: false },
      { input: "1071 462\n", expectedOutput: "21\n", isSample: false },
      { input: "1 1000000000000000000\n", expectedOutput: "1\n", isSample: false },
      { input: "1000000000000000000 1000000000000000000\n", expectedOutput: "1000000000000000000\n", isSample: false },
    ],
    referencePython:
      "import sys\na, b = map(int, sys.stdin.read().split())\nwhile b != 0:\n    a, b = b, a % b\nprint(a)\n",
  },
  {
    slug: "learn-m1-prime-check",
    title: "Prime Check",
    statement: `প্রাইমএশিয়ার নম্বর থিওরি ক্লাসে শিক্ষক দুই ধারা করে দল বানাচ্ছেন — যাদের ব্যাচ নম্বর প্রাইম সেরা দলে, বাকিরা অন্য দলে। নুসরাত তালিকা দেখে হিসেব করছেন কে কোন দলে যাবে। তুমি বলো দেওয়া নম্বরটা প্রাইম কিনা।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে। প্রাইম হলে \`YES\`, না হলে \`NO\`। মনে রেখো \`1\` প্রাইম নয়।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `প্রাইম হলে \`YES\`, না হলে \`NO\`।`,
    constraints: `\`1 <= n <= 10^12\`
সর্বোচ্চ ক্ষেত্রে \`sqrt(n)\` পর্যন্ত যাচাই করলেই হবে।`,
    editorial: `## ধারণা
\`n > 1\` এবং ১ ও \`n\` ছাড়া অন্য কোনো ভাগকারী না থাকলে সেটা প্রাইম। যাচাই করার সহজ নিয়ম: \`sqrt(n)\` পর্যন্ত সমান বা ছোট ভাগকারী যদি কোনোটা পাওয়া যায়, তাহলে \`n = d * (n / d)\` হয় — অর্থাৎ একটা ভাগকারী পেলেই \`n\` প্রাইম নয়। তাই পুরো \`n\` পর্যন্ত যাওয়ার দরকার নেই।

## ধাপে ধাপে
1. \`n < 2\` হলে সরাসরি \`NO\` (২ থেকেই শুরু)।
2. \`n = 2\` হলে \`YES\`; \`n\` জোড় হলে \`NO\`।
3. বিজোড় সংখ্যাগুলোর জন্য \`3, 5, 7, ...\` ধরে \`i * i <= n\` পর্যন্ত যাচাই করো।
4. কোনো ভাগকারী না পেলে \`YES\`, পেলে \`NO\`।

\`\`\`python
import sys
n = int(sys.stdin.readline())
if n < 2:
    print("NO")
elif n == 2:
    print("YES")
elif n % 2 == 0:
    print("NO")
else:
    is_prime = True
    i = 3
    while i * i <= n:
        if n % i == 0:
            is_prime = False
            break
        i += 2
    print("YES" if is_prime else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(sqrt(n))\` — ১০^১২-এ সর্বোচ্চ ১০^৬ ধাপ। মেমোরি \`O(1)\`। প্রতিটি সংখ্যা আলাদা করে যাচাই করলে অনেক বড় রেঞ্জে সময় লেগে যায়, সে ক্ষেত্রে এই টপিকের Sieve কাজে আসবে।

## সাধারণ ভুল
- \`1\`-কে প্রাইম ধরে ফেলা — সংজ্ঞা অনুযায়ী প্রাইম অবশ্যই ১-এর বেশি।
- \`n = 4\`-এর মতো জোড় সংখ্যায় লুপ চালিয়ে যাওয়া, অথবা \`i\` শুরু ২ না করে ১ দিয়ে করা — ১ দিয়ে ভাগ সবসময় যায়, তাই প্রতিটি সংখ্যা যেন কম্পোজিট না দেখায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Primes"],
    tests: [
      { input: "97\n", expectedOutput: "YES\n", isSample: true },
      { input: "1\n", expectedOutput: "NO\n", isSample: true },
      { input: "2\n", expectedOutput: "YES\n", isSample: false },
      { input: "1000\n", expectedOutput: "NO\n", isSample: false },
      { input: "7919\n", expectedOutput: "YES\n", isSample: false },
      { input: "999999999987\n", expectedOutput: "NO\n", isSample: false },
      { input: "999999999989\n", expectedOutput: "YES\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nif n < 2:\n    print(\"NO\")\nelif n == 2:\n    print(\"YES\")\nelif n % 2 == 0:\n    print(\"NO\")\nelse:\n    is_prime = True\n    i = 3\n    while i * i <= n:\n        if n % i == 0:\n            is_prime = False\n            break\n        i += 2\n    print(\"YES\" if is_prime else \"NO\")\n",
  },
  {
    slug: "learn-m1-sieve-count",
    title: "Count Primes Up To N",
    statement: `নম্বর থিওরি ক্লাসের ক্লাসওয়ার্কে শিক্ষক জিজ্ঞেস করেছেন ১ থেকে \`n\` পর্যন্ত মোট কয়টা প্রাইম সংখ্যা আছে। তিনি সঙ্গে বলেছেন প্রতিটাকে আলাদা করে যাচাই করে সময় নষ্ট কোরিয়ো না — Sieve of Eratosthenes দিয়ে একসাথে করো। নুসরাত তার সমাধানটা লিখে জমা দিতে চায়।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; \`n\` বা তার ছোট সব প্রাইম সংখ্যার সংখ্যাটা ছাপাও।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `এক লাইনে প্রাইম সংখ্যার সংখ্যা।`,
    constraints: `\`1 <= n <= 1000000\`
একবারই Sieve চালালেই হবে, প্রতিটি সংখ্যা আলাদা করে নয়।`,
    editorial: `## ধারণা
Sieve of Eratosthenes: প্রথমে ২ থেকে \`n\` পর্যন্ত সবকিছুকে ধরে নাও প্রাইম। এরপর ২ থেকে শুরু করে প্রতিটি প্রাইম \`p\`-এর জন্য \`p*p\`, \`p*(p+1)\`, ... সব গুণফলকে কম্পোজিট চিহ্নিত করো। একবার \`p*p\` থেকে শুরু করলেই হয়, কারণ ছোট গুণকের জন্য ইতিমধ্যে চিহ্নিত হয়ে গেছে। শেষে চিহ্নিত নয় যেগুলো, সেগুলোই প্রাইম।

## ধাপে ধাপে
1. \`n < 2\` হলে উত্তর \`0\`।
2. সাইজ \`n + 1\`-এর একটা বুলিয়ান তালিকা নাও, সব \`True\`।
3. ০ ও ১ কে \`False\` করো — প্রাইম নয়।
4. \`p = 2\` থেকে \`p*p <= n\` পর্যন্ত: \`p\` প্রাইম হলে তার সব গুণফল \`False\` করো।
5. তালিকায় \`True\`-এর সংখ্যা ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
if n < 2:
    print(0)
else:
    sieve = bytearray(b"\\x01") * (n + 1)
    sieve[0:2] = b"\\x00\\x00"
    p = 2
    while p * p <= n:
        if sieve[p]:
            sieve[p * p : n + 1 : p] = b"\\x00" * (((n - p * p) // p) + 1)
        p += 1
    print(sum(sieve))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log log n)\` — প্রায় \`O(n)\`। মেমোরি \`O(n)\`, ১০^৬-এ প্রায় ১ MB। প্রতিটি সংখ্যা আলাদা যাচাই করলে \`O(n sqrt(n))\` — এই সীমায় অনেক ধীর।

## সাধারণ ভুল
- \`1\`-কে প্রাইম ধরে ফেলা; Sieve-তে আলাদা করে ০ ও ১ বাদ দিতে হয়।
- \`p\`-এর গুণফল ২ থেকে শুরু করা, ফলে ইতিমধ্যে কম্পোজিট চিহ্নিত সংখ্যাগুলো আবার ঘোরা এবং সময় বেড়ে যাওয়া — \`p*p\` থেকে শুরু করাই কাজের।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Sieve"],
    tests: [
      { input: "20\n", expectedOutput: "8\n", isSample: true },
      { input: "1\n", expectedOutput: "0\n", isSample: true },
      { input: "2\n", expectedOutput: "1\n", isSample: false },
      { input: "50\n", expectedOutput: "15\n", isSample: false },
      { input: "1000\n", expectedOutput: "168\n", isSample: false },
      { input: "10000\n", expectedOutput: "1229\n", isSample: false },
      { input: "1000000\n", expectedOutput: "78498\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nif n < 2:\n    print(0)\nelse:\n    sieve = bytearray(b'\\x01') * (n + 1)\n    sieve[0:2] = b'\\x00\\x00'\n    p = 2\n    while p * p <= n:\n        if sieve[p]:\n            sieve[p*p:n+1:p] = b'\\x00' * (((n - p*p) // p) + 1)\n        p += 1\n    print(sum(sieve))\n",
  },
  {
    slug: "learn-m1-lcm-pair",
    title: "LCM of a Pair",
    statement: `নুসরাত হোস্টেলের ডিউটি রোস্টার বানাচ্ছেন। দুই রুমের ছাত্রদের ডিউটি আসে যথাক্রমে \`a\` দিন পর পর আর \`b\` দিন পর পর, এবং আজ দুজনেরই ডিউটি ছিল। তুমি বলো পরবর্তী কোন দিনে দুজনেরই ডিউটি আবার একসাথে আসবে — অর্থাৎ দুই সংখ্যার লঘিষ্ঠ সাধারণ গুণিতক (LCM) কত।

এক লাইনে দুইটা পূর্ণসংখ্যা \`a\` আর \`b\` দেওয়া থাকে; তাদের LCM ছাপাও।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`a\` আর \`b\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে LCM।`,
    constraints: `\`1 <= a, b <= 10^9\`
LCM যত বড় হতে পারে সেভাবেই হিসাব করো — \`a * b\` আগে গুণ করলে ৩২ বিটে ওভারফ্লো হয়; ৬৪ বিটে এই সীমায় ধরে, তবু আগে ভাগ করাই নিরাপদ।`,
    editorial: `## ধারণা
দুইটা সংখ্যার GCD আর LCM একসাথে জানলে হাতে-কলমে হিসাব করা যায়: \`a * b = gcd(a, b) * lcm(a, b)\`। সুতরাং \`lcm = a / gcd(a, b) * b\`। এখানে আগে ভাগ করাটা জরুরি — \`a * b\` আগে গুণ করলে ১০^৯ × ১০^৯ = ১০^১৮ হয়, যা ৬৪ বিটের প্রায় সীমায়, আর বড় হলে ভেঙে যায়। GCD বের করতে ইউক্লিডের অ্যালগরিদমই কাজ করবে।

## ধাপে ধাপে
1. \`a\` ও \`b\` পড়ো।
2. Euclid দিয়ে \`g = gcd(a, b)\` বের করো।
3. \`a // g\` করে তারপর \`* b\` — এভাবে গুণ করো।
4. ফল ছাপাও।

\`\`\`python
import sys
a, b = map(int, sys.stdin.read().split())
x, y = a, b
while y != 0:
    x, y = y, x % y
g = x
print(a // g * b)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log min(a, b))\` — GCD নেওয়ার সময়। মেমোরি \`O(1)\`। \`lcm\` নিজে সর্বোচ্চ \`10^18\` হতে পারে, তাই ৬৪ বিট ধারণ করা যায়।

## সাধারণ ভুল
- \`a * b // g\` — ফল একই, কিন্তু C++-তে \`a * b\` আগে গুণ করলে ওভারফ্লো; সবসময় আগে \`a / g\`।
- অনুসন্ধানভিত্তিকভাবে ছোট থেকে বড় পর্যন্ত লুপ চালানো — উত্তর ঠিক হলেও ১০^৯-এ কাজে আসে না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "GCD", "LCM"],
    tests: [
      { input: "4 6\n", expectedOutput: "12\n", isSample: true },
      { input: "13 17\n", expectedOutput: "221\n", isSample: true },
      { input: "6 10\n", expectedOutput: "30\n", isSample: false },
      { input: "21 6\n", expectedOutput: "42\n", isSample: false },
      { input: "1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "1000000000 1000000000\n", expectedOutput: "1000000000\n", isSample: false },
      { input: "1000000000 999999937\n", expectedOutput: "999999937000000000\n", isSample: false },
    ],
    referencePython:
      "import sys\na, b = map(int, sys.stdin.read().split())\nx, y = a, b\nwhile y != 0:\n    x, y = y, x % y\nprint(a // x * b)\n",
  },
  {
    slug: "learn-m1-modular-power",
    title: "Modular Exponentiation",
    statement: `তানভির ক্রিপ্টোগ্রাফি অ্যাসাইনমেন্টে গণনা করতে হয় \`a^b\` কে \`m\` দিয়ে ভাগের ভাগশেষ, কিন্তু \`b\` এত বড় যে \`a ** b\` বানানোর কোনো উপায় নেই — সংখ্যাটা মহাবিশ্বও ছোট হবে না। শিক্ষক বলেছেন ঘাত না বানিয়ে, প্রতিটি ধাপেই ভাগশেষ নিয়ে এগোতে হবে।

এক লাইনে তিনটা পূর্ণসংখ্যা \`a\`, \`b\`, \`m\` দেওয়া থাকে; \`a^b mod m\` ছাপাও।`,
    inputFormat: `এক লাইনে তিনটি পূর্ণসংখ্যা \`a\`, \`b\`, \`m\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে \`a^b mod m\`।`,
    constraints: `\`0 <= a <= 10^18\`
\`0 <= b <= 10^18\`
\`1 <= m <= 10^9\`
\`b = 0\` হলে \`a^0 = 1\` (ভাগের পরও \`1 mod m\`)।`,
    editorial: `## ধারণা
বাইনারি ঘাত (fast power) দেখে প্রতিটি ধাপে ছোট করে হিসাব করা যায়। ভাবো \`b\` বাইনারিতে লেখা — যেকোনো ঘাত \`a^b\` ভাগ করা যায় \`a\`, \`a^2\`, \`a^4\`, \`a^8\`, ... এদের গুণফল হিসেবে। \`b\` একের ঘরে যেখানে ১, সেখানে বর্তমান ঘাতটা উত্তরে যোগ হয়, আর প্রতিবার ঘাতটা নিজেকে গুণ করে বড় হয়। প্রতিটি ধাপে \`m\` দিয়ে ভাগশেষ নিলে সংখ্যা কখনো বড় হয় না।

## ধাপে ধাপে
1. \`a = a % m\` করে শুরু করো (প্রাথমিকভাবে ছোট)।
2. \`result = 1\` ধরো; \`b = 0\` হলে শুধু \`1 % m\` ছাপাও।
3. \`b\` শূন্য না হওয়া পর্যন্ত: \`b\` বিজোড় হলে \`result = result * a % m\`, তারপর সবসময় \`a = a * a % m\` আর \`b //= 2\`।
4. \`result\` ছাপাও।

\`\`\`python
import sys
a, b, m = map(int, sys.stdin.read().split())
result = 1 % m
a %= m
while b > 0:
    if b % 2 == 1:
        result = result * a % m
    a = a * a % m
    b //= 2
print(result)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log b)\` — \`b\` প্রতি ধাপে অর্ধেক হয়, তাই ১০^১৮-এও মাত্র ~৬০ ধাপ। মেমোরি \`O(1)\`। সরাসরি \`a ** b\` বানানো অসম্ভব, আর \`O(b)\` লুপ ১০^১৮-এ চলে না।

## সাধারণ ভুল
- প্রথমে \`a ** b\` বানিয়ে তারপর ভাগ — ঘাতটাই তৈরি করা যায় না, Python-ও অনেকক্ষণ ধরে আটকে থাকে।
- \`b = 0\` বা \`m = 1\` সামলানো: \`a^0 = 1\`, তবে \`m = 1\` হলে যেকোনো সংখ্যার ভাগশেষ ০। এই দুই কেস টেস্টে ধরা আছে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Binary Exponentiation"],
    tests: [
      { input: "2 10 1000\n", expectedOutput: "24\n", isSample: true },
      { input: "5 3 13\n", expectedOutput: "8\n", isSample: true },
      { input: "3 0 7\n", expectedOutput: "1\n", isSample: false },
      { input: "0 0 5\n", expectedOutput: "1\n", isSample: false },
      { input: "4 5 1\n", expectedOutput: "0\n", isSample: false },
      { input: "123456789 987654321 1000000007\n", expectedOutput: "652541198\n", isSample: false },
      { input: "7 1000000000000000000 999999937\n", expectedOutput: "570178716\n", isSample: false },
    ],
    referencePython:
      "import sys\na, b, m = map(int, sys.stdin.read().split())\nresult = 1 % m\na %= m\nwhile b > 0:\n    if b % 2 == 1:\n        result = result * a % m\n    a = a * a % m\n    b //= 2\nprint(result)\n",
  },
  {
    slug: "learn-m1-divisor-count",
    title: "Count The Divisors",
    statement: `রফি সংখ্যা বিশ্লেষণ অ্যাসাইনমেন্টে দেওয়া সংখ্যার সব ভাগকারী এক এক করে লিখে ফেলছে, কিন্তু সংখ্যা বড় হওয়ায় তালিকা শেষই হচ্ছে না। শিক্ষক বলেছেন শুধু কয়টা ভাগকারী আছে সেটা জানলেই হবে। তুমি সেই সংখ্যাটা দ্রুত বের করে দাও।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; \`n\`-এর ধনাত্মক ভাগকারীর সংখ্যা ছাপাও।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `এক লাইনে ভাগকারীর সংখ্যা।`,
    constraints: `\`1 <= n <= 10^12\`
\`sqrt(n)\` পর্যন্ত যাচাই করলেই হবে — পুরো \`n\` পর্যন্ত নয়।`,
    editorial: `## ধারণা
ভাগকারী জোড়ায় আসে: \`d\` যদি \`n\` ভাগ করে, তাহলে \`n / d\`-ও ভাগ করে। তাই \`d * d <= n\` পর্যন্ত ঘুরে প্রতিটি \`d\`-এর জন্য দুটোই ধরে নিলেই হয়। আরও কাজের কথা: প্রাইম ফ্যাক্টরাইজেশন থেকে ভাগকারীর সংখ্যা বের করা যায়। যদি \`n = p1^e1 * p2^e2 * ...\` হয়, তাহলে ভাগকারী সংখ্যা \`(e1 + 1) * (e2 + 1) * ...\`। উদাহরণে \`12 = 2^2 * 3^1\` → \`(2+1)*(1+1) = 6\`।

## ধাপে ধাপে
1. \`n\` পড়ো, \`count = 1\` ধরো (গুণিতক আকারের হিসাবের জন্য)।
2. \`d = 2\` থেকে \`d * d <= n\` পর্যন্ত: \`d\` দিয়ে যতবার ভাগ যায় ততবার ভাগ করে ঘাত \`e\` গোনো, তারপর \`count *= (e + 1)\`।
3. লুপ শেষে \`n > 1\` থাকলে একটা প্রাইম বাকি, তাই \`count *= 2\`।
4. \`count\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
count = 1
d = 2
while d * d <= n:
    exponent = 0
    while n % d == 0:
        n //= d
        exponent += 1
    count *= exponent + 1
    d = 3 if d == 2 else d + 2
if n > 1:
    count *= 2
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(sqrt(n))\` — ১০^১২-এ সর্বোচ্চ ১০^৬ ধাপ। মেমোরি \`O(1)\`। প্রতিটি ভাগকারী আলাদা করে খুঁজলে \`O(n)\` বা পুরো \`1\` থেকে \`n\` লুপ \`O(n)\` — এই সীমায় অকল্পনীয়।

## সাধারণ ভুল
- লুপে \`d\` বাড়াতে ভুলে যাওয়া বা \`d\`-কে ১ দিয়ে শুরু করা — ১ দিয়ে ভাগ চিরকাল যায়, ঘাত অসীম হয়ে যায়।
- শেষে \`n > 1\` চেক না করা: \`12 = 2^2 * 3\`-এ লুপের পর বাকি থাকা প্রাইম \`3\` ধরা হয় না, ফলে ভাগকারীর সংখ্যা ৬ না হয়ে ৩ আসে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Divisors"],
    tests: [
      { input: "12\n", expectedOutput: "6\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "97\n", expectedOutput: "2\n", isSample: false },
      { input: "36\n", expectedOutput: "9\n", isSample: false },
      { input: "1000000\n", expectedOutput: "49\n", isSample: false },
      { input: "1000000000000\n", expectedOutput: "169\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ncount = 1\nd = 2\nwhile d * d <= n:\n    exponent = 0\n    while n % d == 0:\n        n //= d\n        exponent += 1\n    count *= exponent + 1\n    d = 3 if d == 2 else d + 2\nif n > 1:\n    count *= 2\nprint(count)\n",
  },
  {
    slug: "learn-m1-perfect-number",
    title: "Perfect Number Check",
    statement: `সাদিয়া সংখ্যা নিয়ে গবেষণায় বসেছে — এমন সংখ্যা যার নিজেকে ছাড়া সব ভাগকারীর যোগফল হয় ঠিক নিজেই, সেগুলোকে তিনি "পারফেক্ট" বলে ডাকছে। প্রথমটা হলো \`6\` (ভাগকারী \`1, 2, 3\`, যোগ \`6\`), পরেরটা \`28\`। তুমি বলো দেওয়া সংখ্যাটা পারফেক্ট কিনা।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে। পারফেক্ট হলে \`YES\`, না হলে \`NO\`। নিজের সাথে নিজেকে যোগ করা হবে না — শুধু \`n\` এর ছোট ভাগকারী।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `পারফেক্ট হলে \`YES\`, না হলে \`NO\`।`,
    constraints: `\`1 <= n <= 1000000\`
এই সীমায় পারফেক্ট সংখ্যা মাত্র কয়েকটা — হিসাব সঠিক করলেই ধরা পড়বে।`,
    editorial: `## ধারণা
পারফেক্ট হলে \`n\`-এর সব ভাগকারী যোগ, \`n\` নিজে বাদ দিয়ে, \`n\` এর সমান। ভাগকারী জোড়ায় আসে বলে \`d * d <= n\` পর্যন্ত ঘুরেই হিসাব করা যায়: প্রতিটি \`d\`-এর জন্য \`d\` যোগ হবে, আর \`n / d\` যদি ভিন্ন হয় এবং \`n\` না হয়, তাহলে সেটাও যোগ হবে। \`n\` নিজেকে কখনো যোগ করবে না।

## ধাপে ধাপে
1. \`n\` পড়ো, \`total = 0\` দিয়ে শুরু করো।
2. \`d = 1\` থেকে \`d * d <= n\` পর্যন্ত: \`d\` ভাগ করলে \`d != n\` হলে \`total += d\`।
3. \`pair = n // d\`; \`pair\` যদি \`d\` আর \`n\` দুটোই না হয়, তাহলে \`total += pair\`।
4. \`total == n\` হলে \`YES\`, না হলে \`NO\`।

\`\`\`python
import sys
n = int(sys.stdin.readline())
total = 0
d = 1
while d * d <= n:
    if n % d == 0:
        if d != n:
            total += d
        pair = n // d
        if pair != d and pair != n:
            total += pair
    d += 1
print("YES" if total == n else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(sqrt(n))\` — ১০^৬-এ হাজার কয়েক ধাপ। মেমোরি \`O(1)\`। \`1\` থেকে \`n\` পর্যন্ত লুপ \`O(n)\` হলেও চলত, কিন্তু \`sqrt\` নিয়ম সবসময় ভালো।

## সাধারণ ভুল
- শুধু \`d\`-গুলো যোগ করে \`pair\` বাদ দেওয়া: \`28\`-এ তখন \`1 + 2 + 4 = 7\` পাওয়া যায়, উত্তর ভুল \`NO\` হয়।
- \`n = 1\`-এ \`d = 1 = n\` — নিজেকে যোগ করলে ভাগশেষ \`1 == 1\` হয়ে \`YES\` দেখায়, কিন্তু ১-এর কোনো ছোট ভাগকারী নেই, তাই উত্তর \`NO\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Divisors"],
    tests: [
      { input: "6\n", expectedOutput: "YES\n", isSample: true },
      { input: "28\n", expectedOutput: "YES\n", isSample: true },
      { input: "1\n", expectedOutput: "NO\n", isSample: false },
      { input: "12\n", expectedOutput: "NO\n", isSample: false },
      { input: "496\n", expectedOutput: "YES\n", isSample: false },
      { input: "8128\n", expectedOutput: "YES\n", isSample: false },
      { input: "1000000\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ntotal = 0\nd = 1\nwhile d * d <= n:\n    if n % d == 0:\n        if d != n:\n            total += d\n        pair = n // d\n        if pair != d and pair != n:\n            total += pair\n    d += 1\nprint(\"YES\" if total == n else \"NO\")\n",
  },
];
