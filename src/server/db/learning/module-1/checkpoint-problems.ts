import type { SeedProblem } from "../../seed-problems";

export const CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-checkpoint-campus-queue",
    title: "Campus Canteen Queue",
    statement:
      "প্রাইমএশিয়ার ক্যান্টিনে দুপুরে লাইন লম্বা হয়ে যায়, তাই নুসরাত একটা ছোট সিমুলেশন লিখছে। ইভেন্ট অনুযায়ী ছাত্রছাত্রী লাইনে যোগ হবে বা সামনের ছাত্র টাকা দিয়ে বের হবে — লাইন FIFO: যে আগে ঢোকে সে আগে বের হয়।\n\n`n`টি ইভেন্ট দেওয়া থাকবে:\n\n- `1 x` — বিল `x` সহ একজন ছাত্র লাইনের শেষে যোগ হলো।\n- `2` — লাইনের সামনের ছাত্র টাকা দিয়ে বের হলো এবং তার বিল প্রিন্ট করো।\n- `3` — লাইনের সামনের ছাত্রের বিল ছাড়াই প্রিন্ট করো (সে থাকবে)।\n\nলাইন খালি অবস্থায় `2` বা `3` এলে `-1` প্রিন্ট করো। শুধু `2` ও `3` ইভেন্টের উত্তর দাও।",
    inputFormat:
      "প্রথম লাইনে ইভেন্টের সংখ্যা `n`। পরের `n` লাইনে প্রতিটি ইভেন্ট — `1 x`, `2` বা `3`।",
    outputFormat:
      "প্রতিটি `2` ও `3` ইভেন্টের জন্য একটি করে লাইনে উত্তর; কোনো উত্তর না থাকলে কোনো লাইন ছাপবে না।",
    constraints: "`1 <= n <= 200000`\n`1 <= x <= 10^9`",
    editorial:
      "## ধারণা\n\nএটা একটা কিউ সিমুলেশন। নতুন ছাত্র যোগ হবে শেষে (`append`), সামনের ছাত্র বের হবে আগে (`popleft`) — FIFO আচরণ। Python-এ `collections.deque` এই দুই কাজই `O(1)` সময়ে করে; সাধারণ লিস্টের `pop(0)` `O(n)` নেয়, তাই `n = 200000`-এ TLE দিতে পারে।\n\n## ধাপে ধাপে\n\n1. `n` আর সব ইভেন্ট পড়ে নাও।\n2. খালি `deque` দিয়ে শুরু করো, উত্তরের লিস্ট খালি রেখো।\n3. প্রতিটি ইভেন্ট ধরো:\n   - `1 x` → `queue.append(x)`।\n   - `2` → খালি না হলে `popleft()` করে ফল রেখো, খালি হলে `-1`।\n   - `3` → খালি না হলে `queue[0]` রেখো, খালি হলে `-1` (কিছু সরাবেন না)।\n4. সংগ্রহ করা উত্তরগুলো এক এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\nfrom collections import deque\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\nqueue = deque()\nout = []\nfor i in range(1, n + 1):\n    parts = lines[i].split()\n    if parts[0] == '1':\n        queue.append(int(parts[1]))\n    elif parts[0] == '2':\n        out.append(str(queue.popleft()) if queue else '-1')\n    else:\n        out.append(str(queue[0]) if queue else '-1')\nsys.stdout.write('\\n'.join(out))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` (কিউ ও আউটপুট ধরে)।\n\n## সাধারণ ভুল\n\n- লিস্টের `pop(0)` ব্যবহার করা — ধীর এবং বড় ইনপুটে সময় শেষ হয়ে যায়।\n- `3` ইভেন্টেও সামনের ছাত্রকে সরিয়ে দেওয়া, অথবা খালি কিউ-এ `queue[0]` নিয়ে ক্র্যাশ করা — খালিতে সঙ্গে সঙ্গে `-1` দাও।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Queue", "Simulation", "Implementation"],
    tests: [
      {
        input: "6\n1 50\n1 70\n2\n3\n2\n2\n",
        expectedOutput: "50\n70\n70\n-1\n",
        isSample: true,
      },
      {
        input: "4\n3\n1 10\n3\n2\n",
        expectedOutput: "-1\n10\n10\n",
        isSample: true,
      },
      { input: "1\n2\n", expectedOutput: "-1\n", isSample: false },
      { input: "3\n1 5\n1 6\n1 7\n", expectedOutput: "", isSample: false },
      {
        input: "5\n1 12\n1 2\n1 3\n2\n2\n",
        expectedOutput: "12\n2\n",
        isSample: false,
      },
      {
        input: "2\n1 1000000000\n2\n",
        expectedOutput: "1000000000\n",
        isSample: false,
      },
      {
        input: "1000\n1 1\n2\n3\n1 4\n2\n3\n1 7\n2\n3\n1 10\n2\n3\n1 13\n2\n3\n1 16\n2\n3\n1 19\n2\n3\n1 22\n2\n3\n1 25\n2\n3\n1 28\n2\n3\n1 31\n2\n3\n1 34\n2\n3\n1 37\n2\n3\n1 40\n2\n3\n1 43\n2\n3\n1 46\n2\n3\n1 49\n2\n3\n1 52\n2\n3\n1 55\n2\n3\n1 58\n2\n3\n1 61\n2\n3\n1 64\n2\n3\n1 67\n2\n3\n1 70\n2\n3\n1 73\n2\n3\n1 76\n2\n3\n1 79\n2\n3\n1 82\n2\n3\n1 85\n2\n3\n1 88\n2\n3\n1 91\n2\n3\n1 94\n2\n3\n1 97\n2\n3\n1 100\n2\n3\n1 103\n2\n3\n1 106\n2\n3\n1 109\n2\n3\n1 112\n2\n3\n1 115\n2\n3\n1 118\n2\n3\n1 121\n2\n3\n1 124\n2\n3\n1 127\n2\n3\n1 130\n2\n3\n1 133\n2\n3\n1 136\n2\n3\n1 139\n2\n3\n1 142\n2\n3\n1 145\n2\n3\n1 148\n2\n3\n1 151\n2\n3\n1 154\n2\n3\n1 157\n2\n3\n1 160\n2\n3\n1 163\n2\n3\n1 166\n2\n3\n1 169\n2\n3\n1 172\n2\n3\n1 175\n2\n3\n1 178\n2\n3\n1 181\n2\n3\n1 184\n2\n3\n1 187\n2\n3\n1 190\n2\n3\n1 193\n2\n3\n1 196\n2\n3\n1 199\n2\n3\n1 202\n2\n3\n1 205\n2\n3\n1 208\n2\n3\n1 211\n2\n3\n1 214\n2\n3\n1 217\n2\n3\n1 220\n2\n3\n1 223\n2\n3\n1 226\n2\n3\n1 229\n2\n3\n1 232\n2\n3\n1 235\n2\n3\n1 238\n2\n3\n1 241\n2\n3\n1 244\n2\n3\n1 247\n2\n3\n1 250\n2\n3\n1 253\n2\n3\n1 256\n2\n3\n1 259\n2\n3\n1 262\n2\n3\n1 265\n2\n3\n1 268\n2\n3\n1 271\n2\n3\n1 274\n2\n3\n1 277\n2\n3\n1 280\n2\n3\n1 283\n2\n3\n1 286\n2\n3\n1 289\n2\n3\n1 292\n2\n3\n1 295\n2\n3\n1 298\n2\n3\n1 301\n2\n3\n1 304\n2\n3\n1 307\n2\n3\n1 310\n2\n3\n1 313\n2\n3\n1 316\n2\n3\n1 319\n2\n3\n1 322\n2\n3\n1 325\n2\n3\n1 328\n2\n3\n1 331\n2\n3\n1 334\n2\n3\n1 337\n2\n3\n1 340\n2\n3\n1 343\n2\n3\n1 346\n2\n3\n1 349\n2\n3\n1 352\n2\n3\n1 355\n2\n3\n1 358\n2\n3\n1 361\n2\n3\n1 364\n2\n3\n1 367\n2\n3\n1 370\n2\n3\n1 373\n2\n3\n1 376\n2\n3\n1 379\n2\n3\n1 382\n2\n3\n1 385\n2\n3\n1 388\n2\n3\n1 391\n2\n3\n1 394\n2\n3\n1 397\n2\n3\n1 400\n2\n3\n1 403\n2\n3\n1 406\n2\n3\n1 409\n2\n3\n1 412\n2\n3\n1 415\n2\n3\n1 418\n2\n3\n1 421\n2\n3\n1 424\n2\n3\n1 427\n2\n3\n1 430\n2\n3\n1 433\n2\n3\n1 436\n2\n3\n1 439\n2\n3\n1 442\n2\n3\n1 445\n2\n3\n1 448\n2\n3\n1 451\n2\n3\n1 454\n2\n3\n1 457\n2\n3\n1 460\n2\n3\n1 463\n2\n3\n1 466\n2\n3\n1 469\n2\n3\n1 472\n2\n3\n1 475\n2\n3\n1 478\n2\n3\n1 481\n2\n3\n1 484\n2\n3\n1 487\n2\n3\n1 490\n2\n3\n1 493\n2\n3\n1 496\n2\n3\n1 499\n2\n3\n1 502\n2\n3\n1 505\n2\n3\n1 508\n2\n3\n1 511\n2\n3\n1 514\n2\n3\n1 517\n2\n3\n1 520\n2\n3\n1 523\n2\n3\n1 526\n2\n3\n1 529\n2\n3\n1 532\n2\n3\n1 535\n2\n3\n1 538\n2\n3\n1 541\n2\n3\n1 544\n2\n3\n1 547\n2\n3\n1 550\n2\n3\n1 553\n2\n3\n1 556\n2\n3\n1 559\n2\n3\n1 562\n2\n3\n1 565\n2\n3\n1 568\n2\n3\n1 571\n2\n3\n1 574\n2\n3\n1 577\n2\n3\n1 580\n2\n3\n1 583\n2\n3\n1 586\n2\n3\n1 589\n2\n3\n1 592\n2\n3\n1 595\n2\n3\n1 598\n2\n3\n1 601\n2\n3\n1 604\n2\n3\n1 607\n2\n3\n1 610\n2\n3\n1 613\n2\n3\n1 616\n2\n3\n1 619\n2\n3\n1 622\n2\n3\n1 625\n2\n3\n1 628\n2\n3\n1 631\n2\n3\n1 634\n2\n3\n1 637\n2\n3\n1 640\n2\n3\n1 643\n2\n3\n1 646\n2\n3\n1 649\n2\n3\n1 652\n2\n3\n1 655\n2\n3\n1 658\n2\n3\n1 661\n2\n3\n1 664\n2\n3\n1 667\n2\n3\n1 670\n2\n3\n1 673\n2\n3\n1 676\n2\n3\n1 679\n2\n3\n1 682\n2\n3\n1 685\n2\n3\n1 688\n2\n3\n1 691\n2\n3\n1 694\n2\n3\n1 697\n2\n3\n1 700\n2\n3\n1 703\n2\n3\n1 706\n2\n3\n1 709\n2\n3\n1 712\n2\n3\n1 715\n2\n3\n1 718\n2\n3\n1 721\n2\n3\n1 724\n2\n3\n1 727\n2\n3\n1 730\n2\n3\n1 733\n2\n3\n1 736\n2\n3\n1 739\n2\n3\n1 742\n2\n3\n1 745\n2\n3\n1 748\n2\n3\n1 751\n2\n3\n1 754\n2\n3\n1 757\n2\n3\n1 760\n2\n3\n1 763\n2\n3\n1 766\n2\n3\n1 769\n2\n3\n1 772\n2\n3\n1 775\n2\n3\n1 778\n2\n3\n1 781\n2\n3\n1 784\n2\n3\n1 787\n2\n3\n1 790\n2\n3\n1 793\n2\n3\n1 796\n2\n3\n1 799\n2\n3\n1 802\n2\n3\n1 805\n2\n3\n1 808\n2\n3\n1 811\n2\n3\n1 814\n2\n3\n1 817\n2\n3\n1 820\n2\n3\n1 823\n2\n3\n1 826\n2\n3\n1 829\n2\n3\n1 832\n2\n3\n1 835\n2\n3\n1 838\n2\n3\n1 841\n2\n3\n1 844\n2\n3\n1 847\n2\n3\n1 850\n2\n3\n1 853\n2\n3\n1 856\n2\n3\n1 859\n2\n3\n1 862\n2\n3\n1 865\n2\n3\n1 868\n2\n3\n1 871\n2\n3\n1 874\n2\n3\n1 877\n2\n3\n1 880\n2\n3\n1 883\n2\n3\n1 886\n2\n3\n1 889\n2\n3\n1 892\n2\n3\n1 895\n2\n3\n1 898\n2\n3\n1 901\n2\n3\n1 904\n2\n3\n1 907\n2\n3\n1 910\n2\n3\n1 913\n2\n3\n1 916\n2\n3\n1 919\n2\n3\n1 922\n2\n3\n1 925\n2\n3\n1 928\n2\n3\n1 931\n2\n3\n1 934\n2\n3\n1 937\n2\n3\n1 940\n2\n3\n1 943\n2\n3\n1 946\n2\n3\n1 949\n2\n3\n1 952\n2\n3\n1 955\n2\n3\n1 958\n2\n3\n1 961\n2\n3\n1 964\n2\n3\n1 967\n2\n3\n1 970\n2\n3\n1 973\n2\n3\n1 976\n2\n3\n1 979\n2\n3\n1 982\n2\n3\n1 985\n2\n3\n1 988\n2\n3\n1 991\n2\n3\n1 994\n2\n3\n1 997\n2\n3\n1 1000\n",
        expectedOutput: "1\n-1\n4\n-1\n7\n-1\n10\n-1\n13\n-1\n16\n-1\n19\n-1\n22\n-1\n25\n-1\n28\n-1\n31\n-1\n34\n-1\n37\n-1\n40\n-1\n43\n-1\n46\n-1\n49\n-1\n52\n-1\n55\n-1\n58\n-1\n61\n-1\n64\n-1\n67\n-1\n70\n-1\n73\n-1\n76\n-1\n79\n-1\n82\n-1\n85\n-1\n88\n-1\n91\n-1\n94\n-1\n97\n-1\n100\n-1\n103\n-1\n106\n-1\n109\n-1\n112\n-1\n115\n-1\n118\n-1\n121\n-1\n124\n-1\n127\n-1\n130\n-1\n133\n-1\n136\n-1\n139\n-1\n142\n-1\n145\n-1\n148\n-1\n151\n-1\n154\n-1\n157\n-1\n160\n-1\n163\n-1\n166\n-1\n169\n-1\n172\n-1\n175\n-1\n178\n-1\n181\n-1\n184\n-1\n187\n-1\n190\n-1\n193\n-1\n196\n-1\n199\n-1\n202\n-1\n205\n-1\n208\n-1\n211\n-1\n214\n-1\n217\n-1\n220\n-1\n223\n-1\n226\n-1\n229\n-1\n232\n-1\n235\n-1\n238\n-1\n241\n-1\n244\n-1\n247\n-1\n250\n-1\n253\n-1\n256\n-1\n259\n-1\n262\n-1\n265\n-1\n268\n-1\n271\n-1\n274\n-1\n277\n-1\n280\n-1\n283\n-1\n286\n-1\n289\n-1\n292\n-1\n295\n-1\n298\n-1\n301\n-1\n304\n-1\n307\n-1\n310\n-1\n313\n-1\n316\n-1\n319\n-1\n322\n-1\n325\n-1\n328\n-1\n331\n-1\n334\n-1\n337\n-1\n340\n-1\n343\n-1\n346\n-1\n349\n-1\n352\n-1\n355\n-1\n358\n-1\n361\n-1\n364\n-1\n367\n-1\n370\n-1\n373\n-1\n376\n-1\n379\n-1\n382\n-1\n385\n-1\n388\n-1\n391\n-1\n394\n-1\n397\n-1\n400\n-1\n403\n-1\n406\n-1\n409\n-1\n412\n-1\n415\n-1\n418\n-1\n421\n-1\n424\n-1\n427\n-1\n430\n-1\n433\n-1\n436\n-1\n439\n-1\n442\n-1\n445\n-1\n448\n-1\n451\n-1\n454\n-1\n457\n-1\n460\n-1\n463\n-1\n466\n-1\n469\n-1\n472\n-1\n475\n-1\n478\n-1\n481\n-1\n484\n-1\n487\n-1\n490\n-1\n493\n-1\n496\n-1\n499\n-1\n502\n-1\n505\n-1\n508\n-1\n511\n-1\n514\n-1\n517\n-1\n520\n-1\n523\n-1\n526\n-1\n529\n-1\n532\n-1\n535\n-1\n538\n-1\n541\n-1\n544\n-1\n547\n-1\n550\n-1\n553\n-1\n556\n-1\n559\n-1\n562\n-1\n565\n-1\n568\n-1\n571\n-1\n574\n-1\n577\n-1\n580\n-1\n583\n-1\n586\n-1\n589\n-1\n592\n-1\n595\n-1\n598\n-1\n601\n-1\n604\n-1\n607\n-1\n610\n-1\n613\n-1\n616\n-1\n619\n-1\n622\n-1\n625\n-1\n628\n-1\n631\n-1\n634\n-1\n637\n-1\n640\n-1\n643\n-1\n646\n-1\n649\n-1\n652\n-1\n655\n-1\n658\n-1\n661\n-1\n664\n-1\n667\n-1\n670\n-1\n673\n-1\n676\n-1\n679\n-1\n682\n-1\n685\n-1\n688\n-1\n691\n-1\n694\n-1\n697\n-1\n700\n-1\n703\n-1\n706\n-1\n709\n-1\n712\n-1\n715\n-1\n718\n-1\n721\n-1\n724\n-1\n727\n-1\n730\n-1\n733\n-1\n736\n-1\n739\n-1\n742\n-1\n745\n-1\n748\n-1\n751\n-1\n754\n-1\n757\n-1\n760\n-1\n763\n-1\n766\n-1\n769\n-1\n772\n-1\n775\n-1\n778\n-1\n781\n-1\n784\n-1\n787\n-1\n790\n-1\n793\n-1\n796\n-1\n799\n-1\n802\n-1\n805\n-1\n808\n-1\n811\n-1\n814\n-1\n817\n-1\n820\n-1\n823\n-1\n826\n-1\n829\n-1\n832\n-1\n835\n-1\n838\n-1\n841\n-1\n844\n-1\n847\n-1\n850\n-1\n853\n-1\n856\n-1\n859\n-1\n862\n-1\n865\n-1\n868\n-1\n871\n-1\n874\n-1\n877\n-1\n880\n-1\n883\n-1\n886\n-1\n889\n-1\n892\n-1\n895\n-1\n898\n-1\n901\n-1\n904\n-1\n907\n-1\n910\n-1\n913\n-1\n916\n-1\n919\n-1\n922\n-1\n925\n-1\n928\n-1\n931\n-1\n934\n-1\n937\n-1\n940\n-1\n943\n-1\n946\n-1\n949\n-1\n952\n-1\n955\n-1\n958\n-1\n961\n-1\n964\n-1\n967\n-1\n970\n-1\n973\n-1\n976\n-1\n979\n-1\n982\n-1\n985\n-1\n988\n-1\n991\n-1\n994\n-1\n997\n-1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\nqueue = deque()\nout = []\nfor i in range(1, n + 1):\n    parts = lines[i].split()\n    if parts[0] == '1':\n        queue.append(int(parts[1]))\n    elif parts[0] == '2':\n        out.append(str(queue.popleft()) if queue else '-1')\n    else:\n        out.append(str(queue[0]) if queue else '-1')\nsys.stdout.write('\\n'.join(out))\n",
  },
  {
    slug: "learn-m1-checkpoint-prime-gap",
    title: "Largest Prime Gap",
    statement:
      "তানভির সংখ্যা তত্ত্বের ক্লাসে শিখলেন যে প্রাইমগুলো বড় হলে তাদের মাঝের ফাঁক বাড়তে পারে। `n` পর্যন্ত সব প্রাইম বের করে পরপর দুটি প্রাইমের সবচেয়ে বড় পার্থক্য কত তা নির্ণয় করো।\n\nপ্রাইম হলো ১-এর চেয়ে বড় এমন সংখ্যা যার ১ এবং নিজে ছাড়া অন্য কোনো ধনাত্মক ভাগকারী নেই। যদি `n` পর্যন্ত এক বা একের কম প্রাইম থাকে, তাহলে উত্তর `0`।\n\nউদাহরণ: `n = 10` হলে প্রাইম `2, 3, 5, 7`; পার্থক্য যথাক্রমে `1, 2, 2`; সবচেয়ে বড় `2`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat:
      "`n` পর্যন্ত পরপর দুই প্রাইমের সবচেয়ে বড় পার্থক্য এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 10^6`",
    editorial:
      "## ধারণা\n\nপ্রথমে `n` পর্যন্ত সব প্রাইম বের করতে হবে — Sieve of Eratosthenes সবচেয়ে দ্রুত উপায়। তারপর প্রাইমগুলো ক্রমানুসারে বসিয়ে প্রতিটি পাশাপাশি জোড়ার পার্থক্য মাপলেই বড়টা পাওয়া যায়। মনে রেখো পার্থক্য নেওয়া হবে দুই প্রাইমের মাঝে, প্রাইম আর `n`-এর মাঝে নয়।\n\n## ধাপে ধাপে\n\n1. `n < 2` হলে সঙ্গে সঙ্গে `0` প্রিন্ট করে থামো (কোনো জোড়া নেই)।\n2. `n + 1` আকারের sieve বানাও, শূন্য ও এককে প্রাইম নয় চিহ্নিত করো।\n3. `p = 2` থেকে `p * p <= n` পর্যন্ত লুপ চালিয়ে `p` প্রাইম হলে তার গুণিতক চিহ্নিত করো।\n4. বাকি প্রাইমগুলো ক্রমে বের করে পাশাপাশি পার্থক্য থেকে সর্বোচ্চটা রেখো।\n5. সর্বোচ্চ পার্থক্য প্রিন্ট করো।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nif n < 2:\n    print(0)\nelse:\n    sieve = bytearray(b'\\x01') * (n + 1)\n    sieve[0:2] = b'\\x00\\x00'\n    p = 2\n    while p * p <= n:\n        if sieve[p]:\n            sieve[p * p:n + 1:p] = b'\\x00' * (((n - p * p) // p) + 1)\n        p += 1\n    primes = [v for v in range(2, n + 1) if sieve[v]]\n    best = 0\n    for i in range(1, len(primes)):\n        best = max(best, primes[i] - primes[i - 1])\n    print(best)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n log log n)` (sieve), স্পেস `O(n)`। `n = 10^6` হলে Python-এও এক সেকেন্ডের কমে চলে।\n\n## সাধারণ ভুল\n\n- শুধু বিজোড় সংখ্যা ধরে sieve চালানো — `2` বাদ পড়ে, তাই `n = 3`-এ প্রাইম শুধু `3` ধরা পড়ে এবং উত্তর `0` আসে; সঠিক উত্তর `1` (কারণ `3 - 2 = 1`)।\n- শেষ প্রাইম আর `n`-এর মাঝে পার্থক্য নেওয়া — `n` যদি কোনো জোড় সংখ্যা হয়, ভুল ফল দেয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Sieve", "Primes"],
    tests: [
      { input: "10\n", expectedOutput: "2\n", isSample: true },
      { input: "2\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "3\n", expectedOutput: "1\n", isSample: false },
      { input: "11\n", expectedOutput: "4\n", isSample: false },
      { input: "100\n", expectedOutput: "8\n", isSample: false },
      { input: "100000\n", expectedOutput: "72\n", isSample: false },
      { input: "1000000\n", expectedOutput: "114\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nif n < 2:\n    print(0)\nelse:\n    sieve = bytearray(b'\\x01') * (n + 1)\n    sieve[0:2] = b'\\x00\\x00'\n    p = 2\n    while p * p <= n:\n        if sieve[p]:\n            sieve[p * p:n + 1:p] = b'\\x00' * (((n - p * p) // p) + 1)\n        p += 1\n    primes = [v for v in range(2, n + 1) if sieve[v]]\n    best = 0\n    for i in range(1, len(primes)):\n        best = max(best, primes[i] - primes[i - 1])\n    print(best)\n",
  },
  {
    slug: "learn-m1-checkpoint-bit-parity",
    title: "Set Bit Parity",
    statement:
      "রফি ল্যাবের ফ্ল্যাগ-সিস্টেমে প্রতিটি সংখ্যার বাইনারি রূপে কয়টা বিট `1` আছে সেটা দেখছে — এই গোনা সংখ্যাটার জোড়/বিজোড় অবস্থাকে সে সেট-বিটপ্যারিটি বলে। `n` সংখ্যক পূর্ণসংখ্যার জন্য প্রতিটির সেট-বিট প্যারিটি প্রিন্ট করো: সেট-বিটের সংখ্যা জোড় হলে `EVEN`, বিজোড় হলে `ODD`।\n\nউদাহরণ: `3 = 11` তে দুটি বিট → `EVEN`; `5 = 101` তে দুটি → `EVEN`; `1 = 1` তে একটি → `ODD`। শূন্যে কোনো বিট নেই, তাই `EVEN`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat:
      "এক লাইনে `n`টি শব্দ `EVEN` বা `ODD`, স্পেস দিয়ে আলাদা, ইনপুটের ক্রম অনুযায়ী।",
    constraints: "`1 <= n <= 200000`\n`0 <= a_i <= 2^31 - 1`",
    editorial:
      "## ধারণা\n\nসংখ্যার সেট-বিটের সংখ্যা গোনা হলো মূল কাজ। প্রতিটি সংখ্যার জন্য বাইনারি রূপে কতটা `1` আছে দেখতে হবে, তারপর সেই সংখ্যাটা জোড় কিনা যাচাই করতে হবে। মনে রেখো এখানে সংখ্যাটার নিজের জোড়/বিজোড় নয়, বিট গোনা জোড়/বিজোড় দেখা হচ্ছে — `3` নিজে বিজোড় হলেও তার দুই বিট মিলে জোড়।\n\n## ধাপে ধাপে\n\n1. `n` আর সব সংখ্যার লিস্ট পড়ে নাও।\n2. উত্তরের জন্য খালি লিস্ট রেখো।\n3. প্রতিটি সংখ্যার জন্য: `bin(x).count('1')` দিয়ে সেট-বিট গোনো, তারপর `% 2` করে জোড় হলে `EVEN`, নাহলে `ODD` লেখো।\n4. সব ফল স্পেস দিয়ে যোগ করে এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nout = []\nfor i in range(1, n + 1):\n    bits = bin(data[i]).count('1')\n    out.append('EVEN' if bits % 2 == 0 else 'ODD')\nprint(' '.join(out))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * log a_i)` (প্রতিটি সংখ্যার বাইনারি দৈর্ঘ্য মাত্র), স্পেস `O(n)` (আউটপুট)। `n = 200000`-এ Python-এও সহজে চলে।\n\n## সাধারণ ভুল\n\n- সংখ্যাটার নিজের `x % 2` দেখে সিদ্ধান্ত নেওয়া — `3` ও `5` এর উত্তর হবে ভুল; বিট গোনা লাগবে।\n- শূন্যকে বাদ দেওয়া বা খালি ইনপুট এলে ভাঙা — `0` এর সেট-বিট `0`, তাই `EVEN`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Implementation"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "ODD ODD EVEN\n", isSample: true },
      { input: "1\n0\n", expectedOutput: "EVEN\n", isSample: true },
      { input: "3\n3 5 6\n", expectedOutput: "EVEN EVEN EVEN\n", isSample: false },
      {
        input: "4\n1000000000 1000000000 0 1\n",
        expectedOutput: "ODD ODD EVEN ODD\n",
        isSample: false,
      },
      {
        input: "1\n2147483647\n",
        expectedOutput: "ODD\n",
        isSample: false,
      },
      { input: "2\n2 4\n", expectedOutput: "ODD ODD\n", isSample: false },
      {
        input: "500\n0 1234567 2469134 3703701 4938268 6172835 7407402 8641969 9876536 11111103 12345670 13580237 14814804 16049371 17283938 18518505 19753072 20987639 22222206 23456773 24691340 25925907 27160474 28395041 29629608 30864175 32098742 33333309 34567876 35802443 37037010 38271577 39506144 40740711 41975278 43209845 44444412 45678979 46913546 48148113 49382680 50617247 51851814 53086381 54320948 55555515 56790082 58024649 59259216 60493783 61728350 62962917 64197484 65432051 66666618 67901185 69135752 70370319 71604886 72839453 74074020 75308587 76543154 77777721 79012288 80246855 81481422 82715989 83950556 85185123 86419690 87654257 88888824 90123391 91357958 92592525 93827092 95061659 96296226 97530793 98765360 99999927 101234494 102469061 103703628 104938195 106172762 107407329 108641896 109876463 111111030 112345597 113580164 114814731 116049298 117283865 118518432 119752999 120987566 122222133 123456700 124691267 125925834 127160401 128394968 129629535 130864102 132098669 133333236 134567803 135802370 137036937 138271504 139506071 140740638 141975205 143209772 144444339 145678906 146913473 148148040 149382607 150617174 151851741 153086308 154320875 155555442 156790009 158024576 159259143 160493710 161728277 162962844 164197411 165431978 166666545 167901112 169135679 170370246 171604813 172839380 174073947 175308514 176543081 177777648 179012215 180246782 181481349 182715916 183950483 185185050 186419617 187654184 188888751 190123318 191357885 192592452 193827019 195061586 196296153 197530720 198765287 199999854 201234421 202468988 203703555 204938122 206172689 207407256 208641823 209876390 211110957 212345524 213580091 214814658 216049225 217283792 218518359 219752926 220987493 222222060 223456627 224691194 225925761 227160328 228394895 229629462 230864029 232098596 233333163 234567730 235802297 237036864 238271431 239505998 240740565 241975132 243209699 244444266 245678833 246913400 248147967 249382534 250617101 251851668 253086235 254320802 255555369 256789936 258024503 259259070 260493637 261728204 262962771 264197338 265431905 266666472 267901039 269135606 270370173 271604740 272839307 274073874 275308441 276543008 277777575 279012142 280246709 281481276 282715843 283950410 285184977 286419544 287654111 288888678 290123245 291357812 292592379 293826946 295061513 296296080 297530647 298765214 299999781 301234348 302468915 303703482 304938049 306172616 307407183 308641750 309876317 311110884 312345451 313580018 314814585 316049152 317283719 318518286 319752853 320987420 322221987 323456554 324691121 325925688 327160255 328394822 329629389 330863956 332098523 333333090 334567657 335802224 337036791 338271358 339505925 340740492 341975059 343209626 344444193 345678760 346913327 348147894 349382461 350617028 351851595 353086162 354320729 355555296 356789863 358024430 359258997 360493564 361728131 362962698 364197265 365431832 366666399 367900966 369135533 370370100 371604667 372839234 374073801 375308368 376542935 377777502 379012069 380246636 381481203 382715770 383950337 385184904 386419471 387654038 388888605 390123172 391357739 392592306 393826873 395061440 396296007 397530574 398765141 399999708 401234275 402468842 403703409 404937976 406172543 407407110 408641677 409876244 411110811 412345378 413579945 414814512 416049079 417283646 418518213 419752780 420987347 422221914 423456481 424691048 425925615 427160182 428394749 429629316 430863883 432098450 433333017 434567584 435802151 437036718 438271285 439505852 440740419 441974986 443209553 444444120 445678687 446913254 448147821 449382388 450616955 451851522 453086089 454320656 455555223 456789790 458024357 459258924 460493491 461728058 462962625 464197192 465431759 466666326 467900893 469135460 470370027 471604594 472839161 474073728 475308295 476542862 477777429 479011996 480246563 481481130 482715697 483950264 485184831 486419398 487653965 488888532 490123099 491357666 492592233 493826800 495061367 496295934 497530501 498765068 499999635 501234202 502468769 503703336 504937903 506172470 507407037 508641604 509876171 511110738 512345305 513579872 514814439 516049006 517283573 518518140 519752707 520987274 522221841 523456408 524690975 525925542 527160109 528394676 529629243 530863810 532098377 533332944 534567511 535802078 537036645 538271212 539505779 540740346 541974913 543209480 544444047 545678614 546913181 548147748 549382315 550616882 551851449 553086016 554320583 555555150 556789717 558024284 559258851 560493418 561727985 562962552 564197119 565431686 566666253 567900820 569135387 570369954 571604521 572839088 574073655 575308222 576542789 577777356 579011923 580246490 581481057 582715624 583950191 585184758 586419325 587653892 588888459 590123026 591357593 592592160 593826727 595061294 596295861 597530428 598764995 599999562 601234129 602468696 603703263 604937830 606172397 607406964 608641531 609876098 611110665 612345232 613579799 614814366 616048933\n",
        expectedOutput: "EVEN ODD ODD EVEN ODD ODD EVEN ODD ODD EVEN ODD EVEN EVEN ODD ODD EVEN ODD EVEN EVEN EVEN ODD EVEN EVEN EVEN EVEN ODD ODD EVEN ODD ODD EVEN ODD ODD EVEN EVEN ODD EVEN EVEN EVEN ODD ODD EVEN EVEN ODD EVEN EVEN EVEN EVEN EVEN ODD ODD EVEN ODD ODD EVEN EVEN ODD ODD ODD EVEN EVEN ODD ODD ODD ODD EVEN EVEN EVEN EVEN ODD ODD ODD EVEN EVEN EVEN ODD EVEN EVEN ODD ODD ODD ODD EVEN EVEN EVEN ODD ODD EVEN EVEN ODD EVEN ODD EVEN EVEN EVEN EVEN EVEN ODD ODD ODD ODD ODD EVEN ODD ODD ODD ODD ODD EVEN EVEN EVEN ODD ODD EVEN ODD ODD ODD ODD EVEN ODD EVEN ODD ODD ODD ODD EVEN ODD ODD ODD EVEN EVEN EVEN EVEN ODD EVEN EVEN EVEN ODD ODD EVEN ODD ODD ODD EVEN EVEN ODD EVEN EVEN EVEN ODD ODD EVEN EVEN ODD EVEN ODD ODD EVEN ODD EVEN ODD EVEN ODD ODD EVEN ODD EVEN EVEN EVEN ODD ODD ODD ODD EVEN EVEN EVEN EVEN EVEN ODD EVEN EVEN EVEN ODD ODD EVEN EVEN EVEN ODD EVEN ODD EVEN EVEN EVEN EVEN ODD ODD ODD EVEN ODD EVEN ODD ODD ODD EVEN EVEN ODD ODD EVEN ODD EVEN ODD EVEN ODD EVEN ODD ODD EVEN ODD EVEN EVEN EVEN ODD ODD ODD ODD ODD EVEN EVEN ODD ODD ODD ODD ODD ODD ODD ODD EVEN EVEN ODD EVEN EVEN EVEN ODD EVEN ODD EVEN ODD ODD ODD EVEN EVEN ODD ODD EVEN ODD EVEN ODD EVEN EVEN ODD EVEN EVEN EVEN EVEN EVEN ODD ODD EVEN EVEN ODD EVEN ODD EVEN EVEN ODD ODD ODD ODD EVEN ODD ODD ODD ODD EVEN ODD ODD EVEN ODD EVEN EVEN ODD EVEN EVEN ODD EVEN ODD EVEN EVEN ODD ODD ODD EVEN EVEN EVEN EVEN ODD ODD EVEN EVEN EVEN ODD ODD ODD ODD EVEN ODD ODD EVEN EVEN EVEN ODD ODD EVEN ODD ODD ODD ODD ODD EVEN EVEN ODD ODD EVEN EVEN EVEN ODD EVEN ODD ODD ODD ODD ODD ODD ODD ODD EVEN EVEN ODD EVEN EVEN EVEN ODD EVEN EVEN EVEN EVEN ODD EVEN EVEN EVEN EVEN ODD EVEN EVEN ODD ODD ODD EVEN EVEN EVEN EVEN EVEN EVEN EVEN ODD EVEN EVEN ODD ODD ODD EVEN EVEN EVEN ODD EVEN EVEN EVEN ODD ODD ODD ODD ODD ODD ODD EVEN ODD ODD ODD EVEN EVEN ODD EVEN ODD ODD ODD ODD EVEN EVEN EVEN EVEN ODD ODD ODD EVEN EVEN ODD ODD EVEN EVEN ODD ODD EVEN EVEN ODD ODD EVEN EVEN ODD ODD EVEN ODD EVEN EVEN EVEN ODD EVEN EVEN ODD EVEN ODD EVEN ODD ODD ODD ODD EVEN ODD EVEN ODD ODD ODD ODD EVEN ODD EVEN EVEN ODD EVEN ODD EVEN ODD EVEN ODD EVEN ODD ODD ODD ODD ODD ODD ODD EVEN EVEN ODD EVEN ODD ODD ODD EVEN ODD EVEN ODD EVEN ODD ODD ODD EVEN ODD ODD EVEN EVEN EVEN ODD ODD ODD EVEN ODD EVEN EVEN EVEN\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nout = []\nfor i in range(1, n + 1):\n    bits = bin(data[i]).count('1')\n    out.append('EVEN' if bits % 2 == 0 else 'ODD')\nprint(' '.join(out))\n",
  },
];
