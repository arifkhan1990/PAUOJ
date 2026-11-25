import { describe, expect, it } from "vitest";
import { LEARNING_MODULES } from "./modules";
import { LEARNING_ROUTE_SLUGS } from "./route-slugs";
import {
  getCurriculumTopicPosition,
  getCurriculumTopicSequence,
  getLessonPagerData,
  getTrackPagerData,
} from "./sequence";
import { SQL_PROJECT_TICKETS } from "./sql-project";

describe("lesson pager sequence", () => {
  it("numbers every module topic contiguously from one", () => {
    for (const track of LEARNING_MODULES) {
      const positions = track.topics.map(
        (topic) => getLessonPagerData(track, topic.slug)?.position ?? 0,
      );
      expect(positions).toEqual(
        track.topics.map((_, index) => index + 1),
      );
      expect(new Set(positions).size).toBe(track.topics.length);
    }
  });

  it("returns null for an unknown topic", () => {
    const track = LEARNING_MODULES[0];
    expect(getLessonPagerData(track, "not-a-topic")).toBeNull();
  });

  it("opens the first lesson with the track overview", () => {
    const track = LEARNING_MODULES[0];
    const first = track.topics[0];
    const data = getLessonPagerData(track, first.slug);
    expect(data).not.toBeNull();
    if (!data) return;

    expect(data.previous).toMatchObject({
      kind: "overview",
      eyebrow: "Previous",
      href: `/learn/${track.slug}`,
      title: "Track overview",
    });
    expect(data.previous.meta).toBe(`${track.topics.length} topics`);
    expect(data.next).toMatchObject({
      kind: "topic",
      eyebrow: "Next",
      href: `/learn/${track.slug}/${track.topics[1].slug}`,
    });
    expect(data.next.meta).toBe(
      `Topic 02 of ${String(track.topics.length).padStart(2, "0")}`,
    );
    expect(data.backHref).toBe(`/learn/${track.slug}`);
    expect(data.position).toBe(1);
    expect(data.total).toBe(track.topics.length);
  });

  it("links the middle lesson to its neighbours", () => {
    const track = LEARNING_MODULES[2];
    const data = getLessonPagerData(track, track.topics[1].slug);
    expect(data).not.toBeNull();
    if (!data) return;

    expect(data.previous.href).toBe(
      `/learn/${track.slug}/${track.topics[0].slug}`,
    );
    expect(data.previous.eyebrow).toBe("Previous");
    expect(data.previous.meta).toBe("Topic 01 of 05");
    expect(data.next.href).toBe(
      `/learn/${track.slug}/${track.topics[2].slug}`,
    );
    expect(data.next.eyebrow).toBe("Next");
    expect(data.next.meta).toBe("Topic 03 of 05");
  });

  it("ends the last lesson on the module checkpoint", () => {
    const track = LEARNING_MODULES.find((item) => item.checkpoint !== null);
    expect(track).toBeDefined();
    if (!track?.checkpoint) return;

    const last = track.topics[track.topics.length - 1];
    const data = getLessonPagerData(track, last.slug);
    expect(data).not.toBeNull();
    if (!data) return;

    expect(data.next).toMatchObject({
      kind: "checkpoint",
      eyebrow: "Next",
      href: `/learn/${track.slug}#checkpoint`,
      title: track.checkpoint.title,
      subtitle: track.checkpoint.titleBn,
    });
    expect(data.next.meta).toBe(
      `${track.checkpoint.durationMinutes} min · ${track.checkpoint.problemSlugs.length} problems`,
    );
  });

  it("falls back to the overview when the module has no checkpoint", () => {
    const track = LEARNING_MODULES[0];
    const withoutCheckpoint = { ...track, checkpoint: null };
    const last = track.topics[track.topics.length - 1];
    const data = getLessonPagerData(withoutCheckpoint, last.slug);
    expect(data?.next).toMatchObject({
      kind: "overview",
      eyebrow: "Next",
      href: `/learn/${track.slug}`,
      title: "Back to track",
    });
  });
});

describe("track pager sequence", () => {
  it("follows the curriculum module order", () => {
    const ordered = [...LEARNING_MODULES].sort((a, b) => a.order - b.order);
    expect(
      ordered.map((track) => getTrackPagerData(track.slug)?.position),
    ).toEqual(ordered.map((_, index) => index + 1));
  });

  it("returns null for an unknown track", () => {
    expect(getTrackPagerData("not-a-track")).toBeNull();
  });

  it("has open boundaries at both ends", () => {
    const ordered = [...LEARNING_MODULES].sort((a, b) => a.order - b.order);
    const first = getTrackPagerData(ordered[0].slug);
    const last = getTrackPagerData(ordered[ordered.length - 1].slug);

    expect(first?.previous).toBeNull();
    expect(first?.next?.href).toBe(`/learn/${ordered[1].slug}`);
    expect(last?.next).toBeNull();
    expect(last?.previous?.href).toBe(
      `/learn/${ordered[ordered.length - 2].slug}`,
    );
  });

  it("labels toolkit tracks as the career toolkit", () => {
    const docker = LEARNING_MODULES.find(
      (track) => track.slug === "docker-cicd",
    );
    expect(docker).toBeDefined();
    if (!docker) return;

    const data = getTrackPagerData(docker.slug);
    expect(data?.previous?.subtitle).toContain("Career toolkit");
    expect(data?.previous?.href).toBe("/learn/git-github");
  });
});

describe("curriculum topic sequence", () => {
  const sequence = getCurriculumTopicSequence();

  it("numbers the whole curriculum contiguously with unique keys", () => {
    expect(sequence.map((entry) => entry.position)).toEqual(
      sequence.map((_, index) => index + 1),
    );
    const keys = sequence.map(
      (entry) => `${entry.moduleSlug}/${entry.topicSlug}`,
    );
    expect(new Set(keys).size).toBe(sequence.length);
  });

  it("matches the lightweight route index", () => {
    const expected = Object.entries(LEARNING_ROUTE_SLUGS).flatMap(
      ([moduleSlug, topicSlugs]) =>
        topicSlugs.map((topicSlug) => `${moduleSlug}/${topicSlug}`),
    );
    expect(
      sequence.map((entry) => `${entry.moduleSlug}/${entry.topicSlug}`),
    ).toEqual(expected);
  });

  it("positions every SQL project ticket topic", () => {
    for (const ticket of Object.values(SQL_PROJECT_TICKETS)) {
      expect(
        getCurriculumTopicPosition(ticket.moduleSlug, ticket.topicSlug),
      ).not.toBeNull();
    }
  });

  it("orders the SQL curriculum from orientation to capstone", () => {
    const orientation = getCurriculumTopicPosition("basic-sql", "orientation");
    const windowThinking = getCurriculumTopicPosition(
      "advanced-sql",
      "window-thinking",
    );
    const capstone = getCurriculumTopicPosition("advanced-sql", "capstone");

    expect(orientation).not.toBeNull();
    expect(windowThinking).not.toBeNull();
    expect(capstone).not.toBeNull();
    if (orientation === null || windowThinking === null || capstone === null) {
      return;
    }
    expect(orientation).toBeLessThan(windowThinking);
    expect(windowThinking).toBeLessThan(capstone);
  });

  it("returns null for unknown topics", () => {
    expect(getCurriculumTopicPosition("basic-sql", "not-a-topic")).toBeNull();
    expect(getCurriculumTopicPosition("not-a-track", "orientation")).toBeNull();
  });
});
