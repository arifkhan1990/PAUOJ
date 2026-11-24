import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { ArrayVisual } from "./array-visual";
import { BitsVisual } from "./bits-visual";
import { ComplexityVisual } from "./complexity-visual";
import { DockerVisual } from "./docker-visual";
import { DpVisual } from "./dp-visual";
import { FlowVisual } from "./flow-visual";
import { GitVisual } from "./git-visual";
import { GraphVisual } from "./graph-visual";
import { HashVisual } from "./hash-visual";
import { LinkedVisual } from "./linked-visual";
import { PipelineVisual } from "./pipeline-visual";
import { SortVisual } from "./sort-visual";
import { SqlVisual } from "./sql-visual";
import { StackVisual } from "./stack-visual";
import { StringVisual } from "./string-visual";
import { TreeVisual } from "./tree-visual";

/**
 * Single entry point for every lesson visual. Components are server-rendered
 * SVG/CSS, so this stays free of client JavaScript; `aria-hidden` and the
 * screen-reader step list live inside `VisualFrame`.
 */
export function LessonVisual({
  config,
  compact = false,
}: {
  config: LessonVisualConfig;
  compact?: boolean;
}) {
  switch (config.kind) {
    case "flow":
      return <FlowVisual config={config} compact={compact} />;
    case "complexity":
      return <ComplexityVisual config={config} compact={compact} />;
    case "bits":
      return <BitsVisual config={config} compact={compact} />;
    case "array":
      return <ArrayVisual config={config} compact={compact} />;
    case "stack":
      return <StackVisual config={config} compact={compact} />;
    case "linked":
      return <LinkedVisual config={config} compact={compact} />;
    case "hash":
      return <HashVisual config={config} compact={compact} />;
    case "sort":
      return <SortVisual config={config} compact={compact} />;
    case "tree":
      return <TreeVisual config={config} compact={compact} />;
    case "graph":
      return <GraphVisual config={config} compact={compact} />;
    case "dp":
      return <DpVisual config={config} compact={compact} />;
    case "string":
      return <StringVisual config={config} compact={compact} />;
    case "sql":
      return <SqlVisual config={config} compact={compact} />;
    case "git":
      return <GitVisual config={config} compact={compact} />;
    case "docker":
      return <DockerVisual config={config} compact={compact} />;
    case "pipeline":
      return <PipelineVisual config={config} compact={compact} />;
    default:
      return null;
  }
}
