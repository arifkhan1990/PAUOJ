import type { SeedProblem } from "../../../seed-problems";

const CHECK_INCIDENT_PY = `import sys

values = {}
for line in sys.stdin.read().splitlines():
    parts = line.split()
    if len(parts) == 2:
        values[parts[0]] = parts[1]

migration = values["MIGRATION"]
previous = values["PREV_TAG"]
backup = values["BACKUP"] == "yes"
old_replicas = int(values["OLD_REPLICAS"])
data_state = values["DATA_STATE"]

def emit(action, steps, state):
    print("ACTION: " + action)
    print("STEPS: " + " ".join(steps))
    print("STATE: " + state)

if data_state == "corrupt":
    if not backup:
        emit("ESCALATE", ["HALT_ROLLOUT", "ESCALATE"], "DEGRADED")
    else:
        steps = ["HALT_ROLLOUT", "RESTORE_BACKUP"]
        if previous != "none":
            steps.append("REVERT_IMAGE")
        steps += ["VERIFY_HEALTH", "CLOSE_INCIDENT"]
        state = "OLD_VERSION" if previous != "none" else "DEGRADED"
        emit("RESTORE", steps, state)
elif migration == "backward" and old_replicas > 0:
    emit(
        "SHIFT_TRAFFIC",
        ["HALT_ROLLOUT", "SHIFT_TRAFFIC", "VERIFY_HEALTH", "CLOSE_INCIDENT"],
        "OLD_VERSION",
    )
elif migration == "backward" and previous != "none":
    emit(
        "REVERT",
        ["HALT_ROLLOUT", "REVERT_IMAGE", "VERIFY_HEALTH", "CLOSE_INCIDENT"],
        "OLD_VERSION",
    )
else:
    emit(
        "FORWARD_FIX",
        ["HALT_ROLLOUT", "DEPLOY_FIX", "VERIFY_HEALTH", "CLOSE_INCIDENT"],
        "NEW_VERSION",
    )
`;

export const CHECKPOINT_INCIDENT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-check-incident",
    title: "Checkpoint: The Friday Incident",
    statement: `শুক্রবার রাত ৯টায় নতুন রিলিজের পর \`api\`-র হেলথ চেক ফেল করছে, আর ডেটাবেস মাইগ্রেশন ইতিমধ্যে চলে গেছে। নুসরাত তাড়াহুড়ো করে পুরোনো ইমেজে ফিরতে চায়, মাহিন থামিয়ে বলে — সিদ্ধান্ত নির্ভর করে মাইগ্রেশন backward-compatible কি না, ডেটা নষ্ট হয়েছে কি না, পুরোনো রেপ্লিকা এখনও আছে কি না, আর ব্যাকআপ যাচাই করা আছে কি না। তাসনিম বলল, ঠান্ডা মাথায় ধাপে ধাপে সিদ্ধান্ত নিতে হবে। এখন ইনসিডেন্টের তথ্য পড়ে নিরাপদ পদক্ষেপ, ধাপের ক্রম আর শেষ অবস্থা বের করো।

নিয়ম, এই ক্রমে: \`DATA_STATE corrupt\` হলে ডেটা নষ্ট — \`BACKUP yes\` হলে \`RESTORE\`, নাহলে \`ESCALATE\`। নাহলে মাইগ্রেশন \`backward\` এবং \`OLD_REPLICAS\` শূন্যের বেশি হলে \`SHIFT_TRAFFIC\` — পুরোনো রেপ্লিকাগুলোই নিরাপদ পথ। মাইগ্রেশন \`backward\` কিন্তু পুরোনো রেপ্লিকা নেই: \`PREV_TAG\` থাকলে \`REVERT\`, না থাকলে \`FORWARD_FIX\`। মাইগ্রেশন \`forward-only\` বা \`destructive\` হলে সবসময় \`FORWARD_FIX\`, কারণ পুরোনো ইমেজ নতুন স্কিমায় চলে না।`,
    inputFormat: `পাঁচ লাইন, এই ক্রমে: \`MIGRATION <backward|forward-only|destructive>\`, \`PREV_TAG <ট্যাগ|none>\`, \`BACKUP <yes|no>\`, \`OLD_REPLICAS <n>\`, \`DATA_STATE <clean|corrupt>\`।`,
    outputFormat: `তিন লাইন: \`ACTION:\` (\`REVERT\`, \`FORWARD_FIX\`, \`SHIFT_TRAFFIC\`, \`RESTORE\` বা \`ESCALATE\`), \`STEPS:\` ধাপগুলো স্পেস দিয়ে, \`STATE:\` (\`OLD_VERSION\`, \`NEW_VERSION\` বা \`DEGRADED\`)।`,
    constraints: `\`0 <= OLD_REPLICAS <= 10\`
ধাপের শব্দভাণ্ডার: \`HALT_ROLLOUT\`, \`RESTORE_BACKUP\`, \`REVERT_IMAGE\`, \`DEPLOY_FIX\`, \`SHIFT_TRAFFIC\`, \`VERIFY_HEALTH\`, \`CLOSE_INCIDENT\`, \`ESCALATE\`।`,
    editorial: `## ধারণা
ইনসিডেন্টে প্রথম প্রশ্ন "কী ভেঙেছে", দ্বিতীয় প্রশ্ন "কোনটা ফেরানো নিরাপদ"। ডেটা নষ্ট হলে নতুন কোড দিয়ে সেটা সারানো যায় না — ব্যাকআপই একমাত্র পথ, আর ব্যাকআপ না থাকলে অনুমান করে কিছু না করে এসক্যালেট করা ছাড়া উপায় নেই। ডেটা ঠিক থাকলে মাইগ্রেশনই সিদ্ধান্ত নেয়: backward-compatible স্কিমায় পুরোনো ইমেজ চলতে পারে, তাই আগে পুরোনো রেপ্লিকায় ফেরা হয়, না থাকলে ট্যাগ রিভার্ট। forward-only বা destructive মাইগ্রেশনে পুরোনো কোড নতুন স্কিমায় ক্র্যাশ করে, তাই একমাত্র পথ সামনে — ঠিক করা কোড ডিপ্লয়। এই কারণেই প্রোডাকশন মাইগ্রেশন expand/contract ধাপে চলে: আগে নতুন কলাম যোগ, তারপর কোড, শেষে পুরোনো কলাম বাদ — তাতে যেকোনো মুহূর্তে রোলব্যাক সম্ভব থাকে।

## ধাপে ধাপে
1. পাঁচটা মান পড়ো।
2. \`DATA_STATE corrupt\` কি না দেখো; হ্যাঁ হলে ব্যাকআপ আছে কি না দেখে \`RESTORE\` বা \`ESCALATE\`।
3. নাহলে মাইগ্রেশন \`backward\` কি না দেখো; হ্যাঁ হলে পুরোনো রেপ্লিকা থাকলে \`SHIFT_TRAFFIC\`, নাহলে ট্যাগ থাকলে \`REVERT\`।
4. \`backward\` কিন্তু ট্যাগও নেই, রেপ্লিকাও নেই — \`FORWARD_FIX\`।
5. \`forward-only\`/\`destructive\` হলে \`FORWARD_FIX\`; ধাপগুলো ক্রমে ছাপো, শেষে অবস্থা।

\`\`\`python
${CHECK_INCIDENT_PY}\`\`\`

## কমপ্লেক্সিটি
সময় আর মেমোরি \`O(1)\` — কেবল কয়েকটা নিয়ম।

## সাধারণ ভুল
- ডেটা নষ্ট হওয়া অবস্থায় প্রথমে অ্যাপ রিভার্ট করা — ব্যাকআপ ছাড়া ডেটা ফেরে না।
- \`destructive\` মাইগ্রেশনেও \`REVERT\` বাছা — পুরোনো কোড নতুন স্কিমায় চলে না।
- ব্যাকআপ আছে ধরে নিয়ে পরিকল্পনা লেখা — যাচাই করা ব্যাকআপই আসল ব্যাকআপ।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Release", "Incident", "Rollback"],
    tests: [
      {
        input: `MIGRATION backward
PREV_TAG v41
BACKUP yes
OLD_REPLICAS 0
DATA_STATE clean
`,
        expectedOutput:
          "ACTION: REVERT\nSTEPS: HALT_ROLLOUT REVERT_IMAGE VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: OLD_VERSION\n",
        isSample: true,
      },
      {
        input: `MIGRATION backward
PREV_TAG v41
BACKUP yes
OLD_REPLICAS 2
DATA_STATE clean
`,
        expectedOutput:
          "ACTION: SHIFT_TRAFFIC\nSTEPS: HALT_ROLLOUT SHIFT_TRAFFIC VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: OLD_VERSION\n",
        isSample: true,
      },
      {
        input: `MIGRATION forward-only
PREV_TAG v41
BACKUP no
OLD_REPLICAS 0
DATA_STATE clean
`,
        expectedOutput:
          "ACTION: FORWARD_FIX\nSTEPS: HALT_ROLLOUT DEPLOY_FIX VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: NEW_VERSION\n",
        isSample: false,
      },
      {
        input: `MIGRATION destructive
PREV_TAG v41
BACKUP yes
OLD_REPLICAS 3
DATA_STATE clean
`,
        expectedOutput:
          "ACTION: FORWARD_FIX\nSTEPS: HALT_ROLLOUT DEPLOY_FIX VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: NEW_VERSION\n",
        isSample: false,
      },
      {
        input: `MIGRATION destructive
PREV_TAG v41
BACKUP yes
OLD_REPLICAS 0
DATA_STATE corrupt
`,
        expectedOutput:
          "ACTION: RESTORE\nSTEPS: HALT_ROLLOUT RESTORE_BACKUP REVERT_IMAGE VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: OLD_VERSION\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG none
BACKUP yes
OLD_REPLICAS 1
DATA_STATE corrupt
`,
        expectedOutput:
          "ACTION: RESTORE\nSTEPS: HALT_ROLLOUT RESTORE_BACKUP VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: DEGRADED\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG v41
BACKUP no
OLD_REPLICAS 0
DATA_STATE corrupt
`,
        expectedOutput: "ACTION: ESCALATE\nSTEPS: HALT_ROLLOUT ESCALATE\nSTATE: DEGRADED\n",
        isSample: false,
      },
      {
        input: `MIGRATION backward
PREV_TAG none
BACKUP yes
OLD_REPLICAS 0
DATA_STATE clean
`,
        expectedOutput:
          "ACTION: FORWARD_FIX\nSTEPS: HALT_ROLLOUT DEPLOY_FIX VERIFY_HEALTH CLOSE_INCIDENT\nSTATE: NEW_VERSION\n",
        isSample: false,
      },
    ],
    referencePython: CHECK_INCIDENT_PY,
  },
];
