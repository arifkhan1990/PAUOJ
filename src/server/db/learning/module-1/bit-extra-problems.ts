import type { SeedProblem } from "../../seed-problems";

export const BIT_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-bit-e2",
    title: "Check the K-th Bit",
    statement: `রাফি ল্যাবের চেয়ার-ইন্ডিকেটরের অবস্থা একটা সংখ্যায় সেভ করেন, যেখানে ডান দিক থেকে শুরু করে পজিশন \`0\`, \`1\`, \`2\`, ... বিটগুলো বসে। সাদিয়া জানতে চান ঠিক কোন পজিশনের বিটটা জ্বলেছে কিনা — অর্থাৎ \`k\` পজিশনের বিট \`1\` কিনা।

এক লাইনে দুইটা পূর্ণসংখ্যা \`n\` আর \`k\` দেওয়া থাকে। সেই বিট \`1\` হলে \`YES\`, \`0\` হলে \`NO\`। উদাহরণ: \`n = 13\` (\`1101\`) এবং \`k = 2\` হলে \`YES\`, \`k = 1\` হলে \`NO\`।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`n\` আর \`k\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `বিট \`1\` হলে \`YES\`, \`0\` হলে \`NO\` এক লাইনে।`,
    constraints: `\`0 <= n <= 10^18\`
\`0 <= k <= 60\`
পজিশন \`0\` মানে সবচেয়ে ডানের বিট।`,
    editorial: `## ধারণা
পজিশন \`k\`-এর বিট আলাদা করতে হলে \`1 << k\` দিয়ে একটা মাস্ক বানাতে হয় — সেটাতে শুধু \`k\` পজিশনে \`1\`, বাকি সব \`0\`। \`n & (1 << k)\` করলে \`k\` পজিশনের বিট ছাড়া বাকি সব মুছে যায়, ফল শূন্য নয় হলে বিটটা \`1\` ছিল। অথবা ডান দিকে \`k\` বিট সরিয়ে \`& 1\` করলেও একই ফল — \`n >> k\` করলে \`k\` পজিশনের বিট শেষ জায়গায় চলে আসে।

## ধাপে ধাপে
1. \`n\` ও \`k\` পড়ো।
2. \`bit = (n >> k) & 1\` বের করো।
3. ফল \`1\` হলে \`YES\`, \`0\` হলে \`NO\` ছাপাও।

\`\`\`python
import sys
n, k = map(int, sys.stdin.read().split())
print("YES" if ((n >> k) & 1) else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(1)\`, মেমোরি \`O(1)\` — কোনো লুপ লাগে না।

## সাধারণ ভুল
- \`k\` ১-ভিত্তিক ধরা: প্রশ্নে পজিশন \`0\` থেকে শুরু, তাই \`13\`-এর ডানের বিটটার নাম \`0\`, \`1\` নয়।
- \`1 << k\` লেখার সময় বন্ধনী না দেওয়া: \`n & 1 << k\` Python-এ ঠিকই চলে, কিন্তু \`n & 1 == k\`-এর মতো মিলিয়ে যাওয়া চিরচেনা — সবসময় \`(n >> k) & 1\` লিখো।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Binary"],
    tests: [
      { input: "13 2\n", expectedOutput: "YES\n", isSample: true },
      { input: "13 1\n", expectedOutput: "NO\n", isSample: true },
      { input: "0 0\n", expectedOutput: "NO\n", isSample: false },
      { input: "1 0\n", expectedOutput: "YES\n", isSample: false },
      { input: "1073741824 30\n", expectedOutput: "YES\n", isSample: false },
      { input: "1073741824 29\n", expectedOutput: "NO\n", isSample: false },
      {
        input: "999999999999999999 60\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn, k = map(int, sys.stdin.read().split())\nprint(\"YES\" if ((n >> k) & 1) else \"NO\")\n",
  },
  {
    slug: "learn-m1-bit-e3",
    title: "Bits to Flip Between Numbers",
    statement: `নুসরাত ল্যাব মেশিনের পারমিশন ফ্ল্যাগ আপডেট করছেন — পুরনো কনফিগারেশন \`a\` থেকে নতুনটা \`b\` হতে হবে। কোন কোন বিট বদলাতে হবে সেটা জানলেই হবে; কারণ একটা বিট বদলালে ঠিক সেই একটা জায়গায় পারমিশন বদলে।

এক লাইনে দুইটা পূর্ণসংখ্যা \`a\` আর \`b\` দেওয়া থাকে; এদের বাইনারি রূপে কয়টা বিট ভিন্ন সেটি ছাপাও। উদাহরণ: \`a = 12\` (\`1100\`), \`b = 10\` (\`1010\`) — দুইটা বিট ভিন্ন, তাই উত্তর \`2\`।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`a\` আর \`b\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `ভিন্ন বিটের সংখ্যা এক লাইনে।`,
    constraints: `\`0 <= a, b <= 10^18\`
একই সংখ্যা হলে উত্তর \`0\`।`,
    editorial: `## ধারণা
দুই সংখ্যার বিট যেখানে ভিন্ন, ঠিক সেখানেই \`a ^ b\`-এর বিট \`1\` হয় — XOR দুই পাশের বিট ভিন্ন হলেই \`1\` দেয়। তাই কতগুলো বিট বদলাতে হবে মানে \`a ^ b\`-এর কয়টা \`1\` বিট আছে সেটা গোনা। \`bin(x).count('1')\` দিয়ে সরাসরি গোনা যায়।

## ধাপে ধাপে
1. \`a\` ও \`b\` পড়ো।
2. \`x = a ^ b\` বের করো।
3. \`x\`-এর বাইনারি রূপে কয়টা \`1\` আছে গোনে ছাপাও।

\`\`\`python
import sys
a, b = map(int, sys.stdin.read().split())
print(bin(a ^ b).count("1"))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log n)\` (বাইনারি রূপের দৈর্ঘ্য), মেমোরি \`O(log n)\`। একটা একটা করে তুলনা করে গোনালেও হত, কিন্তু XOR এক লাইনেই সব ভিন্ন বিট চিহ্নিত করে।

## সাধারণ ভুল
- শুধু \`a & b\` বা \`a | b\` দেখা — সেটা মিলে যাওয়া/থাকা বিট দেখায়, ভিন্ন বিট নয়।
- উত্তর হিসেবে XOR-এর ফল ছাপাও: \`12 ^ 10 = 6\`, অথচ চাওয়া হয়েছে ভিন্ন বিটের সংখ্যা \`2\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "XOR"],
    tests: [
      { input: "12 10\n", expectedOutput: "2\n", isSample: true },
      { input: "5 5\n", expectedOutput: "0\n", isSample: true },
      { input: "0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "8 7\n", expectedOutput: "4\n", isSample: false },
      { input: "1024 0\n", expectedOutput: "1\n", isSample: false },
      { input: "2147483647 0\n", expectedOutput: "31\n", isSample: false },
      {
        input: "0 1099511627775\n",
        expectedOutput: "40\n",
        isSample: false,
      },
      {
        input: "1000000000000000000 1000000000000000000\n",
        expectedOutput: "0\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\na, b = map(int, sys.stdin.read().split())\nprint(bin(a ^ b).count(\"1\"))\n",
  },
  {
    slug: "learn-m1-bit-m2",
    title: "Bitwise AND of a Range",
    statement: `সাদিয়া ক্যাম্পাসের সিকিউরিটি লগের একটা রেঞ্জ দেখছেন — লগ নম্বর \`L\` থেকে \`R\` (দুটোই অন্তর্ভুক্ত) যে কোনো একটাতে যদি নির্দিষ্ট ফ্ল্যাগটা জ্বলে থাকে, তবে তাদের সবগুলোর bitwise AND-এ সেটি জ্বলবেই। তুমি বলো পুরো রেঞ্জের সংখ্যাগুলোর \`L & (L+1) & ... & R\` কত।

এক লাইনে দুইটা পূর্ণসংখ্যা \`L\` আর \`R\` দেওয়া থাকে; ফলটা ছাপাও। উদাহরণ: \`L = 12\`, \`R = 15\` হলে \`12 & 13 & 14 & 15 = 12\`।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`L\` আর \`R\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `রেঞ্জের সব সংখ্যার bitwise AND এক লাইনে।`,
    constraints: `\`0 <= L <= R <= 10^18\`
সরাসরি \`R - L + 1\` সংখ্যা ধরে AND করলে সময় লেগে যায় — কৌশল লাগবে।`,
    editorial: `## ধারণা
একটা বিট যদি পুরো রেঞ্জে জ্বলে থাকে, তাহলে পুরো রেঞ্জে ওই পজিশনের মান একই থাকতে হবে। মান যত বড় হয়, তত বেশি বিট পাশাপাশি মিলে যায় — তাই AND ফল হলো \`L\` আর \`R\`-এর যে অংশ পর্যন্ত মিলে, সেটাই। কৌশল: \`R &= R - 1\` করলে \`R\`-এর সবচেয়ে ডানের \`1\` বিট মুছে যায়; \`L < R\` থাকতে পর্যন্ত এটা চালালে শেষে \`R\` থাকে ঠিক \`L & (L+1) & ... & R\`। কারণ \`R\` কেবল ততক্ষণ ছোট হয় যতক্ষণ \`L\` ছোট, আর প্রতিটি ধাপে মিলে যাওয়া নিশ্চিত হয়।

## ধাপে ধাপে
1. \`L\` ও \`R\` পড়ো।
2. \`L < R\` থাকতে পর্যন্ত \`R &= R - 1\` চালাও।
3. বাকি \`R\` ছাপাও — সেটাই পুরো রেঞ্জের AND।

\`\`\`python
import sys
l, r = map(int, sys.stdin.read().split())
while l < r:
    r &= r - 1
print(r)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log R)\` — প্রতিটি ধাপে \`R\`-এর একটা \`1\` বিট মুছে যায়, তাই সর্বোচ্চ ~৬০ ধাপ। মেমোরি \`O(1)\`। রেঞ্জের প্রতিটি সংখ্যা ধরে AND করলে \`O(R - L)\` — ১০^১৮-এ চলে না।

## সাধারণ ভুল
- শুধু \`L & R\` ছাপা: \`L = 5, R = 7\`-এ \`5 & 7 = 5\`, অথচ পুরো রেঞ্জের AND \`5 & 6 & 7 = 4\`।
- লুপের শর্ত উল্টো করা (\`l < r\` না লেখা) বা \`r &= r - 1\` এর জায়গায় \`r -= 1\` লেখা — তখন বিট পরিষ্কার হয় না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Bitwise AND"],
    tests: [
      { input: "12 15\n", expectedOutput: "12\n", isSample: true },
      { input: "6 9\n", expectedOutput: "0\n", isSample: true },
      { input: "5 5\n", expectedOutput: "5\n", isSample: false },
      { input: "0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "5 7\n", expectedOutput: "4\n", isSample: false },
      {
        input: "1073741820 1073741823\n",
        expectedOutput: "1073741820\n",
        isSample: false,
      },
      {
        input: "999999999999999998 999999999999999999\n",
        expectedOutput: "999999999999999998\n",
        isSample: false,
      },
      {
        input: "0 1000000000000000000\n",
        expectedOutput: "0\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nl, r = map(int, sys.stdin.read().split())\nwhile l < r:\n    r &= r - 1\nprint(r)\n",
  },
  {
    slug: "learn-m1-bit-m3",
    title: "Gray Code of N",
    statement: `ল্যাবের নতুন রোটারি ডায়ালটা Gray code দিয়ে কাজ করে — এভাবে যে পরপর দুটো সংখ্যার বাইনারি রূপে ঠিক একটা করে বিটই বদলায়, ফলে ডায়ালটা ঘোরানোর সময় দুই ধাপের মাঝে কোনো বড় লাফ থাকে না। তানভীরকে সাধারণ সংখ্যা \`n\` দিলে তার Gray code বের করতে হবে।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; তার Gray code ছাপাও। উদাহরণ: \`n = 7\` (\`111\`) হলে উত্তর \`4\` (\`100\`)।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `\`n\`-এর Gray code এক লাইনে।`,
    constraints: `\`0 <= n <= 10^18\`
উত্তরও একই সীমার মধ্যে থাকবে।`,
    editorial: `## ধারণা
২ অঙ্কের Gray code-এর নিয়ম: \`G(n) = n ^ (n >> 1)\`। অর্থাৎ \`n\`-কে ডানে এক বিট সরিয়ে নিজের সাথে XOR করলেই হয়। কেন কাজ করে তা যাচাই করা যায়: \`n\` আর \`n >> 1\`-এর \`i\`-তম বিট মিললে \`i\` পজিশনের Gray বিট \`0\`, ভিন্ন হলে \`1\` — ফলে পরপর দুই সংখ্যার Gray code-এ ঠিক একটা বিটই পার্থক্য পায়।

## ধাপে ধাপে
1. \`n\` পড়ো।
2. \`n ^ (n >> 1)\` হিসাব করো।
3. ফল ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
print(n ^ (n >> 1))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(1)\` (Python-এ বড় সংখ্যার শিফটও লগারিদমিক সময়ে), মেমোরি \`O(1)\`। টেবিল বানিয়ে সব \`n\`-এর Gray code রাখলে \`O(n)\` সময় ও স্পেস — অপ্রয়োজনীয়।

## সাধারণ ভুল
- \`n >> 1\` না করে শুধু \`n ^ (n + 1)\` লেখা — ফল সাধারণত ভিন্ন (যেমন \`7 ^ 8 = 15\`, কিন্তু সঠিক উত্তর \`4\`)।
- উল্টো সূত্র \`n ^ (n >> 1)\` বদলে \`n ^ ((n << 1) & mask)\` ধরে বসানো — সেটা Gray code-এর অন্য একটা রূপ হলেও সীমা ছাড়িয়ে গেলে ফল বদলায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Encoding"],
    tests: [
      { input: "0\n", expectedOutput: "0\n", isSample: true },
      { input: "7\n", expectedOutput: "4\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: false },
      { input: "3\n", expectedOutput: "2\n", isSample: false },
      { input: "10\n", expectedOutput: "15\n", isSample: false },
      {
        input: "1099511627775\n",
        expectedOutput: "549755813888\n",
        isSample: false,
      },
      {
        input: "1000000000000000000\n",
        expectedOutput: "797398725282889728\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nprint(n ^ (n >> 1))\n",
  },
  {
    slug: "learn-m1-bit-h2",
    title: "Count Set Bits From 1 to N",
    statement: `রাফি মনিটরের ডেমো মোডে ১ থেকে \`n\` পর্যন্ত প্রতিটা সংখ্যা দেখাচ্ছে, আর হিসেব করছে মোট কয়বার সব চেয়ার-ইন্ডিকেটর জ্বলেছে — অর্থাৎ এই ধারার সব সংখ্যার মোট \`1\` বিট কয়টা। একটা করে সংখ্যা বানিয়ে গোনালে \`n = 10^15\`-এ সময় লেগে যায়, তাই প্রতিটি পজিশনের বিট আলাদা করে হিসাব করতে হবে।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; \`1\` থেকে \`n\` (দুটোই অন্তর্ভুক্ত) পর্যন্ত সব সংখ্যার মোট \`1\` বিট সংখ্যা ছাপাও। উদাহরণ: \`5\` পর্যন্ত \`1 + 1 + 2 + 1 + 2 = 7\`।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `মোট \`1\` বিটের সংখ্যা এক লাইনে।`,
    constraints: `\`0 <= n <= 10^15\`
উত্তর সর্বোচ্চ \`2.5 * 10^16\`-এর কাছাকাছি, তাই ৬৪ বিটের মধ্যে থাকে; তবু Python-এ বড় সংখ্যা সমস্যা হয় না।`,
    editorial: `## ধারণা
একটা করে সংখ্যা না ধরে প্রতিটি বিট পজিশন আলাদা করে ভাবো। পজিশন \`0\`-এর বিট বারবার বদলায়: ১ বিট, ০ বিট, ১ বিট, ০ বিট — প্রতি \`2\` সংখ্যায় একবার করে চক্র। পজিশন \`1\`-এর বিট \`4\` সংখ্যায় এক চক্র (\`2\` বিট, \`2\` শূন্য); পজিশন \`i\`-এর বিট \`2^(i+1)\` সংখ্যায় এক চক্র — প্রথম অর্ধেকে \`1\`, পরের অর্ধেকে \`0\`। তাই \`n\` পর্যন্ত পজিশন \`i\`-তে কয়বার \`1\` হয়:

\`(n // (2 * 2^i)) * 2^i + max(0, n % (2 * 2^i) - 2^i + 1)\`

প্রথম অংশ পূর্ণ চক্রগুলো, দ্বিতীয় অংশ শেষের আংশিক চক্র। সব পজিশনের ফল যোগ করলেই উত্তর।

## ধাপে ধাপে
1. \`n\` পড়ে \`count = 0\`, \`bit = 1\` ধরো।
2. \`bit <= n\` থাকতে পর্যন্ত: \`count += (n // (bit * 2)) * bit + max(0, n % (bit * 2) - bit + 1)\`, তারপর \`bit *= 2\`।
3. \`count\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
count = 0
bit = 1
while bit <= n:
    count += (n // (bit * 2)) * bit + max(0, n % (bit * 2) - bit + 1)
    bit *= 2
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log n)\` — প্রতি ধাপে \`bit\` দ্বিগুণ হয়, তাই ১০^১৫-এও মাত্র ~৫০ ধাপ। মেমোরি \`O(1)\`। \`1\` থেকে \`n\` প্রতিটি সংখ্যার বিট গোনা \`O(n log n)\` — এই সীমায় অকল্পনীয়।

## সাধারণ ভুল
- আংশিক চক্রের হিসাব বাদ: \`n = 10\`-এ পজিশন \`3\`-তে শুধু \`8, 9, 10\` — তিনটা \`1\`; শুধু \`n // 16\` ধরলে শূন্য পাবে।
- \`bit\` লুপে \`2 * bit\` ভুলে যাওয়া বা \`n\` না ধরে অসীম লুপ চালানো — \`n = 0\` হলে লুপটাই চলবে না, উত্তর \`0\`।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Counting"],
    tests: [
      { input: "5\n", expectedOutput: "7\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "0\n", expectedOutput: "0\n", isSample: false },
      { input: "10\n", expectedOutput: "17\n", isSample: false },
      { input: "1000\n", expectedOutput: "4938\n", isSample: false },
      { input: "1023\n", expectedOutput: "5120\n", isSample: false },
      {
        input: "1000000000000000\n",
        expectedOutput: "24784747400675348\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ncount = 0\nbit = 1\nwhile bit <= n:\n    count += (n // (bit * 2)) * bit + max(0, n % (bit * 2) - bit + 1)\n    bit *= 2\nprint(count)\n",
  },
];
