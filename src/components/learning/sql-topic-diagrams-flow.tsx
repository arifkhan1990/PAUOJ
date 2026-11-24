import { Chip, Txt, type AreaArt } from "./sql-topic-diagram-kit";

function WindowArt() {
  const points = [112, 104, 96, 90, 84, 78, 72];
  return (
    <g>
      <Txt x={48} y={26} size={11} weight={700} tone="foreground">
        rolling frame
      </Txt>
      <polyline
        points={points.map((y, index) => `${60 + index * 52},${y}`).join(" ")}
        fill="none"
        strokeWidth={2}
        className="stroke-primary/50"
      />
      <rect x={150} y={50} width={150} height={86} rx={10} strokeWidth={1.6} strokeDasharray="6 5" className="fill-primary/10 stroke-primary/70 sql-visual-pulse" />
      {points.map((y, index) => (
        <g key={`point-${index}`}>
          <circle
            cx={60 + index * 52}
            cy={y}
            r={5}
            strokeWidth={1.4}
            className={index >= 2 && index <= 4 ? "fill-primary stroke-primary" : "fill-card stroke-border"}
          />
          <Txt x={60 + index * 52} y={152} anchor="middle" size={9}>
            {`0${index + 1}`}
          </Txt>
        </g>
      ))}
      <line x1={48} y1={128} x2={440} y2={128} strokeWidth={1} className="stroke-border" />
      <Txt x={240} y={176} anchor="middle" size={9.5}>
        SUM(total) OVER (ORDER BY day ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
      </Txt>
    </g>
  );
}

function TxnArt() {
  return (
    <g>
      <Chip x={24} y={76} w={86} tone="primary">
        BEGIN
      </Chip>
      <Chip x={146} y={76} w={120}>
        UPDATE stock
      </Chip>
      <path d="M110 90 L146 90" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <path d="M266 84 C 292 84 292 52 318 52" fill="none" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <path d="M266 96 C 292 96 292 128 318 128" fill="none" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <Chip x={318} y={34} w={128} h={34} tone="primary">
        COMMIT ✓ রাখো
      </Chip>
      <Chip x={318} y={112} w={128} h={34} tone="accent">
        ROLLBACK ✗ ফেরাও
      </Chip>
      <Txt x={24} y={40} size={11} weight={700} tone="foreground">
        এক লেনদেন, দুই পরিণতি
      </Txt>
      <Txt x={24} y={176} size={10}>
        ভুল হলে BEGIN-এর আগের অবস্থায় ফিরে যায়
      </Txt>
    </g>
  );
}

function PagesArt() {
  const pages = [
    { label: "1–10", offset: "OFFSET 0", x: 36, active: false },
    { label: "11–20", offset: "OFFSET 10", x: 182, active: true },
    { label: "21–30", offset: "OFFSET 20", x: 328, active: false },
  ];
  return (
    <g>
      <Txt x={36} y={26} size={11} weight={700} tone="foreground">
        ORDER BY ordered_at DESC
      </Txt>
      {pages.map((page) => (
        <g key={page.label}>
          <rect x={page.x} y={48} width={116} height={78} rx={10} strokeWidth={1.4} className={page.active ? "fill-primary/10 stroke-primary" : "fill-card stroke-border"} />
          <Txt x={page.x + 58} y={82} anchor="middle" size={16} weight={700} tone={page.active ? "primary" : "foreground"}>
            {page.label}
          </Txt>
          <Txt x={page.x + 58} y={104} anchor="middle" size={9.5}>
            {page.offset}
          </Txt>
        </g>
      ))}
      <path d="M152 87 L182 87" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <path d="M298 87 L328 87" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <Txt x={240} y={162} anchor="middle" size={10} weight={600} tone="primary">
        LIMIT 10 OFFSET 10 → দ্বিতীয় পাতা
      </Txt>
      <Txt x={240} y={178} anchor="middle" size={9.5}>
        ORDER BY ছাড়া পেজ বদলালে সারি বদলে যেতে পারে
      </Txt>
    </g>
  );
}

function DatesArt() {
  return (
    <g>
      <Chip x={24} y={42} w={178} h={30} tone="primary" size={10}>
        city LIKE &apos;Dha%&apos;
      </Chip>
      <Chip x={24} y={82} w={178} h={30} size={10}>
        ordered_at &gt;= &apos;2026-10-01&apos;
      </Chip>
      <Chip x={24} y={122} w={178} h={30} size={10}>
        date_trunc(&apos;month&apos;, ordered_at)
      </Chip>
      <path d="M208 96 L240 96" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <Txt x={312} y={30} anchor="middle" size={10.5} weight={700} tone="foreground">
        October 2026
      </Txt>
      {Array.from({ length: 21 }, (_, index) => {
        const column = index % 7;
        const row = Math.floor(index / 7);
        const active = index === 10;
        return (
          <rect
            key={index}
            x={252 + column * 25}
            y={52 + row * 30}
            width={21}
            height={26}
            rx={4}
            strokeWidth={1}
            className={active ? "fill-accent/20 stroke-accent" : "fill-card stroke-border"}
          />
        );
      })}
      <Txt x={312} y={168} anchor="middle" size={10}>
        টেক্সট ম্যাচ + তারিখ ফিল্টার এক query-তে
      </Txt>
    </g>
  );
}

function FunnelArt() {
  const steps = [
    { label: "carts", width: 360, y: 34 },
    { label: "orders", width: 280, y: 68 },
    { label: "payments", width: 200, y: 102 },
    { label: "refunds", width: 120, y: 136 },
  ];
  return (
    <g>
      {steps.map((step, index) => (
        <g key={step.label}>
          <rect
            x={240 - step.width / 2}
            y={step.y}
            width={step.width}
            height={24}
            rx={5}
            strokeWidth={1.2}
            className={index === 0 ? "fill-primary/30 stroke-primary" : "fill-primary/15 stroke-primary/40"}
          />
          <Txt x={240} y={step.y + 16} anchor="middle" size={10} weight={600} tone="primary">
            {step.label}
          </Txt>
        </g>
      ))}
      <Txt x={240} y={180} anchor="middle" size={9.5}>
        প্রতিটি ধাপে কত ইউজার টিকে থাকে
      </Txt>
    </g>
  );
}

function PivotArt() {
  const rows = [
    { label: "Electronics", values: [84, 62, 71] },
    { label: "Books", values: [36, 48, 30] },
    { label: "Fashion", values: [58, 44, 66] },
  ];
  return (
    <g>
      <Txt x={40} y={28} size={11} weight={700} tone="foreground">
        category × month
      </Txt>
      {["Oct", "Nov", "Dec"].map((month, index) => (
        <Txt key={month} x={282 + index * 62} y={56} anchor="middle" size={10} weight={600}>
          {month}
        </Txt>
      ))}
      {rows.map((row, rowIndex) => (
        <g key={row.label}>
          <Txt x={40} y={82 + rowIndex * 34} size={9.5} weight={600} tone="foreground">
            {row.label}
          </Txt>
          {row.values.map((value, columnIndex) => (
            <g key={`${row.label}-${columnIndex}`}>
              <rect
                x={252 + columnIndex * 62}
                y={68 + rowIndex * 34}
                width={60}
                height={24}
                rx={4}
                strokeWidth={1}
                className={rowIndex === 0 && columnIndex === 2 ? "fill-primary/10 stroke-primary" : "fill-muted/40 stroke-border"}
              />
              <rect
                x={256 + columnIndex * 62}
                y={80 + rowIndex * 34}
                width={(value / 100) * 52}
                height={4}
                rx={2}
                className="fill-primary/60"
              />
            </g>
          ))}
        </g>
      ))}
      <Txt x={240} y={182} anchor="middle" size={10}>
        CASE WHEN + SUM → প্রতিটি ঘর এক aggregate
      </Txt>
    </g>
  );
}

function LifecycleArt() {
  const states = ["pending", "paid", "shipped", "delivered"];
  return (
    <g>
      {states.map((state, index) => (
        <g key={state}>
          <rect
            x={24 + index * 108}
            y={54}
            width={96}
            height={40}
            rx={8}
            strokeWidth={1.3}
            className={index === 1 ? "fill-primary/10 stroke-primary" : "fill-card stroke-border"}
          />
          <Txt x={72 + index * 108} y={78} anchor="middle" size={10.5} weight={600} tone={index === 1 ? "primary" : "foreground"}>
            {state}
          </Txt>
          {index < states.length - 1 ? (
            <path
              d={`M${24 + index * 108 + 96} 74 L${24 + (index + 1) * 108 - 4} 74`}
              strokeWidth={1.5}
              markerEnd="url(#sql-arrow)"
              className="stroke-muted-foreground"
            />
          ) : null}
        </g>
      ))}
      <path d="M96 94 C 96 132 300 132 396 94" fill="none" strokeWidth={1.5} strokeDasharray="5 4" markerEnd="url(#sql-arrow)" className="stroke-accent" />
      <Txt x={240} y={148} anchor="middle" size={10} weight={600} tone="accent">
        returns → refund
      </Txt>
      <Txt x={240} y={172} anchor="middle" size={9.5}>
        status বদলালে payment, shipment আর refund একসাথে মেলাতে হয়
      </Txt>
    </g>
  );
}

function PipelineArt() {
  const steps = ["FROM", "WHERE", "SELECT", "ORDER BY"];
  return (
    <g>
      <Txt x={40} y={30} size={11} weight={700} tone="foreground">
        একটি query-র পথ
      </Txt>
      {steps.map((step, index) => (
        <g key={step}>
          <Chip x={32 + index * 108} y={66} w={88} h={36} tone={index === 0 ? "primary" : "muted"} size={10}>
            {step}
          </Chip>
          {index < steps.length - 1 ? (
            <path
              d={`M${32 + index * 108 + 90} 84 L${32 + (index + 1) * 108 - 2} 84`}
              strokeWidth={1.5}
              markerEnd="url(#sql-arrow)"
              className="stroke-muted-foreground"
            />
          ) : null}
        </g>
      ))}
      <Txt x={240} y={136} anchor="middle" size={9.5}>
        JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
      </Txt>
      <Txt x={240} y={158} anchor="middle" size={9.5}>
        বড় রিপোর্টেও এই একই ধারা
      </Txt>
    </g>
  );
}

export const FLOW_ARTS: Record<string, AreaArt> = {
  window: WindowArt,
  txn: TxnArt,
  pages: PagesArt,
  dates: DatesArt,
  funnel: FunnelArt,
  pivot: PivotArt,
  lifecycle: LifecycleArt,
  pipeline: PipelineArt,
};
