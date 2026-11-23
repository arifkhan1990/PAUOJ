import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import { DeleteStudyPlanButton } from "./delete-study-plan-button";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function render() {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(DeleteStudyPlanButton, {
        slug: "qa-plan",
        title: "QA plan",
      }),
    ),
  );
}

describe("DeleteStudyPlanButton", () => {
  it("renders a non-submitting Delete plan button", () => {
    const html = render();

    expect(html).toContain("Delete plan");
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-busy="false"');
    expect(html).not.toContain("Deleting");
  });
});
