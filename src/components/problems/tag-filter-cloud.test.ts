import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TagFilterCloud } from "@/components/problems/tag-filter-cloud";

type TagItem = { name: string; slug: string; href: string; active: boolean };
type CloudProps = React.ComponentProps<typeof TagFilterCloud>;

const BASE_NAMES = [
  "Arrays",
  "Dynamic Programming",
  "Graph Theory",
  "Two Pointers",
  "Binary Search",
  "String Matching",
  "Greedy",
  "Backtracking",
  "Union Find",
  "Segment Tree",
  "Bit Manipulation",
  "Sliding Window",
];

function makeTags(count: number, activeSlug?: string): TagItem[] {
  return Array.from({ length: count }, (_, index) => {
    const slug = `tag-${index}`;
    return {
      name: `${BASE_NAMES[index % BASE_NAMES.length]} ${Math.floor(index / BASE_NAMES.length) + 1}`,
      slug,
      href: `/problems?tag=${slug}`,
      active: slug === activeSlug,
    };
  });
}

/** 240 tags, one of them active — far beyond what a two-row collapsed list shows. */
const manyTags = makeTags(240, "tag-137");
const manyActive = manyTags.find((item) => item.active)!;

/** Small fixture keeps other filters in the href so escaping is exercised. */
const fewTags: TagItem[] = [
  {
    name: "Arrays",
    slug: "arrays",
    href: "/problems?difficulty=medium&tag=arrays",
    active: false,
  },
  {
    name: "Graph Theory",
    slug: "graph-theory",
    href: "/problems?difficulty=medium&tag=graph-theory",
    active: true,
  },
  {
    name: "Dynamic Programming",
    slug: "dp",
    href: "/problems?difficulty=medium&tag=dp",
    active: false,
  },
];
const fewActive = fewTags.find((item) => item.active)!;

function render(props: Partial<CloudProps> = {}) {
  return renderToStaticMarkup(
    createElement(TagFilterCloud, { tags: [], ...props } as CloudProps),
  );
}

function decodeAttr(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attribute(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return match ? decodeAttr(match[1]) : undefined;
}

function openingTags(html: string): string[] {
  return html.match(/<[a-zA-Z][^>]*>/g) ?? [];
}

function textOf(fragment: string) {
  return fragment
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function anchors(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    attrs: match[1],
    href: attribute(match[1], "href") ?? "",
    text: textOf(match[2]),
  }));
}

function buttons(html: string) {
  return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(
    (match) => ({ attrs: match[1], text: textOf(match[2]) }),
  );
}

function tagAnchors(html: string) {
  return anchors(html).filter((item) => item.href.includes("tag="));
}

function disclosureButton(html: string) {
  const found = buttons(html).filter((item) => /Show all\b/.test(item.text));
  expect(
    found,
    `expected exactly one "Show all ..." disclosure button, found ${found.length}`,
  ).toHaveLength(1);
  return found[0];
}

function clearLinks(html: string) {
  return anchors(html).filter((item) => /^Clear\b/i.test(item.text));
}

describe("TagFilterCloud server rendering (collapsed by default)", () => {
  it("renders a collapsed list wired to the disclosure button", () => {
    const html = render({ tags: manyTags });
    const button = disclosureButton(html);

    expect(attribute(button.attrs, "aria-expanded")).toBe("false");

    const controls = attribute(button.attrs, "aria-controls");
    expect(controls, "disclosure button needs a non-empty aria-controls").toBeTruthy();

    const target = openingTags(html).find(
      (tag) => attribute(tag, "id") === controls,
    );
    expect(
      target,
      `no element has id="${controls}"; aria-controls must match the list container id`,
    ).toBeDefined();
    expect(
      attribute(target!, "data-state"),
      `element #${controls} should carry data-state="collapsed"`,
    ).toBe("collapsed");

    const collapsedIds = openingTags(html)
      .filter((tag) => attribute(tag, "data-state") === "collapsed")
      .map((tag) => attribute(tag, "id"));
    expect(
      html,
      `collapsed marker found on ids: ${JSON.stringify(collapsedIds)}`,
    ).toContain('data-state="collapsed"');
  });

  it("labels the collapsed disclosure with the total tag count", () => {
    expect(disclosureButton(render({ tags: manyTags })).text).toContain(
      `Show all ${manyTags.length} tags`,
    );
    expect(disclosureButton(render({ tags: fewTags })).text).toContain(
      `Show all ${fewTags.length} tags`,
    );
  });

  it("keeps every tag in the DOM with its href even while collapsed", () => {
    const html = render({ tags: manyTags });
    const rendered = tagAnchors(html);

    expect(rendered).toHaveLength(manyTags.length);
    expect(new Set(rendered.map((item) => item.href))).toEqual(
      new Set(manyTags.map((item) => item.href)),
    );

    for (const tag of manyTags) {
      expect(rendered.some((item) => item.href === tag.href), tag.href).toBe(true);
    }
  });

  it("renders the active tag first and marks only it as current", () => {
    const html = render({ tags: manyTags });
    const rendered = tagAnchors(html);

    expect(rendered[0].href).toBe(manyActive.href);
    expect(rendered[0].text).toBe(manyActive.name);
    expect(attribute(rendered[0].attrs, "aria-current")).toBe("true");

    const current = rendered.filter(
      (item) => attribute(item.attrs, "aria-current") === "true",
    );
    expect(current).toHaveLength(1);
    expect(current[0].href).toBe(manyActive.href);

    const others = rendered.filter((item) => item.href !== manyActive.href);
    for (const other of others) {
      expect(
        attribute(other.attrs, "aria-current"),
        `${other.text} must not be marked current`,
      ).not.toBe("true");
    }
  });

  it("moves a non-leading active tag to the front without dropping others", () => {
    const html = render({ tags: fewTags });
    const rendered = tagAnchors(html);

    expect(rendered).toHaveLength(fewTags.length);
    expect(rendered[0].href).toBe(fewActive.href);
    expect(rendered[0].text).toBe(fewActive.name);
    expect(attribute(rendered[0].attrs, "aria-current")).toBe("true");
    expect(rendered.map((item) => item.href).sort()).toEqual(
      fewTags.map((item) => item.href).sort(),
    );
  });
});

describe("TagFilterCloud clear link", () => {
  it("renders a Clear link to clearHref", () => {
    const html = render({ tags: fewTags, clearHref: "/problems" });
    const clear = clearLinks(html);

    expect(clear).toHaveLength(1);
    expect(clear[0].href).toBe("/problems");
  });

  it("preserves a clearHref that carries query params", () => {
    const clearHref = "/problems?difficulty=medium";
    const clear = clearLinks(render({ tags: fewTags, clearHref }));

    expect(clear).toHaveLength(1);
    expect(clear[0].href).toBe(clearHref);
  });

  it("renders no Clear link when clearHref is omitted or null", () => {
    expect(clearLinks(render({ tags: fewTags }))).toHaveLength(0);
    expect(clearLinks(render({ tags: fewTags, clearHref: null }))).toHaveLength(0);
  });
});

describe("TagFilterCloud empty state", () => {
  it("renders no tag links or disclosure control for an empty tag list", () => {
    const html = render({ tags: [] });

    expect(tagAnchors(html)).toHaveLength(0);
    expect(buttons(html)).toHaveLength(0);
    expect(clearLinks(html)).toHaveLength(0);
    expect(html).not.toContain("Show all");
  });

  it("renders nothing at all for an empty tag list", () => {
    expect(render({ tags: [] })).toBe("");
  });

  it("renders nothing for an empty tag list even when clearHref is provided", () => {
    expect(render({ tags: [], clearHref: "/problems" })).toBe("");
  });
});
