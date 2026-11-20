"use client";

import { CheckCircle2 } from "lucide-react";
import {
  DOC_CATEGORIES,
  DOC_SECTIONS,
  type DocSection,
} from "@/lib/docs-content";
import { useActiveSection } from "@/lib/use-active-section";
import { cn } from "@/lib/utils";

const SECTION_IDS = [...DOC_SECTIONS.map((section) => section.id), "checklist"];

function sectionCategory(sectionId: string) {
  return DOC_SECTIONS.find((section) => section.id === sectionId)?.category;
}

function SectionLink({
  section,
  active,
}: {
  section: DocSection;
  active: boolean;
}) {
  return (
    <a
      href={`#${section.id}`}
      aria-current={active ? "location" : undefined}
      className={cn(
        "relative block rounded-md px-2 py-1.5 text-[11px] transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
          aria-hidden="true"
        />
      ) : null}
      {section.title}
    </a>
  );
}

export function DocsNav() {
  const active = useActiveSection(SECTION_IDS, "reference-scroll");
  const activeCategory = sectionCategory(active);

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Guide
      </p>
      <nav className="mt-4 space-y-4" aria-label="User guide">
        {DOC_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const sections = DOC_SECTIONS.filter(
            (section) => section.category === category.id,
          );
          const categoryActive = activeCategory === category.id;
          return (
            <div key={category.id}>
              <a
                href={`#${category.id}`}
                className={cn(
                  "flex items-center gap-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors",
                  categoryActive
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                {category.label}
              </a>
              <div className="mt-1.5 space-y-0.5">
                {sections.map((section) => (
                  <SectionLink
                    key={section.id}
                    section={section}
                    active={active === section.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <a
          href="#checklist"
          aria-current={active === "checklist" ? "location" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] transition-colors",
            active === "checklist"
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
        >
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          Quick checklist
        </a>
      </nav>
    </>
  );
}
