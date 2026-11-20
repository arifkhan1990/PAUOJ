import { ChartPie } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProblemVerdictCount } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { verdictMeta } from "@/lib/verdicts";

type VerdictPoint = {
  status: string;
  label: string;
  count: number;
  share: number;
  color: string;
};

const CENTER = 100;
const RADIUS = 92;

function pointOnCircle(angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(radians),
    y: CENTER + RADIUS * Math.sin(radians),
  };
}

export function SubmissionAnalytics({
  stats,
}: {
  stats: ProblemVerdictCount[];
}) {
  const total = stats.reduce((sum, item) => sum + item.count, 0);
  const points: VerdictPoint[] = stats
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .map((item) => ({
      status: item.status,
      label: verdictMeta(item.status).label,
      count: item.count,
      share: total > 0 ? (item.count / total) * 100 : 0,
      color: verdictMeta(item.status).chartColor,
    }));

  const slices = points.reduce<
    Array<VerdictPoint & { path: string; labelX: number; labelY: number }>
  >((result, point) => {
    const sweep = (point.share / 100) * 360;
    const startAngle =
      result.reduce((sum, slice) => sum + slice.share * 3.6, 0) - 90;
    const start = pointOnCircle(startAngle);
    const end = pointOnCircle(startAngle + sweep);
    const largeArc = sweep > 180 ? 1 : 0;
    const mid = pointOnCircle(startAngle + sweep / 2);
    return [
      ...result,
      {
        ...point,
        path: `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`,
        labelX: CENTER + (mid.x - CENTER) * 0.62,
        labelY: CENTER + (mid.y - CENTER) * 0.62,
      },
    ];
  }, []);

  return (
    <Card className="flex h-full flex-col rounded-2xl shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border bg-gradient-to-r from-rose-500/10 via-muted/15 to-transparent px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <ChartPie className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Verdicts
          </p>
          <h2 className="text-sm font-semibold">Submission analytics</h2>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-muted-foreground">
          Submit a solution to see your verdict mix.
        </p>
      ) : (
        <div className="flex flex-1 flex-col justify-center p-5">
          <div className="animate-enter mx-auto w-full max-w-[250px]">
            {points.length === 1 ? (
              <svg
                viewBox="0 0 200 200"
                className="h-auto w-full drop-shadow-sm"
                role="img"
                aria-label={`${points[0]?.label}: ${formatPercent(
                  points[0]?.share ?? 0,
                  0,
                )} of ${total} submissions`}
              >
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill={points[0]?.color}
                >
                  <title>{`${points[0]?.label}: ${points[0]?.count}`}</title>
                </circle>
                <text
                  x={CENTER}
                  y={CENTER}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="600"
                >
                  {points[0]?.share.toFixed(0)}%
                </text>
              </svg>
            ) : (
              <svg
                viewBox="0 0 200 200"
                className="h-auto w-full drop-shadow-sm"
                role="img"
                aria-label={`Submission verdict distribution across ${total} submissions`}
              >
                {slices.map((slice) => (
                  <path
                    key={slice.status}
                    d={slice.path}
                    fill={slice.color}
                    stroke="var(--card)"
                    strokeWidth="2"
                  >
                    <title>{`${slice.label}: ${slice.count} (${slice.share.toFixed(0)}%)`}</title>
                  </path>
                ))}
                {slices
                  .filter((slice) => slice.share >= 8)
                  .map((slice) => (
                    <text
                      key={`label-${slice.status}`}
                      x={slice.labelX}
                      y={slice.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {slice.share.toFixed(0)}%
                    </text>
                  ))}
              </svg>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {points.map((point) => (
              <li
                key={point.status}
                className="inline-flex items-center gap-1.5 text-[10px]"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: point.color }}
                />
                <span className="text-muted-foreground">{point.label}</span>
                <span className="font-mono tabular-nums">
                  {formatPercent(point.share, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
