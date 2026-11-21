import { describe, expect, it } from "vitest";
import { buildAssessmentInviteEmail } from "./mail";

const URL = "http://localhost:3000/assessments/midterm/invite/raw-token-123";

function build(overrides: Partial<Parameters<typeof buildAssessmentInviteEmail>[0]> = {}) {
  return buildAssessmentInviteEmail({
    candidateName: "Md. Rakib Hasan",
    assessmentTitle: "CSE-3B Midterm",
    startAt: "2026-11-21T10:00:00.000Z",
    endAt: "2026-11-21T12:00:00.000Z",
    durationMinutes: 60,
    url: URL,
    ...overrides,
  });
}

describe("buildAssessmentInviteEmail", () => {
  it("puts the assessment title in the subject and the personal link in the body", () => {
    const email = build();

    expect(email.subject).toBe("Assessment invite: CSE-3B Midterm");
    expect(email.text).toContain(URL);
    expect(email.html).toContain(URL);
    expect(email.text).toContain("This link is personal; do not forward it.");
    expect(email.html).toContain("This link is personal; do not forward it.");
  });

  it("shows the UTC window and the duration", () => {
    const email = build();

    expect(email.text).toContain(
      "Window: 21 Nov 2026, 10:00 UTC to 21 Nov 2026, 12:00 UTC",
    );
    expect(email.text).toContain("Duration: 60 minutes");
  });

  it("falls back to the full window when no duration is set", () => {
    const email = build({ durationMinutes: null });

    expect(email.text).toContain("Duration: the full window");
    expect(email.html).toContain("Duration: the full window");
  });

  it("escapes the candidate name and title in the HTML body", () => {
    const email = build({
      candidateName: 'Rakib <b onclick="x">',
      assessmentTitle: "Midterm <script>alert(1)</script>",
    });

    expect(email.html).toContain("Rakib &lt;b onclick=&quot;x&quot;&gt;");
    expect(email.html).toContain(
      "Midterm &lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain('onclick="x"');
  });

  it("never carries an access code, a candidate ref, or the token in the subject", () => {
    const email = build();
    const subject = email.subject.toLowerCase();

    expect(subject).not.toContain("raw-token-123");
    expect(subject).not.toContain("accesscode");
    expect(subject).not.toContain("candidate_ref");
    expect(email.text).not.toMatch(/access code/i);
    expect(email.text).not.toContain("candidate_ref");
    expect(email.html).not.toMatch(/access code/i);
    expect(email.html).not.toContain("candidate_ref");
  });

  it("greets the candidate by name", () => {
    expect(build().text.startsWith("Hi Md. Rakib Hasan,")).toBe(true);
    expect(build({ candidateName: null }).text.startsWith("Hi there,")).toBe(
      true,
    );
  });
});
