import type { SeedProblem } from "../../seed-problems";

export const STACK_QUEUE_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-stack-queue-e2",
    title: "Balanced Bracket Check",
    statement: `ক্লাবের ফর্ম ফিলাপের নিয়ম মেনে রফি এক লাইনের ব্র্যাকেট-অভিব্যক্তি যাচাই করছে। শুধু তিন জোড়া ব্র্যাকেট আছে: \`()\`, \`[]\`, \`{}\`। প্রতিটি খোলা ব্র্যাকেটের জন্য ঠিক একই ধরনের একটা বন্ধ ব্র্যাকেট থাকতে হবে, আর সেগুলো সঠিক ক্রমে বন্ধ হতে হবে।

লাইনটি বৈধ হলে \`YES\`, নাহলে \`NO\` ছাপো।`,
    inputFormat: `এক লাইনে শুধু ব্র্যাকেটের একটি স্ট্রিং।`,
    outputFormat: `\`YES\` অথবা \`NO\`।`,
    constraints: `\`1 <= len(s) <= 100000\`
স্ট্রিংয়ে শুধু \`(\`, \`)\`, \`[\`, \`]\`, \`{\`, \`}\` থাকে।`,
    editorial: `## ধারণা
স্ট্যাকে শুধু এখনো না-বন্ধ হওয়া খোলা ব্র্যাকেটগুলো রাখো। বন্ধ ব্র্যাকেট এলে স্ট্যাকের উপরের ব্র্যাকেটটা তার জোড়া কি না দেখো। জোড়া না মিললে বা স্ট্যাক খালি হলে লাইনটা বৈধ নয়। শেষে স্ট্যাক খালি থাকলে সব ব্র্যাকেট মিলেছে।

## ধাপে ধাপে
1. খালি \`stack\` নাও।
2. প্রতিটি অক্ষরে: খোলা হলে \`push\` করো।
3. বন্ধ হলে স্ট্যাক খালি কি না দেখো; খালি হলে \`NO\`। নাহলে \`pop\` করে জোড়া মিলাও।
4. লুপ শেষে স্ট্যাক খালি হলে \`YES\`, নাহলে \`NO\`।

\`\`\`python
import sys
s = sys.stdin.readline().strip()
pairs = {')': '(', ']': '[', '}': '{'}
stack = []
for ch in s:
    if ch in '([{':
        stack.append(ch)
    elif not stack or stack.pop() != pairs[ch]:
        print('NO')
        break
else:
    print('YES' if not stack else 'NO')
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি অক্ষর একবার স্ট্যাকে ঢোকে বা বের হয়।

## সাধারণ ভুল
- শুধু মোট খোলা আর বন্ধের সংখ্যা গুনে ফেলা: \`([)]\`-এ সংখ্যা সমান, কিন্তু ক্রম ভুল।
- বন্ধ ব্র্যাকেটের সময় স্ট্যাক খালি কি না না দেখা: খালি স্ট্যাকে \`pop\` করলে ক্র্যাশ করে।
- লুপ শেষে স্ট্যাক পরীক্ষা না করা: \`((\`-এ কোনো বন্ধ ব্র্যাকেটই আসেনি, তবু উত্তর \`NO\` হওয়া উচিত।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Stack", "String"],
    tests: [
      { input: "([]{})\n", expectedOutput: "YES\n", isSample: true },
      { input: "(]\n", expectedOutput: "NO\n", isSample: true },
      { input: "(\n", expectedOutput: "NO\n", isSample: false },
      { input: "([{}])\n", expectedOutput: "YES\n", isSample: false },
      { input: "([)]\n", expectedOutput: "NO\n", isSample: false },
      { input: "()".repeat(50000) + "\n", expectedOutput: "YES\n", isSample: false },
      { input: "(".repeat(100000) + "\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\npairs = {')': '(', ']': '[', '}': '{'}\nstack = []\nfor ch in s:\n    if ch in '([{':\n        stack.append(ch)\n    elif not stack or stack.pop() != pairs[ch]:\n        print('NO')\n        break\nelse:\n    print('YES' if not stack else 'NO')\n",
  },
  {
    slug: "learn-m2-stack-queue-e3",
    title: "Circle Game Survivor",
    statement: `ক্লাবের মাঠে \`n\` জন সদস্য বৃত্তে দাঁড়িয়ে আছে, ১ থেকে \`n\` পর্যন্ত নম্বরযুক্ত। নম্বর \`1\` থেকে গোনা শুরু হয়; প্রতি ধাপে \`k\`-তম সদস্য বৃত্ত থেকে বাদ পড়ে, আর গোনা পরের সদস্য থেকে আবার শুরু হয়। শেষে একজন বাকি থাকে।

সেই শেষ সদস্যের নম্বর বের করো।`,
    inputFormat: `এক লাইনে \`n\` আর \`k\`।`,
    outputFormat: `শেষে টিকে থাকা সদস্যের নম্বর।`,
    constraints: `\`1 <= n <= 100000\`
\`1 <= k <= 10^9\``,
    editorial: `## ধারণা
প্রথমে সরাসরি \`deque\` দিয়ে সিমুলেশন করা যায়, কিন্তু \`n = 100000\` আর বড় \`k\`-তে প্রতিটি গোনা আলাদা করা ধীর। গাণিতিক পুনরাবৃত্তি ব্যবহার করো: \`J(1) = 0\` (শূন্য-ভিত্তিক), আর \`J(i) = (J(i-1) + k) % i\`। এখানে \`J(i)\` মানে \`i\` জনের বৃত্তে টিকে থাকা ব্যক্তির শূন্য-ভিত্তিক অবস্থান। শেষে \`1\` যোগ করলে এক-ভিত্তিক নম্বর পাওয়া যায়।

## ধাপে ধাপে
1. \`n\` আর \`k\` পড়ো।
2. \`pos = 0\` দিয়ে শুরু করো (একজনের বৃত্ত)।
3. \`i = 2\` থেকে \`n\` পর্যন্ত \`pos = (pos + k) % i\`।
4. \`pos + 1\` ছাপো।

\`\`\`python
import sys
n, k = map(int, sys.stdin.readline().split())
pos = 0
for i in range(2, n + 1):
    pos = (pos + k) % i
print(pos + 1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, অতিরিক্ত স্পেস \`O(1)\` — প্রতিটি বৃত্তের আকার একবার হিসাব হয়।

## সাধারণ ভুল
- শূন্য-ভিত্তিক ফল সরাসরি ছাপা: শেষে \`+1\` না করলে এক ধাপ পিছিয়ে যাবে।
- প্রতি ধাপে আলাদা করে \`k\` বার গোনা: \`k\` বড় হলে অনেক ধীর, অথচ মডুলো একবারেই কাজটা করে।
- \`n = 1\`-এ লুপ না চলায় \`pos = 0\` থাকে — উত্তর \`1\`, এটা ঠিকই আছে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Queue", "Math", "Simulation"],
    tests: [
      { input: "5 2\n", expectedOutput: "3\n", isSample: true },
      { input: "6 3\n", expectedOutput: "1\n", isSample: true },
      { input: "1 7\n", expectedOutput: "1\n", isSample: false },
      { input: "10 4\n", expectedOutput: "5\n", isSample: false },
      { input: "7 1\n", expectedOutput: "7\n", isSample: false },
      { input: "100000 2\n", expectedOutput: "68929\n", isSample: false },
    ],
    referencePython:
      "import sys\nn, k = map(int, sys.stdin.readline().split())\npos = 0\nfor i in range(2, n + 1):\n    pos = (pos + k) % i\nprint(pos + 1)\n",
  },
  {
    slug: "learn-m2-stack-queue-m2",
    title: "Stock Span Streak",
    statement: `বাজারে প্রতিদিন একটা পণ্যের দাম বদলায়। কোনো দিনের **স্প্যান** হলো সেই দিনসহ পেছনের পরপর কত দিনের দাম আজকের দামের চেয়ে ছোট বা সমান ছিল। দাম আজকের চেয়ে বেশি দেখা গেলেই থামতে হবে।

প্রতিটি দিনের স্প্যান বের করো।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি দাম।`,
    outputFormat: `প্রতিটি দিনের স্প্যান এক লাইনে স্পেস দিয়ে আলাদা করে ছাপো।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= price_i <= 10^9\``,
    editorial: `## ধারণা
প্রতিটি দিনে পেছনের দিকে হেঁটে গুনলে \`O(n^2)\` লাগে। পরিবর্তে এমন একটা স্ট্যাক রাখো যেখানে দাম **হ্রাসমান** ক্রমে থাকে (নিচে বড়, উপরে ছোট), সঙ্গে সূচি। আজকের দাম \`p\` এলে যত উপরের দাম \`p\`-এর চেয়ে ছোট বা সমান, তাদের সরিয়ে দাও — তারা আজকের স্প্যানে ঢুকে যাবে। সরানোর পর স্ট্যাকের উপরের সূচি \`j\` হলে আজকের স্প্যান \`i - j\`; স্ট্যাক খালি হলে \`i + 1\` (শুরু থেকে আজ পর্যন্ত)।

## ধাপে ধাপে
1. \`n\` আর দাম পড়ো।
2. খালি স্ট্যাক \`st\` নাও (সূচি রাখবে)।
3. প্রতিটি \`i\`-তে: \`while st and price[st[-1]] <= price[i]: st.pop()\`।
4. \`span = i + 1 if not st else i - st[-1]\`; স্ট্যাকে \`i\` ঢোকাও।
5. সব স্প্যান স্পেস দিয়ে ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
price = data[1:1 + n]
st = []
span = []
for i in range(n):
    while st and price[st[-1]] <= price[i]:
        st.pop()
    span.append(i + 1 if not st else i - st[-1])
    st.append(i)
print(' '.join(map(str, span)))
\`\`\`

## কমপ্লেক্সিটি
প্রতিটি সূচি স্ট্যাকে একবার ঢোকে আর একবার বের হয়, তাই সময় \`O(n)\`; স্পেস \`O(n)\`।

## সাধারণ ভুল
- \`<\` আর \`<=\` গুলিয়ে ফেলা: সমান দামও স্প্যানে গোনা হয়, তাই \`<=\` লাগবে।
- স্ট্যাকে দাম রাখা কিন্তু সূচি না রাখা: স্প্যানের দৈর্ঘ্য হিসাব করতে সূচিই দরকার।
- প্রতিটি দিনে পেছনে লুপ চালানো: ছোট ইনপুটে ঠিক দেখালেও বড় ইনপুটে সময় শেষ।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Stack", "Monotonic Stack", "Arrays"],
    tests: [
      { input: "5\n100 80 60 70 60\n", expectedOutput: "1 1 1 2 1\n", isSample: true },
      { input: "7\n100 80 60 70 60 75 85\n", expectedOutput: "1 1 1 2 1 4 6\n", isSample: true },
      { input: "1\n50\n", expectedOutput: "1\n", isSample: false },
      { input: "6\n10 20 30 40 50 60\n", expectedOutput: "1 2 3 4 5 6\n", isSample: false },
      { input: "6\n60 50 40 30 20 10\n", expectedOutput: "1 1 1 1 1 1\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nprice = data[1:1 + n]\nst = []\nspan = []\nfor i in range(n):\n    while st and price[st[-1]] <= price[i]:\n        st.pop()\n    span.append(i + 1 if not st else i - st[-1])\n    st.append(i)\nprint(' '.join(map(str, span)))\n",
  },
  {
    slug: "learn-m2-stack-queue-m3",
    title: "Window Maximum Board",
    statement: `সাদিয়া প্রতিটি \`k\` দিনের ব্লকে সর্বোচ্চ তাপমাত্রাটা ডায়েরিতে লিখে রাখতে চায়। \`n\` দিনের তাপমাত্রা দেওয়া আছে; প্রতিটি পরপর \`k\` দিনের জানালায় সর্বোচ্চ মান বের করো।

জানালাগুলো এক ধাপ করে এগোয়: প্রথম জানালা \`1..k\`, শেষ জানালা \`n-k+1..n\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি তাপমাত্রা।`,
    outputFormat: `প্রতিটি জানালার সর্বোচ্চ মান এক লাইনে স্পেস দিয়ে আলাদা করে ছাপো।`,
    constraints: `\`1 <= k <= n <= 200000\`
\`-10^9 <= temp_i <= 10^9\``,
    editorial: `## ধারণা
প্রতিটি জানালায় আলাদা করে সর্বোচ্চ খুঁজলে \`O(nk)\` লাগে। \`deque\`-এ সূচিগুলো এমনভাবে রাখো যাতে তাদের মান **হ্রাসমান** থাকে — সামনে সবচেয়ে বড়। নতুন মান এলে পেছন থেকে যত ছোট বা সমান মান আছে সরাও; তারা আর কখনো এই জানালার সর্বোচ্চ হতে পারবে না। তারপর জানালার বাইরে চলে যাওয়া সূচি সামনে থেকে সরাও। প্রতিটি ধাপে সামনের সূচিই জানালার সর্বোচ্চ।

## ধাপে ধাপে
1. \`n\`, \`k\` আর অ্যারে পড়ো।
2. খালি \`deque\` নাও (সূচি রাখবে)।
3. প্রতিটি \`i\`-তে: পেছন থেকে ছোট/সমান মানের সূচি সরাও; \`i\` ঢোকাও।
4. সামনের সূচি \`i - k\`-এর চেয়ে ছোট হলে সরাও।
5. \`i >= k - 1\` হলে সামনের সূচির মান উত্তরে যোগ করো।

\`\`\`python
import sys
from collections import deque
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:2 + n]
dq = deque()
out = []
for i in range(n):
    while dq and a[dq[-1]] <= a[i]:
        dq.pop()
    dq.append(i)
    if dq[0] <= i - k:
        dq.popleft()
    if i >= k - 1:
        out.append(a[dq[0]])
print(' '.join(map(str, out)))
\`\`\`

## কমপ্লেক্সিটি
প্রতিটি সূচি deque-এ একবার ঢোকে, একবার বের হয়; সময় \`O(n)\`, স্পেস \`O(k)\`।

## সাধারণ ভুল
- প্রতিটি জানালায় \`max()\` চালানো: সহজ কিন্তু \`O(nk)\`, বড় ইনপুটে ধীর।
- বাইরে যাওয়া সূচি না সরানো: পুরনো বড় মান ভুলভাবে উত্তর দিতে থাকে।
- \`deque\`-এ মান রাখা আর সূচি না রাখা: কোন মান কোন জানালার, তা আর বোঝা যায় না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Queue", "Deque", "Sliding Window"],
    tests: [
      { input: "8 3\n1 3 -1 -3 5 3 6 7\n", expectedOutput: "3 3 5 5 6 7\n", isSample: true },
      { input: "5 1\n4 2 9 1 5\n", expectedOutput: "4 2 9 1 5\n", isSample: true },
      { input: "1 1\n-7\n", expectedOutput: "-7\n", isSample: false },
      { input: "6 6\n1 2 3 4 5 6\n", expectedOutput: "6\n", isSample: false },
      { input: "8 2\n9 8 7 6 5 4 3 2\n", expectedOutput: "9 8 7 6 5 4 3\n", isSample: false },
      {
        input: `200000 1000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 199001 }, (_, i) => i + 1000).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:2 + n]\ndq = deque()\nout = []\nfor i in range(n):\n    while dq and a[dq[-1]] <= a[i]:\n        dq.pop()\n    dq.append(i)\n    if dq[0] <= i - k:\n        dq.popleft()\n    if i >= k - 1:\n        out.append(a[dq[0]])\nprint(' '.join(map(str, out)))\n",
  },
  {
    slug: "learn-m2-stack-queue-h2",
    title: "Rainwater Between Towers",
    statement: `রফি ক্যাম্পাসের ছাদে এক সারি সমান প্রস্থের টাওয়ার দেখল, প্রতিটির উচ্চতা আলাদা। বৃষ্টির পানি টাওয়ারগুলোর ফাঁকে জমা হয়; কোনো ফাঁকে পানি তখনই থাকে যখন দুই পাশে তার চেয়ে উঁচু টাওয়ার আছে। টাওয়ারের উপরে পানি জমে না।

সব ফাঁকে মোট কত একক পানি জমা হবে, সেটা বের করো।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি উচ্চতা।`,
    outputFormat: `জমা পানির মোট পরিমাণ এক লাইনে ছাপো।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= height_i <= 10^9\``,
    editorial: `## ধারণা
কোনো অবস্থান \`i\`-তে পানির উচ্চতা \`min(বাম দিকের সর্বোচ্চ, ডান দিকের সর্বোচ্চ) - height[i]\`। প্রতিটি অবস্থানের জন্য দুই দিকের সর্বোচ্চ আলাদা করে বের করলে \`O(n)\` স্পেসে সহজ হয়, কিন্তু দুই পয়েন্টার দিয়ে \`O(1)\` অতিরিক্ত স্পেসেই কাজ হয়।

বাম পয়েন্টার \`l\`, ডান পয়েন্টার \`r\`; \`leftMax\`, \`rightMax\` রাখো। যেদিকে ছোট সর্বোচ্চ, সেদিকের সিদ্ধান্ত এখনই নেওয়া নিরাপদ: যদি \`leftMax < rightMax\`, তবে \`l\`-এর ডান পাশে অন্তত \`rightMax\` উঁচু কিছু আছে, তাই \`l\`-এ পানি \`leftMax - height[l]\`। তারপর \`l\` এগোও। উল্টো দিকেও একই।

## ধাপে ধাপে
1. \`n\` আর উচ্চতা পড়ো; \`l = 0\`, \`r = n - 1\`, \`leftMax = rightMax = 0\`, \`water = 0\`।
2. \`l <= r\` পর্যন্ত: \`leftMax < rightMax\` হলে \`leftMax = max(leftMax, height[l])\`; \`water += leftMax - height[l]\`; \`l += 1\`।
3. নাহলে \`rightMax = max(rightMax, height[r])\`; \`water += rightMax - height[r]\`; \`r -= 1\`।
4. \`water\` ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
h = data[1:1 + n]
l, r = 0, n - 1
left_max = right_max = 0
water = 0
while l <= r:
    if left_max < right_max:
        left_max = max(left_max, h[l])
        water += left_max - h[l]
        l += 1
    else:
        right_max = max(right_max, h[r])
        water += right_max - h[r]
        r -= 1
print(water)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, অতিরিক্ত স্পেস \`O(1)\` — প্রতিটি টাওয়ার একবারই দেখা হয়।

## সাধারণ ভুল
- শুধু দুই প্রান্তের সর্বোচ্চ দিয়ে হিসাব: মাঝের উঁচু টাওয়ার পানির স্তর বাড়িয়ে দেয়, সেটাও হিসাবে নিতে হবে।
- \`leftMax\` বা \`rightMax\` আপডেট করার আগে পানি যোগ করা: আগে সর্বোচ্চ হালনাগাদ করো, তারপর পার্থক্য নাও।
- সমান উচ্চতায় শাখা ভুল করা: কোনো দিকই ক্ষতি করে না, একটি শাখা বেছে নিলেই হয়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Stack", "Arrays"],
    tests: [
      { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1\n", expectedOutput: "6\n", isSample: true },
      { input: "6\n4 2 0 3 2 5\n", expectedOutput: "9\n", isSample: true },
      { input: "3\n1 2 3\n", expectedOutput: "0\n", isSample: false },
      { input: "1\n5\n", expectedOutput: "0\n", isSample: false },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "0\n", isSample: false },
      { input: "7\n2 0 2 0 2 0 2\n", expectedOutput: "6\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i % 2 === 0 ? 1 : 0)).join(" ")}\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nh = data[1:1 + n]\nl, r = 0, n - 1\nleft_max = right_max = 0\nwater = 0\nwhile l <= r:\n    if left_max < right_max:\n        left_max = max(left_max, h[l])\n        water += left_max - h[l]\n        l += 1\n    else:\n        right_max = max(right_max, h[r])\n        water += right_max - h[r]\n        r -= 1\nprint(water)\n",
  },
];
