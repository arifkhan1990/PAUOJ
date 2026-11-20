import {
  BinarySearchVisual,
  GraphVisual,
  LinkedListVisual,
  QueueVisual,
  SlidingWindowVisual,
  SortingVisual,
  StackVisual,
} from "@/components/auth/algorithm-visuals";
import { BinaryBackground } from "@/components/auth/binary-background";

export function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <div className="absolute -left-32 top-20 size-[28rem] rounded-full bg-primary/10 blur-[110px]" />
      <div className="absolute -right-28 bottom-0 size-[30rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute left-1/2 top-0 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[110px]" />

      <BinaryBackground />

      <div className="absolute inset-0 hidden min-[1180px]:block">
        <SortingVisual className="left-[1%] top-[7%] -rotate-2" />
        <StackVisual className="left-[2%] top-[38%] rotate-2" />
        <QueueVisual className="left-[1%] bottom-[12%] -rotate-1" />

        <BinarySearchVisual className="right-[0.5%] top-[8%] rotate-1" />
        <SlidingWindowVisual className="right-[1%] top-[31%] -rotate-2" />
        <GraphVisual className="right-[1%] top-[52%] rotate-2" />
        <LinkedListVisual className="right-[1%] bottom-[8%] -rotate-1" />
      </div>
    </div>
  );
}
