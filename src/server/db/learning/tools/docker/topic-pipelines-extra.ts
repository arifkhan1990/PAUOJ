import type { SeedProblem } from "../../../seed-problems";

const DEPLOY_GATE_PY = `import sys

raw = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]
position = 0
checks = []
branch = ""
tag = ""
branch_rule = ""
tag_rule = ""
approvals = 0
required_approvals = 0

while position < len(raw):
    parts = raw[position].split()
    key = parts[0]
    if key == "CHECKS":
        count = int(parts[1])
        position += 1
        for k in range(count):
            name, status = raw[position + k].split()
            checks.append((name, status))
        position += count
    elif key == "BRANCH":
        branch = parts[1]
        position += 1
    elif key == "TAG":
        tag = parts[1]
        position += 1
    elif key == "BRANCH_RULE":
        branch_rule = parts[1]
        position += 1
    elif key == "TAG_RULE":
        tag_rule = parts[1]
        position += 1
    elif key == "APPROVALS":
        approvals = int(parts[1])
        position += 1
    elif key == "APPROVALS_REQUIRED":
        required_approvals = int(parts[1])
        position += 1
    else:
        position += 1

reasons = []
if any(status != "pass" for _name, status in checks):
    reasons.append("CHECKS_FAILED")
if branch_rule not in ("none", "*") and branch != branch_rule:
    reasons.append("BRANCH_MISMATCH")
if tag_rule != "none":
    if tag == "none":
        reasons.append("TAG_MISMATCH")
    elif tag_rule.endswith("*"):
        if not tag.startswith(tag_rule[:-1]):
            reasons.append("TAG_MISMATCH")
    elif tag != tag_rule:
        reasons.append("TAG_MISMATCH")
if approvals < required_approvals:
    reasons.append("APPROVAL_MISSING")

if reasons:
    print("VERDICT: BLOCKED")
    print("REASONS: " + " ".join(reasons))
else:
    print("VERDICT: DEPLOY")
    print("REASONS: none")
`;

const ROLLBACK_PLAN_PY = `import sys

values = {}
for line in sys.stdin.read().splitlines():
    parts = line.split()
    if len(parts) == 2:
        values[parts[0]] = parts[1]

migration = values["MIGRATION"]
previous = values["PREV_TAG"]
backup = values["BACKUP"] == "yes"
failure = values["FAILURE"]

def emit(action, steps, state):
    print("ACTION: " + action)
    print("STEPS: " + " ".join(steps))
    print("STATE: " + state)

if failure == "data":
    if not backup:
        emit("ESCALATE", ["HALT_ROLLOUT", "ESCALATE"], "DEGRADED")
    else:
        steps = ["HALT_ROLLOUT", "RESTORE_BACKUP"]
        if previous != "none":
            steps.append("REVERT_IMAGE")
        steps += ["VERIFY_HEALTH", "CLOSE_INCIDENT"]
        state = "OLD_VERSION" if previous != "none" else "DEGRADED"
        emit("RESTORE", steps, state)
elif migration in ("forward-only", "destructive"):
    emit("FORWARD_FIX", ["HALT_ROLLOUT", "DEPLOY_FIX", "VERIFY_HEALTH", "CLOSE_INCIDENT"], "NEW_VERSION")
elif previous != "none":
    emit("REVERT", ["HALT_ROLLOUT", "REVERT_IMAGE", "VERIFY_HEALTH", "CLOSE_INCIDENT"], "OLD_VERSION")
else:
    emit("FORWARD_FIX", ["HALT_ROLLOUT", "DEPLOY_FIX", "VERIFY_HEALTH", "CLOSE_INCIDENT"], "NEW_VERSION")
`;

export const PIPELINES_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-ci-deploy-gate",
    title: "Open or Block the Deploy Gate",
    statement: `শুক্রবার সন্ধ্যায় নুসরাত প্রোডাকশন ডিপ্লয় করতে চায়, কিন্তু তাসনিম বলল গেট পাস না হলে কিছুই যাবে না। মাহিন দেখাল, গেট কয়েকটা জিনিস দেখে: সব required check পাস কি না, ব্রাঞ্চ আর ট্যাগ নিয়ম মিলছে কি না, আর protected environment-এর অনুমোদন যথেষ্ট কি না। এখন এই তথ্যগুলো পড়ে সিদ্ধান্ত আর ব্লক করার কারণগুলো ঠিক ক্রমে বের করো।

কারণ ক্রম (সবসময় এই ক্রমে): \`CHECKS_FAILED\`, \`BRANCH_MISMATCH\`, \`TAG_MISMATCH\`, \`APPROVAL_MISSING\`। কোনো required check \`pass\` ছাড়া অন্য কিছু (\`fail\`, \`pending\`, \`skipped\`) হলে প্রথম কারণ। \`BRANCH_RULE\` \`none\` বা \`*\` হলে ব্রাঞ্চে বাধা নেই, নাহলে হুবহু মিলতে হবে। \`TAG_RULE\` \`none\` হলে ট্যাগ লাগে না; শেষে \`*\` থাকলে prefix মিলতে হবে, নাহলে হুবহু; \`TAG none\` হলে নিয়ম থাকলেই ব্যর্থ।`,
    inputFormat: `ক্রমে \`CHECKS <n>\` ও \`n\`টা \`<নাম> <pass|fail|pending|skipped>\`, \`BRANCH <নাম>\`, \`TAG <ট্যাগ|none>\`, \`BRANCH_RULE <নিয়ম|none>\`, \`TAG_RULE <নিয়ম|none>\`, \`APPROVALS <n>\`, \`APPROVALS_REQUIRED <n>\`।`,
    outputFormat: `দুই লাইন: \`VERDICT: DEPLOY\` বা \`VERDICT: BLOCKED\`, তারপর \`REASONS:\` এরপর ব্লক-কারণগুলো স্পেস দিয়ে; কিছু না থাকলে \`REASONS: none\`।`,
    constraints: `\`1 <= n <= 8\`, \`0 <= APPROVALS <= 10\`
চেকের নাম একক শব্দ, ডুপ্লিকেট নেই; \`APPROVALS_REQUIRED\` protected environment থেকে আসে।`,
    editorial: `## ধারণা
প্রোডাকশন ডিপ্লয় একটা AND গেট: সব শর্ত একসাথে সত্য হতে হয়। Required check মানে branch protection-এ বাধ্যতামূলক স্ট্যাটাস — একটা \`pending\` বা \`skipped\` থাকলেই ডিপ্লয় আটকায়, কারণ "পরে দেখে নেব" প্রোডাকশনে চলে না। Protected environment আরও দুটো জিনিস যোগ করে: কে ডিপ্লয় করতে পারবে (অনুমোদন) আর কোন রেফারেন্স থেকে (ব্রাঞ্চ/ট্যাগ নিয়ম)। ট্যাগ নিয়ম থাকলে \`latest\` বা শাখা-হেড থেকে ডিপ্লয় আটকে যায়, ফলে কোন কমিট প্রোডাকশনে গেল তা ট্রেস করা যায়। কারণগুলো নির্দিষ্ট ক্রমে দেখানো হয়, যাতে রিভিউয়ার প্রথমে সবচেয়ে গুরুতর সমস্যা দেখে।

## ধাপে ধাপে
1. চেক তালিকা পড়ো; একটা \`pass\` না হলে \`CHECKS_FAILED\` যোগ করো।
2. ব্রাঞ্চ নিয়ম থাকলে আর না মিললে \`BRANCH_MISMATCH\`।
3. ট্যাগ নিয়ম থাকলে আর ট্যাগ না মিললে (বা ট্যাগই না থাকলে) \`TAG_MISMATCH\`।
4. অনুমোদনের সংখ্যা কম হলে \`APPROVAL_MISSING\`।
5. তালিকা খালি হলে \`DEPLOY\`, নাহলে \`BLOCKED\` আর কারণগুলো ছাপো।

\`\`\`python
${DEPLOY_GATE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(C)\` চেক সংখ্যা, মেমোরি \`O(C)\`।

## সাধারণ ভুল
- \`pending\` চেককে "এখনো ব্যর্থ নয়" ভেবে পাস ধরা — গেটে সেটাও ব্লক করে।
- ট্যাগ নিয়মে \`*\`-কে সব ম্যাচিং ধরা — এখানে শেষের \`*\` কেবল prefix বোঝায়।
- কারণগুলো এলোমেলো ক্রমে ছাপা — নির্দিষ্ট ক্রমেই দরকার।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["CI/CD", "Release", "Deployment Gate"],
    tests: [
      {
        input: `CHECKS 2
lint pass
test pass
BRANCH main
TAG v2.1.0
BRANCH_RULE main
TAG_RULE v*
APPROVALS 2
APPROVALS_REQUIRED 2
`,
        expectedOutput: "VERDICT: DEPLOY\nREASONS: none\n",
        isSample: true,
      },
      {
        input: `CHECKS 3
lint pass
test pending
build pass
BRANCH develop
TAG none
BRANCH_RULE main
TAG_RULE v*
APPROVALS 0
APPROVALS_REQUIRED 1
`,
        expectedOutput:
          "VERDICT: BLOCKED\nREASONS: CHECKS_FAILED BRANCH_MISMATCH TAG_MISMATCH APPROVAL_MISSING\n",
        isSample: true,
      },
      {
        input: `CHECKS 1
lint pass
BRANCH main
TAG v2.1.0
BRANCH_RULE main
TAG_RULE release-*
APPROVALS 1
APPROVALS_REQUIRED 1
`,
        expectedOutput: "VERDICT: BLOCKED\nREASONS: TAG_MISMATCH\n",
        isSample: false,
      },
      {
        input: `CHECKS 1
lint pass
BRANCH feature/x
TAG none
BRANCH_RULE none
TAG_RULE none
APPROVALS 0
APPROVALS_REQUIRED 0
`,
        expectedOutput: "VERDICT: DEPLOY\nREASONS: none\n",
        isSample: false,
      },
      {
        input: `CHECKS 2
lint pass
security skipped
BRANCH main
TAG v1
BRANCH_RULE main
TAG_RULE none
APPROVALS 1
APPROVALS_REQUIRED 1
`,
        expectedOutput: "VERDICT: BLOCKED\nREASONS: CHECKS_FAILED\n",
        isSample: false,
      },
      {
        input: `CHECKS 1
lint pass
BRANCH main
TAG v9.9.9
BRANCH_RULE main
TAG_RULE v1.0.0
APPROVALS 3
APPROVALS_REQUIRED 1
`,
        expectedOutput: "VERDICT: BLOCKED\nREASONS: TAG_MISMATCH\n",
        isSample: false,
      },
    ],
    referencePython: DEPLOY_GATE_PY,
  },
  {
    slug: "learn-ci-rollback-plan",
    title: "Pick the Safe Rollback",
    statement: `শুক্রবার রাত ৯টায় ডিপ্লয়ের পর \`api\` হেলথ চেক ফেল করছে। নুসরাত তাড়াহুড়ো করে পুরোনো ইমেজে ফিরতে চায়, কিন্তু মাহিন থামিয়ে বলে — মাইগ্রেশন যদি forward-only হয়, পুরোনো কোড নতুন স্কিমায় চলবেই না; তাহলে "রোলব্যাক" মানে ভাঙা সিস্টেমে ফেরা। তাসনিম বলল, আগে ঠিক করো ডেটা নষ্ট হয়েছে কি না, তারপর সিদ্ধান্ত। এখন মাইগ্রেশনের ধরন, পুরোনো ট্যাগ, ব্যাকআপ আর সমস্যার ধরন দেখে নিরাপদ পদক্ষেপ আর ধাপের ক্রম বের করো।

নিয়ম: \`FAILURE data\` হলে ডেটা নষ্ট — \`BACKUP yes\` হলে \`RESTORE\`, নাহলে \`ESCALATE\`। নাহলে মাইগ্রেশন \`forward-only\` বা \`destructive\` হলে \`PREV_TAG\` থাকলেও \`FORWARD_FIX\`, কারণ পুরোনো ইমেজ নতুন স্কিমার সাথে চলে না। মাইগ্রেশন \`backward\` হলে \`PREV_TAG\` থাকলে \`REVERT\`, না থাকলে \`FORWARD_FIX\`।`,
    inputFormat: `চার লাইন, এই ক্রমে: \`MIGRATION <backward|forward-only|destructive>\`, \`PREV_TAG <ট্যাগ|none>\`, \`BACKUP <yes|no>\`, \`FAILURE <health|crash|data>\`।`,
    outputFormat: `তিন লাইন: \`ACTION:\` (\`REVERT\`, \`FORWARD_FIX\`, \`RESTORE\` বা \`ESCALATE\`), \`STEPS:\` ধাপগুলো স্পেস দিয়ে, \`STATE:\` (\`OLD_VERSION\`, \`NEW_VERSION\` বা \`DEGRADED\`)।`,
    constraints: `সব লাইন উপরের ক্রমেই আসে
ধাপের শব্দভাণ্ডার: \`HALT_ROLLOUT\`, \`RESTORE_BACKUP\`, \`REVERT_IMAGE\`, \`DEPLOY_FIX\`, \`VERIFY_HEALTH\`, \`CLOSE_INCIDENT\`, \`ESCALATE\`।`,
    editorial: `## ধারণা
Rollback নিরাপদ কি না সেটা নির্ভর করে ডেটাবেস স্কিমার ওপর। মাইগ্রেশন backward-compatible হলে পুরোনো ইমেজ নতুন স্কিমাতেও চলে, তাই ইমেজ ফিরিয়ে নেওয়া নিরাপদ। Forward-only বা destructive মাইগ্রেশনে পুরোনো কোড কলাম/টেবিল খুঁজে পায় না — তখন একমাত্র পথ সামনে: ঠিক করা কোড ডিপ্লয় করা। ডেটা নষ্ট হলে সবার আগে ব্যাকআপ ফেরানো হয়, কারণ নতুন কোড দিয়ে ভাঙা ডেটা সারানো যায় না। আর ব্যাকআপ না থাকলে অনুমান করে কিছু না করে এসক্যালেট করা ছাড়া উপায় নেই। এই কারণেই প্রোডাকশন মাইগ্রেশন expand/contract ধাপে করা হয়: আগে নতুন কলাম যোগ, পরে কোড, শেষে পুরোনো কলাম বাদ — তাতে রোলব্যাক সবসময় সম্ভব থাকে।

## ধাপে ধাপে
1. চারটা মান পড়ো।
2. \`FAILURE data\` কি না দেখো; হ্যাঁ হলে ব্যাকআপ আছে কি না দেখে \`RESTORE\` বা \`ESCALATE\`।
3. নাহলে মাইগ্রেশনের দিকে তাকাও — \`forward-only\`/\`destructive\` মানে \`FORWARD_FIX\`।
4. \`backward\` হলে \`PREV_TAG\` আছে কি না দেখো: থাকলে \`REVERT\`, না থাকলে \`FORWARD_FIX\`।
5. প্রতিটি পদক্ষেপের ধাপ ক্রমে ছাপো, আর শেষে সার্ভিসের অবস্থা।

\`\`\`python
${ROLLBACK_PLAN_PY}\`\`\`

## কমপ্লেক্সিটি
সময় আর মেমোরি \`O(1)\` — কেবল কয়েকটা নিয়ম।

## সাধারণ ভুল
- \`destructive\` মাইগ্রেশনেও ইমেজ রিভার্ট করা — পুরোনো কোড নতুন স্কিমায় ক্র্যাশ করবে।
- ডেটা নষ্ট হলে আগে অ্যাপ রিভার্ট করা — ব্যাকআপ ছাড়া ডেটা ফেরে না, তাই ব্যাকআপই প্রথম।
- ব্যাকআপ আছে ধরে নিয়ে পরিকল্পনা করা — ব্যাকআপ যাচাই না করা থাকলে সেটা অনুমান।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Release", "Incident", "Rollback"],
    tests: [
      {
        input: `MIGRATION backward
PREV_TAG v41
BACKUP yes
FAILURE health
`,
        expectedOutput:
          "ACTION: REVERT\nSTEPS: HALT_ROLLOUT REVERT_IMAGE VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: OLD_VERSION\n",
        isSample: true,
      },
      {
        input: `MIGRATION forward-only
PREV_TAG v41
BACKUP yes
FAILURE health
`,
        expectedOutput:
          "ACTION: FORWARD_FIX\nSTEPS: HALT_ROLLOUT DEPLOY_FIX VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: NEW_VERSION\n",
        isSample: true,
      },
      {
        input: `MIGRATION destructive
PREV_TAG v41
BACKUP yes
FAILURE crash
`,
        expectedOutput:
          "ACTION: FORWARD_FIX\nSTEPS: HALT_ROLLOUT DEPLOY_FIX VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: NEW_VERSION\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG v41
BACKUP yes
FAILURE data
`,
        expectedOutput:
          "ACTION: RESTORE\nSTEPS: HALT_ROLLOUT RESTORE_BACKUP REVERT_IMAGE VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: OLD_VERSION\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG v41
BACKUP no
FAILURE data
`,
        expectedOutput: "ACTION: ESCALATE\nSTEPS: HALT_ROLLOUT ESCALATE\nSTATE: DEGRADED\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG none
BACKUP yes
FAILURE crash
`,
        expectedOutput:
          "ACTION: FORWARD_FIX\nSTEPS: HALT_ROLLOUT DEPLOY_FIX VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: NEW_VERSION\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG none
BACKUP yes
FAILURE data
`,
        expectedOutput:
          "ACTION: RESTORE\nSTEPS: HALT_ROLLOUT RESTORE_BACKUP VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: DEGRADED\n",
        isSample: false,
      },
    ],
    referencePython: ROLLBACK_PLAN_PY,
  },
];
