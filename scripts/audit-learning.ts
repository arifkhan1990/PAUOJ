import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import type { LearningModuleDefinition } from "@/lib/learning/types";
import { LEARNING_PROBLEMS } from "@/server/db/learning";
import type { SeedProblem } from "@/server/db/seed-problems";

type Options = {
  moduleSlug: string | null;
  topicSlug: string | null;
  skipEditorialRun: boolean;
};

const REQUIRED_CONCEPT_SECTIONS = [
  "কেন দরকার",
  "মূল ধারণা",
  "কোডে দেখি",
  "ধাপে ধাপে",
  "সাধারণ ভুল",
];

const REQUIRED_EDITORIAL_SECTIONS = [
  "ধারণা",
  "ধাপে ধাপে",
  "কমপ্লেক্সিটি",
  "সাধারণ ভুল",
];

const FORBIDDEN_PHRASES = [
  "আপনি",
  "আপনার",
  "আপনাকে",
  "তুই",
  "তোর",
  "তোকে",
  "রাফি",
  "তানভীর",
  "দৈর্থ্য",
  "তবেও",
  "কোনোভাগ",
  "লিস্ট কমন",
  "হোয়ার্ক",
  "সেক্ষেত্রে",
  "লেখা হচ্ছে",
  "placeholder",
  "TODO",
];

const HONORIFIC_IMPERATIVE =
  /(^|[\s।,;:!?])(করুন|নিন|বলুন|দেখুন|রাখুন|লিখুন|পড়ুন|বুঝুন|শুনুন|ভাবুন|ছাড়ুন|তুলুন|ফেলুন|বসান|ঢোকান|বাড়ান|মেলান|পাঠান|নামুন|মানুন|চলুন|ধরুন|গুনুন|খুঁজুন|উত্তর দিন)(?=$|[\s।,;:!?])/;

const POINTS: Record<string, number> = {
  EASY: 100,
  MEDIUM: 200,
  HARD: 300,
};

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function normalize(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n+$/, "");
}

function extractPython(editorial: string): string | null {
  const blocks = [...editorial.matchAll(/```python\n([\s\S]*?)```/g)];
  return blocks.length > 0 ? (blocks[blocks.length - 1]?.[1] ?? null) : null;
}

function checkTables(
  text: string,
  label: string,
  errors: string[],
): void {
  let inFence = false;
  let expectedPipes: number | null = null;
  const lines = text.split("\n");
  for (const [index, line] of lines.entries()) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      expectedPipes = null;
      continue;
    }
    if (inFence || !trimmed.startsWith("|")) {
      expectedPipes = null;
      continue;
    }
    const pipes = (line.match(/(?<!\\)\|/g) ?? []).length;
    if (expectedPipes === null) {
      expectedPipes = pipes;
    } else if (pipes !== expectedPipes) {
      errors.push(
        `${label}: table row ${index + 1} has ${pipes} cells; expected ${expectedPipes}`,
      );
    }
  }
}

function checkLanguage(
  text: string,
  label: string,
  errors: string[],
): void {
  const prose = text
    .replace(/```[\s\S]*?```/g, "\n[diagram]\n")
    .replace(/`[^`\n]*`/g, "code")
    .split("\n")
    .map((line) => line.trimStart())
    .join("\n");
  for (const phrase of FORBIDDEN_PHRASES) {
    if (prose.includes(phrase)) {
      errors.push(`${label}: use of "${phrase}"`);
    }
  }
  if (/ {2,}/.test(prose)) errors.push(`${label}: double space`);
  if (/[ \t]+[।,;:]/.test(prose)) {
    errors.push(`${label}: space before punctuation`);
  }
  if (/[।]{2,}/.test(prose)) errors.push(`${label}: repeated danda`);
  if (HONORIFIC_IMPERATIVE.test(prose)) {
    errors.push(`${label}: honorific imperative; use the তুমি form`);
  }
  const fences = (text.match(/```/g) ?? []).length;
  if (fences % 2 !== 0) errors.push(`${label}: unbalanced code fences`);
  const inline = (text.match(/`/g) ?? []).length;
  if (inline % 2 !== 0) errors.push(`${label}: unbalanced inline backticks`);
}

function checkConcept(
  definition: LearningModuleDefinition,
  topicIndex: number,
  errors: string[],
): void {
  const topic = definition.topics[topicIndex];
  if (!topic) return;
  const label = `${definition.slug}/${topic.slug}/concept`;
  if (topic.concept.length < 1_000) {
    errors.push(`${label}: shorter than 1,000 characters`);
  }
  for (const section of REQUIRED_CONCEPT_SECTIONS) {
    if (!topic.concept.includes(section)) {
      errors.push(`${label}: missing section "${section}"`);
    }
  }
  if (!/\|\s*---/.test(topic.concept)) {
    errors.push(`${label}: missing a Markdown table`);
  }
  if (!/(```[\s\S]*?```)/.test(topic.concept)) {
    errors.push(`${label}: missing a fenced diagram/code block`);
  }
  checkLanguage(topic.concept, label, errors);
  checkTables(topic.concept, label, errors);
}

function checkDiagram(
  definition: LearningModuleDefinition,
  errors: string[],
): void {
  const diagram = definition.diagram;
  if (!diagram) {
    errors.push(`${definition.slug}: missing module diagram`);
    return;
  }
  if (!diagram.alt.trim()) {
    errors.push(`${definition.slug}/diagram: empty alt text`);
  }
  const path = join(process.cwd(), "public", diagram.src.replace(/^\//, ""));
  if (!existsSync(path)) {
    errors.push(`${definition.slug}/diagram: missing asset ${diagram.src}`);
    return;
  }
  const svg = readFileSync(path, "utf8");
  if (!/<title[\s>]/.test(svg) || !/<desc[\s>]/.test(svg)) {
    errors.push(`${definition.slug}/diagram: SVG needs title and desc`);
  }
}

function checkCheckpoint(
  definition: LearningModuleDefinition,
  errors: string[],
): void {
  const checkpoint = definition.checkpoint;
  if (!checkpoint) return;
  const label = `${definition.slug}/checkpoint`;
  if (checkpoint.durationMinutes !== 45) {
    errors.push(`${label}: duration should be 45 minutes`);
  }
  if (checkpoint.problemSlugs.length !== 3) {
    errors.push(`${label}: should have exactly 3 problems`);
  }
  for (const [field, text] of [
    ["description", checkpoint.description],
    ["badge.description", checkpoint.badge.description],
  ] as const) {
    checkLanguage(text, `${label}/${field}`, errors);
    if (/সমাধান করেছেন|সমাধান করুন/.test(text)) {
      errors.push(`${label}/${field}: use "সমাধান করেছ" (তুমি form)`);
    }
  }
}

function checkProblem(
  problem: SeedProblem,
  label: string,
  options: Options,
  errors: string[],
): void {
  if (problem.tests.length < 5) {
    errors.push(`${label}: fewer than 5 tests`);
  }
  if (problem.tests.filter((test) => test.isSample).length < 2) {
    errors.push(`${label}: fewer than 2 samples`);
  }
  if (problem.statement.length < 120) {
    errors.push(`${label}: statement is very short`);
  }
  if (problem.editorial.length < 250) {
    errors.push(`${label}: editorial is very short`);
  }
  for (const section of REQUIRED_EDITORIAL_SECTIONS) {
    if (!problem.editorial.includes(section)) {
      errors.push(`${label}: editorial missing "${section}"`);
    }
  }
  if (!problem.editorial.includes("```")) {
    errors.push(`${label}: editorial has no fenced code`);
  }
  checkLanguage(problem.statement, `${label}/statement`, errors);
  checkTables(problem.statement, `${label}/statement`, errors);
  checkLanguage(problem.editorial, `${label}/editorial`, errors);
  checkTables(problem.editorial, `${label}/editorial`, errors);
  if (POINTS[problem.difficulty] !== problem.points) {
    errors.push(
      `${label}: ${problem.difficulty} problem has ${problem.points} points`,
    );
  }

  const editorialCode = extractPython(problem.editorial);
  if (!editorialCode) {
    errors.push(`${label}: editorial has no Python code block`);
    return;
  }
  if (options.skipEditorialRun) return;
  for (const [index, test] of problem.tests.entries()) {
    const result = spawnSync(
      process.env.PYTHON ?? "python3",
      ["-I", "-c", editorialCode],
      {
        input: test.input,
        encoding: "utf8",
        timeout: 5_000,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    if (result.error) {
      errors.push(`${label} editorial test ${index + 1}: ${result.error.message}`);
      break;
    }
    if (result.status !== 0) {
      const stderr = (result.stderr ?? "").split("\n")[0] ?? "";
      errors.push(
        `${label} editorial test ${index + 1}: exited ${result.status} (${stderr})`,
      );
      continue;
    }
    if (normalize(result.stdout ?? "") !== normalize(test.expectedOutput)) {
      errors.push(
        `${label} editorial test ${index + 1}: wrong output (expected ${JSON.stringify(
          normalize(test.expectedOutput),
        )}, got ${JSON.stringify(normalize(result.stdout ?? ""))})`,
      );
    }
  }
}

function main(): void {
  const options: Options = {
    moduleSlug: arg("module"),
    topicSlug: arg("topic"),
    skipEditorialRun: process.argv.includes("--skip-editorial-run"),
  };
  const problems = new Map(LEARNING_PROBLEMS.map((problem) => [problem.slug, problem]));
  const modules = LEARNING_MODULES.filter(
    (module) =>
      module.status === "LIVE" &&
      // SQL tracks are project problems validated by tests, not the Python editorial pipeline.
      module.track !== "sql" &&
      (!options.moduleSlug || module.slug === options.moduleSlug),
  );
  if (options.moduleSlug && modules.length === 0) {
    throw new Error(`Unknown or non-live module: ${options.moduleSlug}`);
  }

  const errors: string[] = [];
  let checkedProblems = 0;
  for (const definition of modules) {
    checkDiagram(definition, errors);
    if (!options.topicSlug) checkCheckpoint(definition, errors);
    const selectedTopics = options.topicSlug
      ? definition.topics.filter((topic) => topic.slug === options.topicSlug)
      : definition.topics;
    if (options.topicSlug && selectedTopics.length === 0) continue;
    for (const selectedTopic of selectedTopics) {
      const index = definition.topics.indexOf(selectedTopic);
      checkConcept(definition, index, errors);
      const topic = selectedTopic;
      const tiered = [
        [topic.practiceProblemSlugs.easy, "EASY"],
        [topic.practiceProblemSlugs.medium, "MEDIUM"],
        [topic.practiceProblemSlugs.hard, "HARD"],
      ] as const;
      for (const [slugs, expected] of tiered) {
        for (const slug of slugs) {
          const problem = problems.get(slug);
          if (!problem) continue;
          checkedProblems += 1;
          if (problem.difficulty !== expected) {
            errors.push(
              `${definition.slug}/${topic.slug}: ${expected.toLowerCase()} ${slug} is ${problem.difficulty}`,
            );
          }
          checkProblem(problem, `${definition.slug}/${slug}`, options, errors);
        }
      }
      for (const slug of [
        ...topic.guidedProblemSlugs,
        ...topic.extraProblemSlugs,
      ]) {
        const problem = problems.get(slug);
        if (!problem) continue;
        checkedProblems += 1;
        checkProblem(problem, `${definition.slug}/${slug}`, options, errors);
      }
    }
    for (const slug of options.topicSlug
      ? []
      : (definition.checkpoint?.problemSlugs ?? [])) {
      const problem = problems.get(slug);
      if (!problem) continue;
      checkedProblems += 1;
      checkProblem(problem, `${definition.slug}/${slug}`, options, errors);
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`Learning audit failed:\n`);
    for (const error of errors.slice(0, 80)) process.stderr.write(`- ${error}\n`);
    if (errors.length > 80) {
      process.stderr.write(`- …and ${errors.length - 80} more\n`);
    }
    process.exit(1);
  }
  process.stdout.write(
    `Learning audit OK: ${checkedProblems} problems, ${modules.length} modules.\n`,
  );
}

main();
