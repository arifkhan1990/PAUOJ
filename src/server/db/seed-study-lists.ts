import { count, eq, inArray } from "drizzle-orm";
import type { StudyListLevel } from "@/lib/study-list-types";
import { getDb } from "./index";
import {
  problems,
  studyListItems,
  studyListSections,
  studyLists,
} from "./schema";

type SeedStudyListSection = {
  title: string;
  description: string;
  problemSlugs: string[];
};

type SeedStudyList = {
  slug: string;
  title: string;
  description: string;
  level: StudyListLevel;
  estimatedMinutes: number | null;
  isFeatured: boolean;
  sections: SeedStudyListSection[];
};

const SEED_STUDY_LISTS: SeedStudyList[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description:
      "A short warm-up path: input/output, arrays and a first simulation problem.",
    level: "BEGINNER",
    estimatedMinutes: 60,
    isFeatured: true,
    sections: [
      {
        title: "Input & output",
        description: "Read two numbers and print their sum.",
        problemSlugs: ["a-plus-b"],
      },
      {
        title: "Arrays",
        description: "Traverse and rotate a sequence.",
        problemSlugs: ["reverse-array", "array-rotation"],
      },
      {
        title: "Simulation",
        description: "Step through a string with a stack.",
        problemSlugs: ["balanced-brackets"],
      },
    ],
  },
  {
    slug: "dp-starter",
    title: "Dynamic programming starter",
    description: "Move from matrix basics to classic DP and shortest paths.",
    level: "INTERMEDIATE",
    estimatedMinutes: 120,
    isFeatured: false,
    sections: [
      {
        title: "Matrix basics",
        description: "Practise nested loops on a grid.",
        problemSlugs: ["matrix-multiplication"],
      },
      {
        title: "Classic DP",
        description: "Build a table of best answers.",
        problemSlugs: ["longest-increasing-subsequence"],
      },
      {
        title: "Shortest paths",
        description: "Relax edges until distances settle.",
        problemSlugs: ["shortest-path"],
      },
    ],
  },
  {
    slug: "array-foundations",
    title: "Array foundations",
    description:
      "Traversal, counting and two-pointer patterns on one-dimensional arrays.",
    level: "BEGINNER",
    estimatedMinutes: 75,
    isFeatured: true,
    sections: [
      {
        title: "Traversal",
        description: "Scan every element once.",
        problemSlugs: ["learn-m1-max-in-array", "learn-m1-sum-first-n"],
      },
      {
        title: "Counting & sets",
        description: "Spot duplicates and count pairs.",
        problemSlugs: ["learn-m1-duplicate-detector", "learn-m1-count-pairs"],
      },
      {
        title: "Two pointers",
        description: "Move two indices toward the answer.",
        problemSlugs: ["learn-m1-pair-difference"],
      },
    ],
  },
  {
    slug: "graph-and-dp-sprint",
    title: "Graph and DP sprint",
    description:
      "A harder mixed sprint across graphs, dynamic programming, strings and matrices.",
    level: "ADVANCED",
    estimatedMinutes: 120,
    isFeatured: false,
    sections: [
      {
        title: "Graphs",
        description: "Weighted shortest path practice.",
        problemSlugs: ["shortest-path"],
      },
      {
        title: "DP",
        description: "Sequence DP with a running state.",
        problemSlugs: ["longest-increasing-subsequence"],
      },
      {
        title: "Strings",
        description: "Stack-based validation.",
        problemSlugs: ["balanced-brackets"],
      },
      {
        title: "Matrix",
        description: "Triple loops on matrices.",
        problemSlugs: ["matrix-multiplication"],
      },
    ],
  },
];

/** Curated metadata written on create and on the one-time legacy upgrade. */
function seedMetadata(definition: SeedStudyList) {
  return {
    title: definition.title,
    description: definition.description,
    isPublic: true,
    level: definition.level,
    estimatedMinutes: definition.estimatedMinutes,
    isFeatured: definition.isFeatured,
  };
}

async function countSections(listId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(studyListSections)
    .where(eq(studyListSections.listId, listId));
  return Number(row?.value ?? 0);
}

async function replaceSeedSections(
  listId: string,
  sections: SeedStudyListSection[],
  problemIdsBySlug: Map<string, string>,
): Promise<void> {
  const db = getDb();
  const prepared = sections
    .map((section) => ({
      ...section,
      problemIds: section.problemSlugs
        .map((slug) => problemIdsBySlug.get(slug))
        .filter((id): id is string => Boolean(id)),
    }))
    .filter((section) => section.problemIds.length > 0);
  if (prepared.length === 0) return;

  await db.transaction(async (tx) => {
    await tx.delete(studyListItems).where(eq(studyListItems.listId, listId));
    await tx
      .delete(studyListSections)
      .where(eq(studyListSections.listId, listId));
    const inserted = await tx
      .insert(studyListSections)
      .values(
        prepared.map((section, index) => ({
          listId,
          title: section.title,
          description: section.description,
          position: index + 1,
        })),
      )
      .returning({
        id: studyListSections.id,
        position: studyListSections.position,
      });
    const idByPosition = new Map(inserted.map((row) => [row.position, row.id]));
    const items: Array<{
      listId: string;
      problemId: string;
      sectionId: string;
      position: number;
    }> = [];
    let position = 0;
    prepared.forEach((section, index) => {
      const sectionId = idByPosition.get(index + 1);
      if (!sectionId) return;
      for (const problemId of section.problemIds) {
        position += 1;
        items.push({ listId, problemId, sectionId, position });
      }
    });
    if (items.length > 0) {
      await tx.insert(studyListItems).values(items);
    }
  });
}

export async function seedStudyLists(adminId: string): Promise<void> {
  const db = getDb();
  const problemSlugs = [
    ...new Set(
      SEED_STUDY_LISTS.flatMap((definition) =>
        definition.sections.flatMap((section) => section.problemSlugs),
      ),
    ),
  ];
  const problemRows = await db
    .select({ id: problems.id, slug: problems.slug })
    .from(problems)
    .where(inArray(problems.slug, problemSlugs));
  const problemIdsBySlug = new Map(
    problemRows.map((row) => [row.slug, row.id]),
  );
  const missing = problemSlugs.filter((slug) => !problemIdsBySlug.has(slug));
  if (missing.length > 0) {
    process.stdout.write(
      `Skipping study list problems that do not exist: ${missing.join(", ")}\n`,
    );
  }

  for (const definition of SEED_STUDY_LISTS) {
    const [existing] = await db
      .select({ id: studyLists.id })
      .from(studyLists)
      .where(eq(studyLists.slug, definition.slug))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(studyLists)
        .values({
          slug: definition.slug,
          ...seedMetadata(definition),
          createdBy: adminId,
        })
        .onConflictDoNothing({ target: studyLists.slug })
        .returning({ id: studyLists.id });
      if (created) {
        await replaceSeedSections(
          created.id,
          definition.sections,
          problemIdsBySlug,
        );
      }
      continue;
    }

    // Seeding owns a plan only until it has sections: after that the plan is
    // admin-edited content, so its row, sections and items stay untouched.
    // A plan with zero sections is a legacy flat plan and is upgraded once.
    if ((await countSections(existing.id)) > 0) continue;

    await db
      .update(studyLists)
      .set({ ...seedMetadata(definition), updatedAt: new Date() })
      .where(eq(studyLists.id, existing.id));
    await replaceSeedSections(
      existing.id,
      definition.sections,
      problemIdsBySlug,
    );
  }
}
