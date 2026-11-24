import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { USER_STATUS_LABELS } from "@/lib/profile-fields";
import { ProfileDetails, type ProfileDetailsProps } from "./profile-details";

const empty: ProfileDetailsProps = {
  status: null,
  companyName: null,
  jobTitle: null,
  skills: [],
};

function render(props: ProfileDetailsProps) {
  return renderToStaticMarkup(createElement(ProfileDetails, props));
}

describe("ProfileDetails", () => {
  it("renders nothing when every field is empty", () => {
    expect(render(empty)).toBe("");
    expect(render({ ...empty, skills: ["", "   "] })).toBe("");
  });

  it("renders the status pill, company line and skill chips", () => {
    const html = render({
      status: "EMPLOYED",
      companyName: "Acme <Labs>",
      jobTitle: "Backend Engineer",
      skills: ["TypeScript", "SQL"],
    });

    expect(html).toContain(USER_STATUS_LABELS.EMPLOYED);
    expect(html).toContain("Backend Engineer at Acme &lt;Labs&gt;");
    expect(html).toContain('aria-label="Skills"');
    expect(html).toContain("TypeScript");
    expect(html).toContain("SQL");
  });

  it("renders whichever company or job title exists", () => {
    expect(render({ ...empty, jobTitle: "Engineer" })).toContain("Engineer");
    expect(render({ ...empty, companyName: "Acme" })).toContain("Acme");
  });

  it("drops blank skills and never renders private fields", () => {
    const html = render({
      ...empty,
      skills: ["Rust", "  ", ""],
    });

    expect(html).toContain("Rust");
    expect(html.match(/<li/g)).toHaveLength(1);
    expect(html).not.toMatch(/phone/i);
    expect(html).not.toMatch(/address/i);
    expect(html).not.toMatch(/t-?shirt/i);
    expect(html).not.toContain("+880");
  });
});
