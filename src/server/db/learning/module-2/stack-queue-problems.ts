import type { SeedProblem } from "../../seed-problems";
import { lineInput, nAndNumbers, spaceOutput } from "../generated-tests";

export const STACK_QUEUE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-stack-queue-g1",
    title: "Reverse a Word with Stack",
    statement: `সাদিয়া প্রাইমএশিয়া কোডিং ক্লাবের নোটিশ লিখছেন, কিন্তু তার কী-বোর্ডের একটা কী বারবার উল্টো টাইপ হয়ে যায় — যে শব্দটা সে লিখছে সেটা শেষ থেকে আগে হয়ে যায়। রফি বলল, "স্ট্যাক দিয়ে সহজ: প্রতিটা অক্ষর ঢোকাও, তারপর এক এক করে তোলো।" তুমি সেই স্ট্যাক-ভাবনা দিয়ে শব্দটা উল্টো করে ছাপাও।\n\nএক লাইনে একটা শব্দ আসে — ছোট হাতের ইংরেজি অক্ষর, স্পেস ছাড়া।`,
    inputFormat: `এক লাইনে একটা শব্দ \`word\`।`,
    outputFormat: `এক লাইনে শব্দটার ঠিক বিপরীত রূপ।`,
    constraints: `1 <= len(word) <= 1000\`
শব্দে শুধু ছোট হাতের ইংরেজি অক্ষর থাকে।`,
    editorial: `## ধারণা
স্ট্যাকের নিয়ম LIFO — শেষে ঢোকা জিনিসটাই প্রথমে বের হয়। তাই শব্দের বাঁ থেকে ডানে এক এক অক্ষর \`push\` করে রাখলে, তারপর এক এক করে \`pop\` করলে বের হওয়া ক্রমটা হবে ঠিক উল্টো। Python-এ সাধারণ \`list\`-ই স্ট্যাকের মতো: \`append\` হলো push, \`pop()\` হলো pop।

## ধাপে ধাপে
1. এক লাইন থেকে শব্দটা পড়ে \`word\`-এ রাখো।
2. খালি \`stack = []\` দিয়ে শুরু করো।
3. \`word\`-এর প্রতিটা অক্ষরের জন্য \`stack.append(ch)\` করো।
4. স্ট্যাক খালি না হওয়া পর্যন্ত \`stack.pop()\` করে ফল স্ট্রিংয়ে যোগ করো।
5. সংগ্রহ করা স্ট্রিংটা এক লাইনে ছাপাও।

\`\`\`python
import sys
word = sys.stdin.readline().strip()
stack = []
for ch in word:
    stack.append(ch)
result = ""
while stack:
    result += stack.pop()
print(result)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটা অক্ষর একবার push, একবার pop। মেমোরি \`O(n)\`, কারণ স্ট্যাকে পুরো শব্দটা ধরে রাখতে হয়।

## সাধারণ ভুল
- \`word[::-1]\` দিয়ে সরাসরি উল্টো করে ফেলা — ফল ঠিক আসবে, কিন্তু এখানে শেখার বিষয় স্ট্যাকের ধারণাটা; সম্পাদক কোডে স্ট্যাক না থাকলে ধারণাটা বুঝা যায় না।
- শেষ অক্ষরটা দুইবার যোগ হয় বা একটা বাদ পড়ে: \`while stack:\` লুপে প্রতিবার ঠিক একটা করেই বের হয়, তাই লুপের ভিতরে কাজ দুটো একসাথে করা যায় না।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Stack", "String", "Implementation"],
    tests: [
      { input: "prime\n", expectedOutput: "emirp\n", isSample: true },
      { input: "a\n", expectedOutput: "a\n", isSample: true },
      { input: "level\n", expectedOutput: "level\n", isSample: false },
      { input: "stack\n", expectedOutput: "kcats\n", isSample: false },
      { input: "abcxyz\n", expectedOutput: "zyxcba\n", isSample: false },
      { input: "ab".repeat(500) + "\n", expectedOutput: "ba".repeat(500) + "\n", isSample: false },
    ],
    referencePython:
      "import sys\nword = sys.stdin.readline().strip()\nstack = []\nfor ch in word:\n    stack.append(ch)\nresult = ''\nwhile stack:\n    result += stack.pop()\nprint(result)\n",
  },
  {
    slug: "learn-m2-stack-queue-g2",
    title: "Postfix Expression Calculator",
    statement: `রফি প্রাইমএশিয়া ল্যাবের ছোট্ট ক্যালকুলেটরটা ঠিক করছে, যেটা শুধু postfix হিসাব বুঝে — অর্থাৎ অপারেটরগুলো সংখ্যার পরে থাকে, তাই কোনো বন্ধনী বা অগ্রাধিকারের চিন্তা লাগে না। তুমি সেই ক্যালকুলেটরের হৃদয় অংশটা লেখো।\n\nএক লাইনে একটা expression আসে: পূর্ণসংখ্যা আর অপারেটর (\`+\`, \`-\`, \`*\`) স্পেস দিয়ে আলাদা। নিয়ম: সংখ্যা এলে স্ট্যাকে রাখো, অপারেটর এলে স্ট্যাক থেকে শেষ দুটো সংখ্যা তুলে (প্রথমটা বাম পাশের) হিসাব করে ফলটা আবার স্ট্যাকে রাখো। শেষে স্ট্যাকে থাকা একটাই উত্তর।\n\nউদাহরণ: \`3 4 + 2 *\` মানে \`3 + 4 = 7\`, তারপর \`7 * 2 = 14\`।`,
    inputFormat: `এক লাইনে expression; টোকেনগুলো স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে হিসাবের ফল, একটা পূর্ণসংখ্যা।`,
    constraints: `1 <= টোকেন সংখ্যা <= 2000
প্রতিটি সংখ্যার টোকেন \`-1000 <= x <= 1000\`।
নিশ্চিত করা আছে যে কোনো ধাপে স্ট্যাকে একটার কম উপাদান থাকে না এবং প্রতিটি ফল \`-10^18\` থেকে \`10^18\`-এর মধ্যে থাকে।`,
    editorial: `## ধারণা
postfix হিসাবে কোনো বন্ধনী লাগে না, কারণ ক্রমটাই বলে দেয় কোনটা আগে হবে। স্ট্যাক এখানে "এখনো বাকি থাকা সংখ্যাগুলো" ধরে রাখে: সংখ্যা এলে ঢোকাও, অপারেটর এলে শেষ দুটো তুলে মোটামুটি ফল বসাও। মনে রাখবে যেটা আগে পপ হয় সেটা অপারেটরের ডান পাশের সংখ্যা, তার আগেরটা বাম পাশের — তাই \`a - b\`-এ \`a\` আগে তুলতে হয়।

## ধাপে ধাপে
1. লাইনটা ভাগ করে সব টোকেন এক তালিকায় নাও।
2. খালি \`stack = []\` দিয়ে শুরু করো।
3. প্রতিটি টোকেন যাচাই করো: অপারেটর কিনা।
4. সংখ্যা হলে \`stack.append(int(token))\`।
5. অপারেটর হলে \`b = stack.pop()\`, \`a = stack.pop()\` করে সঠিক হিসাব করে ফল ফিরিয়ে ঢোকাও।
6. শেষে \`stack[-1]\` ছাপাও।

\`\`\`python
import sys
tokens = sys.stdin.read().split()
stack = []
for token in tokens:
    if token in "+-*":
        b = stack.pop()
        a = stack.pop()
        if token == "+":
            stack.append(a + b)
        elif token == "-":
            stack.append(a - b)
        else:
            stack.append(a * b)
    else:
        stack.append(int(token))
print(stack[-1])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(t)\` যেখানে \`t\` টোকেন সংখ্যা — প্রতিটি টোকেন একবার দেখা হয়। মেমোরি \`O(t)\` (সবচেয়ে খারাপ ক্ষেত্রে অর্ধেক সংখ্যা স্ট্যাকে থাকে)।

## সাধারণ ভুল
- পপের ক্রম উল্টানো: \`b\` আর \`a\` বদলালে \`-\` আর \`/\`-এর উত্তর ভুল হয় (এখানে শুধু \`+\` ও \`*\` বলে ধরা টেস্টে ধরা পড়ে না, পরে ভাগ এলে সবচেয়ে আগে এটাই যাচাই করো)।
- একটা টোকেন হলেই অপারেটর ধরে ফেলা — শুরুতেই শুধু সংখ্যা থাকলে স্ট্যাকে সেটাই থেকে যায়, সেটাই উত্তর।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Stack", "Expression", "Implementation"],
    tests: [
      { input: "3 4 + 2 *\n", expectedOutput: "14\n", isSample: true },
      { input: "10 2 -\n", expectedOutput: "8\n", isSample: true },
      { input: "7\n", expectedOutput: "7\n", isSample: false },
      { input: "-4 5 +\n", expectedOutput: "1\n", isSample: false },
      { input: "2 3 + 4 *\n", expectedOutput: "20\n", isSample: false },
      { input: "5 12 + 4 * 3 -\n", expectedOutput: "65\n", isSample: false },
      { input: `1 1${" + 1".repeat(98)} +\n`, expectedOutput: "100\n", isSample: false },
    ],
    referencePython:
      "import sys\ntokens = sys.stdin.read().split()\nstack = []\nfor token in tokens:\n    if token in '+-*':\n        b = stack.pop()\n        a = stack.pop()\n        if token == '+':\n            stack.append(a + b)\n        elif token == '-':\n            stack.append(a - b)\n        else:\n            stack.append(a * b)\n    else:\n        stack.append(int(token))\nprint(stack[-1])\n",
  },
  {
    slug: "learn-m2-stack-queue-e1",
    title: "Typing with a Giant Backspace",
    statement: `তানভির হলের নোটিশ বোর্ডে টাইপ করছেন, কিন্তু তার কী-বোর্ডের ব্যাকস্পেস কীটা অনেক বড় — সে একবার চাপলেই সামনের অক্ষরটা মুছে যায়। তুমি লেখাটা শেষ হওয়ার পর বোর্ডে ঠিক কী থাকে সেটা বের করে ছাপাও।\n\nএক লাইনে একটা স্ট্রিং আসে: ছোট হাতের ইংরেজি অক্ষর আর \`#\`। \`#\` মানে ব্যাকস্পেস — সেটা এলে ঠিক আগের একটা অক্ষর মুছে যায়। আগের অক্ষর না থাকলে কিছুই হয় না।`,
    inputFormat: `এক লাইনে স্ট্রিং \`s\` (লাইনটি খালিও হতে পারে)।`,
    outputFormat: `এক লাইনে শেষে যা থাকে তা; কিছুই না থাকলে খালি লাইন।`,
    constraints: `0 <= len(s) <= 200000
শুধু ছোট হাতের ইংরেজি অক্ষর আর \`#\` থাকে।`,
    editorial: `## ধারণা
ব্যাকস্পেস মানে সবচেয়ে সাম্প্রতিক অক্ষরটা তোলা — ঠিক স্ট্যাকের \`pop\`। অক্ষরগুলো বাঁ থেকে ডানে ঢোকাতে থাকে, \`#\` এলে একটা করে বের হয়। শেষে স্ট্যাকে যা থাকে তাই বোর্ডের লেখা। খালি স্ট্যাকে \`pop\` ডাকা যায় না, তাই আগে চেক বাধ্যতামূলক।

## ধাপে ধাপে
1. পুরো লাইনটা পড়ে \`s\`-এ রাখো (\`rstrip\` করে শেষের নিউলাইন বাদ দাও)।
2. খালি \`stack = []\` নাও।
3. \`s\`-এর প্রতিটা অক্ষরের জন্য: \`#\` হলে স্ট্যাক খালি না হলে \`pop()\`, অন্যথায় অক্ষরটা \`append\` করো।
4. শেষে স্ট্যাকের অক্ষরগুলো একত্র করে ছাপাও।

\`\`\`python
import sys
s = sys.stdin.readline().rstrip("\\n")
stack = []
for ch in s:
    if ch == "#":
        if stack:
            stack.pop()
    else:
        stack.append(ch)
print("".join(stack))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটা অক্ষর সর্বোচ্চ একবার ঢোকে, একবার বের হয়। মেমোরি \`O(n)\`। মূলত দুটো সাইজের কাজ এক লুপেই শেষ, তাই লাইমাক্স \`n = 200000\`-ও সেকেন্ডের অনেক কমে চলে।

## সাধারণ ভুল
- খালি স্ট্যাকে \`pop()\` করে ক্র্যাশ: ইনপুট \`###\`-এ ধরা পড়ে। সবসময় \`if stack:\` দিয়ে চেক করো।
- \`s.split()\` বা \`strip()\` দিয়ে অক্ষর হারানো — মাঝের স্পেস বা বিশেষ চিহ্ন থাকলে কাজ ভাঙে; এখানে স্ট্রিংটা হুবহু যেমন আছে তেমনই ঘোরাও।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Stack", "String", "Simulation"],
    tests: [
      { input: "ab#cd\n", expectedOutput: "acd\n", isSample: true },
      { input: "a##b\n", expectedOutput: "b\n", isSample: true },
      { input: "abc\n", expectedOutput: "abc\n", isSample: false },
      { input: "a#bc#\n", expectedOutput: "b\n", isSample: false },
      { input: "#\n", expectedOutput: "", isSample: false },
      { input: "", expectedOutput: "", isSample: false },
      { input: "m".repeat(100000) + "#".repeat(99999) + "\n", expectedOutput: "m\n", isSample: false },
      { input: "q#".repeat(100000) + "\n", expectedOutput: "", isSample: false },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().rstrip('\\n')\nstack = []\nfor ch in s:\n    if ch == '#':\n        if stack:\n            stack.pop()\n    else:\n        stack.append(ch)\nprint(''.join(stack))\n",
  },
  {
    slug: "learn-m2-stack-queue-m1",
    title: "Next Greater Price Tag",
    statement: `নুসরাত ক্যাম্পাস বইমেলার স্টলে বইয়ের দামের ট্যাগ দেখছেন। তার মনে হয়, প্রতিটি বইয়ের জন্য জানা দরকার ডানপাশে সামনে কোন বইয়ের দাম এর চেয়ে বেশি, আর সেটা প্রথম কোনটা। যদি ডানে কোনোটাই বেশি না হয়, সে জায়গায় \`-1\` লেখা হবে।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — বাঁ থেকে ডানে সাজানো দাম। প্রতিটি জায়গার জন্য সেই জায়গা থেকে ডানে যে প্রথম মান \`a_i\`-এর চেয়ে বড়, সেটা বের করো।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    constraints: `1 <= n <= 200000
\`1 <= a_i <= 10^9\``,
    editorial: `## ধারণা
ডান দিকে ঘুরে সব জোড়া মিলিয়ে দেখলে \`O(n^2)\`, তাই \`n = 200000\`-এ টাইম আউট। এখানে কাজের হয় monotonic stack: যে মানগুলো এখনো ডানে কাউকে খুঁজে পায়নি, সেগুলো ক্রমানুসারে (কম থেকে বেশি) স্ট্যাকে রাখো। নতুন মান এলে স্ট্যাকের যারা এর চেয়ে ছোট, তাদের জন্য এটাই প্রথম বড় মান — এক এক করে বের করে উত্তর বসাও। প্রতিটি উপাদান সর্বোচ্চ একবার ঢোকে আর একবার বের হয়।

## ধাপে ধাপে
1. \`n\` আর তালিকাটা পড়ে নাও।
2. খালি \`stack = []\` (ইনডেক্স রাখবে) আর উত্তরের তালিকা \`ans\` দিয়ে শুরু করো।
3. বাঁ থেকে ডানে প্রতিটি ইনডেক্স \`i\`-এর জন্য: স্ট্যাকের উপরেরটার মান \`a_i\`-এর চেয়ে ছোট হলে সে জায়গার উত্তর \`a_i\`, তাই \`pop\` করে উত্তর বসাও।
4. পপ করা বন্ধ হলে \`i\` স্ট্যাকে ঢোকাও।
5. শেষেও স্ট্যাকে যাদের কোনো উত্তর পাওয়া যায়নি তাদের জন্য \`-1\` বসাও এবং উত্তরগুলো ক্রম মিলিয়ে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:]
stack = []
ans = [0] * n
for i in range(n):
    while stack and a[stack[-1]] < a[i]:
        ans[stack.pop()] = a[i]
    stack.append(i)
for i in stack:
    ans[i] = -1
print(*ans)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি ইনডেক্স সর্বোচ্চ একবার push আর একবার pop হয়। মেমোরি \`O(n)\` (স্ট্যাক ও উত্তর)।

## সাধারণ ভুল
- পপের শর্ত \`a[stack[-1]] <= a[i]\` লিখলে সমান মানও উত্তর পেয়ে যায় — চাইলে "কঠোরভাবে বড়" হওয়া বাধা ভাঙে; টেস্টে \`5 5 5 5\` ধরা পড়ে।
- উত্তরগুলো ইনপুটের ক্রমে না বসিয়ে পপের ক্রমে ছাপা — ভুল ফরম্যাট।
- শেষ লুপে স্ট্যাকে যাদের উত্তর মেলেনি তাদের \`-1\` না দিয়ে সেখানে \`0\` থেকে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Stack", "Monotonic Stack", "Arrays"],
    tests: [
      { input: "5\n10 4 5 2 9\n", expectedOutput: "-1 5 9 9 -1\n", isSample: true },
      { input: "3\n3 2 1\n", expectedOutput: "-1 -1 -1\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "-1\n", isSample: false },
      { input: "4\n1 2 3 4\n", expectedOutput: "2 3 4 -1\n", isSample: false },
      { input: "4\n5 5 5 5\n", expectedOutput: "-1 -1 -1 -1\n", isSample: false },
      { input: "6\n2 1 2 3 1 4\n", expectedOutput: "3 2 3 4 4 -1\n", isSample: false },
      { input: nAndNumbers(200000, Array.from({ length: 200000 }, (_, i) => 200000 - i)), expectedOutput: spaceOutput(Array(200000).fill(-1)), isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nstack = []\nans = [0] * n\nfor i in range(n):\n    while stack and a[stack[-1]] < a[i]:\n        ans[stack.pop()] = a[i]\n    stack.append(i)\nfor i in stack:\n    ans[i] = -1\nprint(*ans)\n",
  },
  {
    slug: "learn-m2-stack-queue-h1",
    title: "Largest Rectangle in the Hall",
    statement: `প্রাইমএশিয়ার নতুন লাইব্রেরি হলের সামনে সারি সারি কলাম দাঁড়ানো, প্রতিটির উচ্চতা আলাদা আলাদা। স্থপতি বলেছেন হলের মাঝখানে একটা বড় ফাঁকা আয়তক্ষেত্র বানাতে হবে — কোন একটা নির্দিষ্ট উচ্চতায় পাশাপাশি যত কলাম মিলিয়ে চওড়া জায়গা পাওয়া যায়, সেটার ক্ষেত্রফল = উচ্চতা × চওড়া। এই সম্ভাব্য সব আয়তের মধ্যে সর্বোচ্চ ক্ষেত্রফল কত, সেটা বের করো।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — বাঁ থেকে ডানে কলামগুলোর উচ্চতা।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — উচ্চতা।`,
    outputFormat: `এক লাইনে সর্বোচ্চ ক্ষেত্রফল, একটা পূর্ণসংখ্যা।`,
    constraints: `1 <= n <= 200000
\`0 <= h_i <= 10^9\``,
    editorial: `## ধারণা
প্রতিটি কলামকে ধরো একটা সম্ভাব্য উচ্চতা: তার সাথে পাশাপাশি যতগুলো কলাম তার চেয়ে উঁচু বা সমান, সেগুলো মিলিয়ে যে চওড়া জায়গা পাওয়া যায়, ক্ষেত্রফল = ওই উচ্চতা × সেই চওড়া। সমস্যাটা হলো প্রতিটি জায়গার জন্য বাম আর ডানে প্রথম যে কলাম ছোট সেটা খুঁজে বের করা। monotonic (ক্রমানুসার বড়) স্ট্যাক দিয়ে এক লুপেই হয়: স্ট্যাকের উপরেরটা ছোট হলে মানে ডান পাশে তার চেয়ে ছোট কেউ এসে গেছে, তাই ওই কলামের সম্ভাব্য চওড়া নির্ধারিত হয়ে গেছে।

## ধাপে ধাপে
1. \`n\` আর উচ্চতাগুলো পড়ে নাও।
2. খালি \`stack = []\` (ইনডেক্স রাখবে) আর \`best = 0\` নাও।
3. \`i = 0\` থেকে \`n\` পর্যন্ত ঘোরো; \`i == n\` হলে বাকি সবের জন্য উচ্চতা \`0\` ধরে নাও (সেন্টিনেল)।
4. বর্তমান উচ্চতা স্ট্যাকের উপরেরটা থেকে ছোট হলে উপরেরটা \`pop\` করো; তার উচ্চতা × (\`i\` থেকে বাম পাশের সীমা বাদ দিয়ে পাওয়া চওড়া) দিয়ে \`best\` হালনাগাদ করো।
5. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
h = data[1:]
stack = []
best = 0
for i in range(n + 1):
    cur = h[i] if i < n else 0
    while stack and h[stack[-1]] > cur:
        height = h[stack.pop()]
        left = stack[-1] if stack else -1
        width = i - left - 1
        area = height * width
        if area > best:
            best = area
    stack.append(i)
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি ইনডেক্স সর্বোচ্চ একবার ঢোকে আর একবার বের হয়। মেমোরি \`O(n)\`। উচ্চতা \`10^9\` আর \`n = 200000\` হলে ক্ষেত্রফল \`2 \times 10^{14}\` পর্যন্ত যায়, তাই Python-এর বড় সংখ্যা বা C++-এর \`long long\` লাগবে।

## সাধারণ ভুল
- চওড়া হিসাবে \`i - left\` লিখে \`i - left - 1\` ভুল করা — সীমার কলামটা দুইবার গোনা হয় বা একটা বাদ পড়ে।
- লুপ শেষে স্ট্যাকে যারা আটকে আছে তাদের হিসাব না করা — সেন্টিনেল (\`cur = 0\`) ছাড়া শেষ কয়েকটা কলামের উত্তর বাদ পড়ে।
- \`>=\` দিয়ে পপ করলে সমান উচ্চতার কলাম একসাথে ভাঙে যায়, ফলে চওড়া কমে যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Stack", "Monotonic Stack", "Histogram"],
    tests: [
      { input: "5\n3 1 4 2 5\n", expectedOutput: "6\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: true },
      { input: "4\n1 1 1 1\n", expectedOutput: "4\n", isSample: false },
      { input: "3\n5 4 3\n", expectedOutput: "9\n", isSample: false },
      { input: "3\n0 2 0\n", expectedOutput: "2\n", isSample: false },
      { input: "6\n2 4 4 4 2 1\n", expectedOutput: "12\n", isSample: false },
      { input: nAndNumbers(200000, Array(200000).fill(1)), expectedOutput: "200000\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nh = data[1:]\nstack = []\nbest = 0\nfor i in range(n + 1):\n    cur = h[i] if i < n else 0\n    while stack and h[stack[-1]] > cur:\n        height = h[stack.pop()]\n        left = stack[-1] if stack else -1\n        width = i - left - 1\n        area = height * width\n        if area > best:\n            best = area\n    stack.append(i)\nprint(best)\n",
  },
  {
    slug: "learn-m2-stack-queue-x1",
    title: "Campus Scoreboard Operations",
    statement: `কোডিং ক্লাবের স্কোরবোর্ডে তানভির একটা অদ্ভুত নিয়ম চালাচ্ছেন: স্কোর স্ট্যাকে জমা থাকে, আর তিনটা বোতাম আছে। \`+\` চাপলে শেষ দুটো স্কোর যোগ করে তার ফল একটা নতুন স্কোর হিসেবে শেষে বসে (আগের দুটো তারই থেকে যায়), \`D\` চাপলে শেষ স্কোর দ্বিগুণ করে আরেকটা নতুন স্কোর যোগ হয়, আর \`C\` চাপলে শেষ স্কোরটা বাতিল হয়ে যায়। কখনো কখনো সরাসরি একটা পূর্ণসংখ্যাও যোগ হয়। দিনশেষে বোর্ডে যা থাকে তার যোগফল কত বলো।\n\nপ্রথম লাইনে \`n\` — মোট \`n\`টি অপারেশন। পরের \`n\` লাইনে প্রতিটিতে একটা জিনিস: একটা পূর্ণসংখ্যা (স্ট্যাকে যোগ), অথবা \`+\`, \`D\`, \`C\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
পরের \`n\` লাইনে প্রতিটিতে একটা পূর্ণসংখ্যা বা \`+\` / \`D\` / \`C\`।`,
    outputFormat: `এক লাইনে শেষে স্ট্যাকে যা থাকে তার যোগফল; স্ট্যাক খালি হলে \`0\`।`,
    constraints: `1 <= n <= 200000
নিশ্চিত করা আছে \`C\` চাপলে স্ট্যাকে কমপক্ষে একটা উপাদান থাকে, \`D\` বা \`+\` চাপলে যথাক্রমে একটা ও দুটো উপাদান থাকে, এবং প্রতিটি ধাপে মান \`-10^18\` থেকে \`10^18\`-এর মধ্যে থাকে।`,
    editorial: `## ধারণা
নিয়মগুলো ঠিক স্ট্যাকের মতো: যোগ হয় শেষে, বাতিল হয়ও শেষ থেকে। একটা মাত্র জিনিস মনে রাখলেই হয় — \`+\` আর \`D\` শুধু \`append\`, \`C\` শুধু \`pop\`, সংখ্যা এলেও \`append\`। শেষে বাকি সবের যোগফল বের করলেই উত্তর।

## ধাপে ধাপে
1. \`n\` পড়ে পরের \`n\` লাইন এক তালিকায় নাও।
2. খালি \`stack = []\` দিয়ে শুরু করো।
3. প্রতিটি টোকেন যাচাই করো: \`C\` হলে \`stack.pop()\`, \`D\` হলে \`stack.append(stack[-1] * 2)\`, \`+\` হলে \`stack.append(stack[-1] + stack[-2])\`, নাহলে সংখ্যাটা \`append\`।
4. শেষে \`sum(stack)\` ছাপাও (খালি হলে Python-এ \`sum([])\` নিজেই \`0\`)।

\`\`\`python
import sys
lines = sys.stdin.read().splitlines()
n = int(lines[0])
stack = []
for i in range(1, n + 1):
    token = lines[i]
    if token == "C":
        stack.pop()
    elif token == "D":
        stack.append(stack[-1] * 2)
    elif token == "+":
        stack.append(stack[-1] + stack[-2])
    else:
        stack.append(int(token))
print(sum(stack))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি অপারেশন \`O(1)\`; শেষের \`sum\` আরও সর্বোচ্চ \`O(n)\`। মেমোরি \`O(n)\`। Python-এর \`sum\` বড় সংখ্যাও নিরাপদে যোগ করে।

## সাধারণ ভুল
- \`+\`-এ পপ করা মানগুলো ফিরিয়ে ঢোকাতে ভুলে যাওয়া — স্ট্যাক থেকে সরানোর দরকার নেই, শুধু পড়ে যোগ করলেই হয়।
- \`stack[-1] + stack[-2]\` লেখার সময় ইনডেক্স উল্টানো, বা খালি স্ট্যাকে \`pop()\` — ছোট ইনপুটে ধরা পড়ে না; নিশ্চয়তা থাকলেও প্রথমেই চেক করে অভ্যাস রাখো।
- \`n\` লাইন না পড়ে পুরো ফাইল ঘোরানো — ফাইলে অতিরিক্ত খালি লাইন থাকলে টোকেন মিলিয়ে যায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Stack", "Simulation", "Implementation"],
    tests: [
      { input: "6\n5\n3\n+\nD\nC\n+\n", expectedOutput: "27\n", isSample: true },
      { input: "4\n4\nD\nC\n2\n", expectedOutput: "6\n", isSample: true },
      { input: "2\n10\nC\n", expectedOutput: "0\n", isSample: false },
      { input: "3\n7\nD\nD\n", expectedOutput: "49\n", isSample: false },
      { input: "5\n1\n2\n+\n3\n+\n", expectedOutput: "15\n", isSample: false },
      { input: "8\n2\n2\n+\nD\nC\nC\nC\n5\n", expectedOutput: "7\n", isSample: false },
      { input: lineInput(Array(200000).fill("1")), expectedOutput: "200000\n", isSample: false },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\nstack = []\nfor i in range(1, n + 1):\n    token = lines[i]\n    if token == 'C':\n        stack.pop()\n    elif token == 'D':\n        stack.append(stack[-1] * 2)\n    elif token == '+':\n        stack.append(stack[-1] + stack[-2])\n    else:\n        stack.append(int(token))\nprint(sum(stack))\n",
  },
  {
    slug: "learn-m2-stack-queue-x2",
    title: "Circular Seat Lottery",
    statement: `হলের বার্ষিক লটারিতে \`n\` জন ছাত্র \`1\` থেকে \`n\` নম্বর দিয়ে বৃত্তাকারে দাঁড়িয়েছে। প্রথম ছাত্র থেকে গোনা শুরু হয়: \`1, 2, ..., k\` — \`k\` নম্বর ছাত্র একটা বাদ পড়ে বাইরে চলে যায়। এরপর ঠিক পরের ছাত্র থেকে আবার \`1\` থেকে গোনা শুরু হয়। এভাবে শেষে একজনই থাকে — সে জিতে। জেতার ছাত্রের নম্বর বলো।\n\nএক লাইনে দুটি পূর্ণসংখ্যা \`n\` আর \`k\`।`,
    inputFormat: `এক লাইনে দুটি পূর্ণসংখ্যা \`n\` আর \`k\`।`,
    outputFormat: `এক লাইনে জেতার নম্বর।`,
    constraints: `1 <= n <= 1000
\`1 <= k <= 1000\``,
    editorial: `## ধারণা
বৃত্তাকার লাইন ধরে রাখার সবচেয়ে সহজ উপায় হলো কিউ: সামনেরটা সরিয়ে পরে যোগ করে দিলে সারি ঘুরে যায়, অর্থাৎ ক্রম অবিচ্ছিন্ন থাকে। প্রতি ধাপে \`k - 1\` জনকে শেষে পাঠিয়ে (ঘুরিয়ে) \`k\` তমজনকে সরিয়ে ফেলা যায়। শেষে একজন থাকা পর্যন্ত এটাই চালিয়ে যাওয়া যায়। ছোট \`n\`-এর জন্য এই সিমুলেশনই যথেষ্ট; বড় \`n\`-এ এটা \`O(nk)\` হয়ে যায়, তখন Josephus সূত্র বা দ্বিতীয় কৌশল লাগে।

## ধাপে ধাপে
1. \`n\` আর \`k\` পড়ে নাও।
2. \`deque\`-এ \`1\` থেকে \`n\` পর্যন্ত সব নম্বর ঢোকাও।
3. যতক্ষণ একের বেশি নম্বর আছে: \`k - 1\` বার \`popleft()\` করে সঙ্গে সঙ্গে \`append()\` করো (ঘোরানো), তারপর একটা \`popleft()\` করে বাদ দাও।
4. বাকি একটা নম্বর ছাপাও।

\`\`\`python
import sys
from collections import deque
n, k = map(int, sys.stdin.readline().split())
people = deque(range(1, n + 1))
while len(people) > 1:
    for _ in range(k - 1):
        people.append(people.popleft())
    people.popleft()
print(people[0])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(nk)\` — প্রতিটি ধাপে সর্বোচ্চ \`k\` আন্দোলন, মোট \`n - 1\` ধাপ। এখানে \`n, k <= 1000\` বলে সর্বোচ্চ \`10^6\` আন্দোলন, যা Python-এও সহজে চলে। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`k\` বার সরানোর বদলে \`k - 1\` বার সরিয়ে \`k\` তমজনকে সরানো ভুল হয় — এক ঘর বেশি বাদ পড়ে, উদাহরণ \`n = 5, k = 2\`-এ উত্তর \`2\` নয়, \`3\`।
- \`k > n\` হলে পুরোটা এক চক্রে ঘোরানো বাদ দিয়ে \`k % len(people)\` করে না দিলেও ঠিক থাকে, কারণ লুপই ক্রম ঠিক রাখে — তবু সরাসরি \`for\` লুপে ঘোরানোই নিরাপদ।
- লিস্ট দিয়ে \`pop(0)\` করা — \`O(n)\` প্রতি ধাপে, \`deque\` নিলে \`O(1)\`।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Queue", "Simulation", "Josephus"],
    tests: [
      { input: "5 2\n", expectedOutput: "3\n", isSample: true },
      { input: "1 7\n", expectedOutput: "1\n", isSample: true },
      { input: "5 1\n", expectedOutput: "5\n", isSample: false },
      { input: "4 3\n", expectedOutput: "1\n", isSample: false },
      { input: "10 2\n", expectedOutput: "5\n", isSample: false },
      { input: "1000 1\n", expectedOutput: "1000\n", isSample: false },
      { input: "1000 1000\n", expectedOutput: "609\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import deque\nn, k = map(int, sys.stdin.readline().split())\npeople = deque(range(1, n + 1))\nwhile len(people) > 1:\n    for _ in range(k - 1):\n        people.append(people.popleft())\n    people.popleft()\nprint(people[0])\n",
  },
];
