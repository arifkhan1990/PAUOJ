import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonPager, TrackPager } from "./lesson-pager";
import { LEARNING_MODULES } from "@/lib/learning/modules";

const track = LEARNING_MODULES[0];
const firstSlug = track.topics[0].slug;
const middleSlug = track.topics[1].slug;
const lastSlug = track.topics[track.topics.length - 1].slug;

function renderLesson(topicSlug: string): string {
  return renderToStaticMarkup(
    createElement(LessonPager, { module: track, topicSlug }),
  );
}

/** React escapes `&` in text nodes; compare against the rendered form. */
function text(value: string): string {
  return value.replace(/&/g, "&amp;");
}

describe("LessonPager", () => {
  it("opens the first lesson with the overview and the next topic", () => {
    const html = renderLesson(firstSlug);

    expect(html).toContain('aria-label="Lesson navigation"');
    expect(html).toContain("Topic 01 of 05");
    expect(html).toContain("Track overview");
    expect(html).toContain(`href="/learn/${track.slug}"`);
    expect(html).toContain("Previous");
    expect(html).toContain('rel="prev"');
    expect(html).toContain(text(track.topics[1].title));
    expect(html).toContain("Topic 02 of 05");
    expect(html).toContain('rel="next"');
    expect(html).toContain("Back to track");
    expect(html).toContain("All learning tracks");
  });

  it("links the middle lesson to both neighbours", () => {
    const html = renderLesson(middleSlug);

    expect(html).toContain(text(track.topics[0].title));
    expect(html).toContain(text(track.topics[2].title));
    expect(html).toContain(
      `href="/learn/${track.slug}/${track.topics[0].slug}"`,
    );
    expect(html).toContain(
      `href="/learn/${track.slug}/${track.topics[2].slug}"`,
    );
    expect(html).toContain("Topic 02 of 05");
    expect(html).toContain("Topic 01 of 05");
    expect(html).toContain("Topic 03 of 05");
  });

  it("ends the last lesson on the final checkpoint", () => {
    const html = renderLesson(lastSlug);
    const checkpoint = track.checkpoint;
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) return;

    expect(html).toContain("Final checkpoint");
    expect(html).toContain(checkpoint.title);
    expect(html).toContain(`href="/learn/${track.slug}#checkpoint"`);
    expect(html).toContain(
      `${checkpoint.durationMinutes} min · ${checkpoint.problemSlugs.length} problems`,
    );
    expect(html).toContain("Topic 05 of 05");
  });

  it("renders nothing for an unknown topic", () => {
    expect(renderLesson("not-a-topic")).toBe("");
  });
});

describe("TrackPager", () => {
  it("links the previous and next tracks", () => {
    const html = renderToStaticMarkup(
      createElement(TrackPager, { moduleSlug: "advanced-data-structures" }),
    );

    expect(html).toContain('aria-label="Track navigation"');
    expect(html).toContain("Track 06 of 11");
    expect(html).toContain("Dynamic Programming");
    expect(html).toContain("Advanced Algorithms");
    expect(html).toContain('href="/learn/dynamic-programming"');
    expect(html).toContain('href="/learn/advanced-algorithms"');
    expect(html).toContain("All learning tracks");
  });

  it("marks the first track and hides the missing previous", () => {
    const html = renderToStaticMarkup(
      createElement(TrackPager, { moduleSlug: "basic-programming-math" }),
    );

    expect(html).toContain("First track");
    expect(html).not.toContain('rel="prev"');
    expect(html).toContain('rel="next"');
  });

  it("renders nothing for an unknown track", () => {
    const html = renderToStaticMarkup(
      createElement(TrackPager, { moduleSlug: "not-a-track" }),
    );
    expect(html).toBe("");
  });
});
