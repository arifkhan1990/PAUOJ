import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SearchableSelect } from "./searchable-select";
import type { SelectOption } from "@/lib/select-options";

const options: SelectOption[] = [
  { value: "", label: "Any verdict" },
  { value: "AC", label: "Accepted" },
  { value: "WA", label: "Wrong answer", description: "Output mismatch" },
];

function render(
  props: Partial<React.ComponentProps<typeof SearchableSelect>> = {},
) {
  return renderToStaticMarkup(
    createElement(SearchableSelect, { options, ...props }),
  );
}

describe("SearchableSelect server rendering", () => {
  it("renders the custom combobox instead of a native select", () => {
    const html = render();
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("<select");
  });

  it("keeps GET form submission working through a hidden input", () => {
    const html = render({
      name: "status",
      defaultValue: "AC",
      "aria-label": "Verdict",
    });
    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="status"');
    expect(html).toContain('value="AC"');
    expect(html).toContain('aria-label="Verdict"');
  });

  it("shows the selected label and falls back to the placeholder", () => {
    expect(render({ defaultValue: "WA" })).toContain("Wrong answer");
    expect(render()).toContain("Any verdict");
    expect(
      render({
        options: options.filter((option) => option.value !== ""),
        placeholder: "Pick a verdict",
      }),
    ).toContain("Pick a verdict");
  });
});
