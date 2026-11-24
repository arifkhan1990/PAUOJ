import { spawnSync } from "node:child_process";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import type {
  LearningModuleDefinition,
  LearningTopicDefinition,
} from "@/lib/learning/types";
import { LEARNING_PROBLEMS } from "@/server/db/learning";
import { ASSESSMENT_PROBLEMS } from "@/server/db/seed-assessment-problems";
import { SEED_PROBLEMS, type SeedProblem } from "@/server/db/seed-problems";

type Selection = {
  module: LearningModuleDefinition;
  topic?: LearningTopicDefinition;
  includeCheckpoint: boolean;
  onlyCheckpoint?: boolean;
};

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function normalize(raw: string): string {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

function bengali(text: string): boolean {
  return /[\u0980-\u09ff]/.test(text);
}

function selectedTopics(): Selection[] {
  const moduleSlug = argument("module");
  const topicSlug = argument("topic");
  const includeCheckpoint = !process.argv.includes("--no-checkpoint");
  const modules = LEARNING_MODULES.filter((module) => module.track !== "sql");
  if (topicSlug) {
    for (const definition of modules) {
      const topic = definition.topics.find((item) => item.slug === topicSlug);
      if (topic) return [{ module: definition, topic, includeCheckpoint: false }];
    }
    throw new Error(`Unknown topic: ${topicSlug}`);
  }
  if (moduleSlug) {
    const definition = modules.find(
      (item) => item.slug === moduleSlug,
    );
    if (!definition) throw new Error(`Unknown module: ${moduleSlug}`);
    return [
      {
        module: definition,
        includeCheckpoint,
        onlyCheckpoint: process.argv.includes("--checkpoint"),
      },
    ];
  }
  return modules
    .filter((module) => module.status === "LIVE")
    .map((module) => ({ module, includeCheckpoint }));
}

function topicProblemSlugs(topic: LearningTopicDefinition): string[] {
  return [
    ...topic.guidedProblemSlugs,
    ...topic.practiceProblemSlugs.easy,
    ...topic.practiceProblemSlugs.medium,
    ...topic.practiceProblemSlugs.hard,
    ...topic.extraProblemSlugs,
  ];
}

function main(): void {
  const problems = new Map<string, SeedProblem>();
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const problem of LEARNING_PROBLEMS) {
    if (seen.has(problem.slug)) {
      errors.push(`Duplicate learning problem slug: ${problem.slug}`);
      continue;
    }
    seen.add(problem.slug);
    problems.set(problem.slug, problem);
  }
  for (const problem of [...SEED_PROBLEMS, ...ASSESSMENT_PROBLEMS]) {
    if (problems.has(problem.slug)) {
      errors.push(`Learning problem collides with an existing seed: ${problem.slug}`);
    }
  }

  const selections = selectedTopics();
  const skipRun = process.argv.includes("--no-run");
  const explicitSelection = Boolean(argument("module") || argument("topic"));
  let checkedProblems = 0;
  let checkedTests = 0;

  for (const selection of selections) {
    const { module, topic, includeCheckpoint, onlyCheckpoint } = selection;
    if (module.status !== "LIVE") {
      if (!explicitSelection) continue;
      process.stderr.write(
        `Warning: ${module.slug} is still PLANNED; validating it anyway.\n`,
      );
    }
    const topics = onlyCheckpoint ? [] : topic ? [topic] : module.topics;
    const moduleSlugs = new Set<string>();

    const checkProblem = (slug: string, label: string) => {
      if (moduleSlugs.has(slug)) {
        errors.push(`${module.slug}: problem reused within the module: ${slug}`);
      }
      moduleSlugs.add(slug);
      const problem = problems.get(slug);
      if (!problem) {
        errors.push(`${module.slug}/${label}: missing problem ${slug}`);
        return;
      }
      checkedProblems += 1;
      if (problem.tests.length < 5) {
        errors.push(`${slug}: needs at least 5 tests, found ${problem.tests.length}`);
      }
      const samples = problem.tests.filter((test) => test.isSample).length;
      if (samples < 2) {
        errors.push(`${slug}: needs at least 2 samples, found ${samples}`);
      }
      if (!bengali(problem.statement)) {
        errors.push(`${slug}: statement should be in Bangla`);
      }
      if (problem.editorial.length < 250 || !problem.editorial.includes("```")) {
        errors.push(`${slug}: editorial needs an explanation and a fenced code block`);
      }
      if (!problem.referencePython.trim()) {
        errors.push(`${slug}: referencePython is empty`);
      }
      if (!skipRun && problem.referencePython.trim()) {
        for (const [index, test] of problem.tests.entries()) {
          checkedTests += 1;
          const result = spawnSync(
            process.env.PYTHON ?? "python3",
            ["-I", "-c", problem.referencePython],
            {
              input: test.input,
              encoding: "utf8",
              timeout: 5_000,
              maxBuffer: 10 * 1024 * 1024,
            },
          );
          if (result.error) {
            errors.push(
              `${slug} test ${index + 1}: could not run Python (${result.error.message})`,
            );
            break;
          }
          if (result.status !== 0) {
            const stderr = (result.stderr ?? "").split("\n").slice(0, 3).join(" ");
            errors.push(
              `${slug} test ${index + 1}: solution exited ${result.status}: ${stderr}`,
            );
            continue;
          }
          if (normalize(result.stdout ?? "") !== normalize(test.expectedOutput)) {
            errors.push(
              `${slug} test ${index + 1}: output mismatch (expected ${JSON.stringify(
                normalize(test.expectedOutput),
              )}, got ${JSON.stringify(normalize(result.stdout ?? ""))})`,
            );
          }
        }
      }
    };

    for (const item of topics) {
      if (item.guidedProblemSlugs.length < 2) {
        errors.push(`${module.slug}/${item.slug}: needs at least 2 guided problems`);
      }
      const workshop = module.practiceTier === "WORKSHOP";
      const fullTier = module.practiceTier === "FULL";
      const easyTarget = workshop ? 0 : fullTier ? 3 : 1;
      const mediumTarget = workshop ? 0 : fullTier ? 3 : 1;
      const hardTarget = workshop ? 0 : fullTier ? 2 : 1;
      if (item.practiceProblemSlugs.easy.length < easyTarget) {
        errors.push(
          `${module.slug}/${item.slug}: needs at least ${easyTarget} easy practice problems`,
        );
      }
      if (item.practiceProblemSlugs.medium.length < mediumTarget) {
        errors.push(
          `${module.slug}/${item.slug}: needs at least ${mediumTarget} medium practice problems`,
        );
      }
      if (item.practiceProblemSlugs.hard.length < hardTarget) {
        errors.push(
          `${module.slug}/${item.slug}: needs at least ${hardTarget} hard practice problems`,
        );
      }
      if (!workshop && item.extraProblemSlugs.length < 2) {
        errors.push(`${module.slug}/${item.slug}: needs at least 2 extra problems`);
      }
      if (workshop && item.extraProblemSlugs.length < 1) {
        errors.push(
          `${module.slug}/${item.slug}: needs at least 1 solo problem`,
        );
      }
      if (item.concept.length < 1_000 || !item.concept.includes("##")) {
        errors.push(
          `${module.slug}/${item.slug}: concept note needs at least 1,000 characters and sections`,
        );
      }
      for (const slug of topicProblemSlugs(item)) checkProblem(slug, item.slug);
    }

    if (includeCheckpoint && module.checkpoint) {
      if (module.checkpoint.problemSlugs.length !== 3) {
        errors.push(`${module.slug}: checkpoint should have exactly 3 problems`);
      }
      for (const slug of module.checkpoint.problemSlugs) {
        checkProblem(slug, "checkpoint");
      }
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`Learning curriculum validation failed:\n`);
    for (const error of errors.slice(0, 60)) process.stderr.write(`- ${error}\n`);
    if (errors.length > 60) {
      process.stderr.write(`- …and ${errors.length - 60} more\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `Learning curriculum OK: ${checkedProblems} problems, ${checkedTests} test runs.\n`,
  );
}

main();
