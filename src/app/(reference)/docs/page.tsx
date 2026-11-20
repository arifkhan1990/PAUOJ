import type { Metadata } from "next";
import { DocsView } from "@/components/docs/docs-view";

export const metadata: Metadata = {
  title: "User guide",
  description:
    "How to solve problems, read verdicts and take part in contests on PAU OJ.",
};

export default function DocsPage() {
  return <DocsView />;
}
