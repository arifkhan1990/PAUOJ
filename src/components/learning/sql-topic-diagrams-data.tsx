import { Chip, SvgNode, TableArt, Txt, type AreaArt } from "./sql-topic-diagram-kit";

function DatasetArt() {
  const tables: { name: string; x: number; y?: number }[] = [
    { name: "vendors", x: 24 },
    { name: "products", x: 184 },
    { name: "orders", x: 344 },
    { name: "order_items", x: 24, y: 98 },
    { name: "payments", x: 184, y: 98 },
    { name: "shipments", x: 344, y: 98 },
  ];
  return (
    <g>
      {tables.map((table) => (
        <g key={table.name}>
          <rect x={table.x} y={table.y ?? 32} width={112} height={48} rx={8} strokeWidth={1.2} className="fill-card stroke-border" />
          <Txt x={table.x + 12} y={(table.y ?? 32) + 21} size={10.5} weight={700} tone="foreground">
            {table.name}
          </Txt>
          <Txt x={table.x + 12} y={(table.y ?? 32) + 36} size={9}>
            {table.name === "products" ? "price_cents" : table.name === "orders" ? "ordered_at" : "id · ref"}
          </Txt>
        </g>
      ))}
      <Txt x={240} y={172} anchor="middle" size={10}>
        ১৯টি টেবিল · এক মার্কেটপ্লেস · একই key দিয়ে জোড়া
      </Txt>
    </g>
  );
}

function JoinsArt() {
  return (
    <g>
      <TableArt x={24} title="vendors" rows={["1  TechNest", "2  BookBazar", "3  StyleHub"]} accentRows={[0, 1, 2]} />
      <TableArt x={292} title="orders" rows={["v1   #1  paid", "v2   #2  pending", "v3   #3  paid"]} accentRows={[0, 1, 2]} />
      {[0, 1, 2].map((row) => (
        <path
          key={row}
          d={`M188 ${67 + row * 28} C 228 ${67 + row * 28} 254 ${67 + row * 28} 292 ${67 + row * 28}`}
          fill="none"
          strokeWidth={1.6}
          className="stroke-primary/60"
        />
      ))}
      <Txt x={240} y={176} anchor="middle" size={10}>
        ON vendors.id = orders.vendor_id
      </Txt>
    </g>
  );
}

function LeftJoinArt() {
  return (
    <g>
      <TableArt x={24} title="products" rows={["1  Keyboard", "2  USB-C Hub", "3  27in Monitor"]} />
      <TableArt
        x={292}
        title="order_items"
        rows={["p1 × 1", "p2 × 2", ""]}
        accentRows={[0, 1]}
        nullRows={[2]}
        nullLabel="NULL → বিক্রি হয়নি"
      />
      <path d="M188 67 C 232 67 250 123 292 123" fill="none" strokeWidth={1.6} className="stroke-primary/60" />
      <path d="M188 95 C 240 95 252 123 292 123" fill="none" strokeWidth={1.6} className="stroke-primary/60" />
      <Txt x={240} y={176} anchor="middle" size={10}>
        LEFT JOIN মিল না পেলেও বাম সারি রাখে
      </Txt>
    </g>
  );
}

function NestedArt() {
  return (
    <g>
      <rect x={32} y={26} width={416} height={128} rx={12} strokeWidth={1.4} strokeDasharray="6 5" className="fill-muted/20 stroke-border" />
      <Txt x={48} y={46} size={11} weight={700} tone="foreground">
        outer query
      </Txt>
      <rect x={84} y={66} width={210} height={62} rx={9} strokeWidth={1.4} className="fill-primary/10 stroke-primary/60" />
      <Txt x={189} y={92} anchor="middle" size={11} weight={600} tone="primary">
        inner SELECT AVG(price)
      </Txt>
      <Txt x={189} y={110} anchor="middle" size={9.5}>
        আগে চলে, একটি মান ফেরায়
      </Txt>
      <path d="M294 97 C 322 97 322 84 344 84" fill="none" strokeWidth={1.6} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <Chip x={350} y={70} w={82} h={30} tone="accent" size={10}>
        WHERE price &gt;
      </Chip>
      <Txt x={240} y={172} anchor="middle" size={10}>
        ভিতরের query → বাইরের query
      </Txt>
    </g>
  );
}

function VennArt() {
  return (
    <g>
      <ellipse cx={198} cy={92} rx={78} ry={52} strokeWidth={1.6} className="fill-primary/10 stroke-primary/60" />
      <ellipse cx={282} cy={92} rx={78} ry={52} strokeWidth={1.6} className="fill-accent/10 stroke-accent/60" />
      <Txt x={150} y={97} anchor="middle" size={11} weight={700} tone="foreground">
        orders
      </Txt>
      <Txt x={330} y={97} anchor="middle" size={11} weight={700} tone="foreground">
        reviews
      </Txt>
      <Txt x={240} y={45} anchor="middle" size={10} tone="primary">
        both
      </Txt>
      <Txt x={240} y={171} anchor="middle" size={10} tone="foreground">
        UNION · INTERSECT · EXCEPT — তিনটাই দুটি result set মেলায়
      </Txt>
    </g>
  );
}

function BarsArt() {
  const bars = [
    { label: "TechNest", x: 74, value: 89, total: "৳8.9k" },
    { label: "BookBazar", x: 204, value: 18, total: "৳1.8k" },
    { label: "StyleHub", x: 334, value: 60, total: "৳6.0k" },
  ];
  return (
    <g>
      <Txt x={48} y={28} size={11} weight={700} tone="foreground">
        revenue by vendor (৳)
      </Txt>
      <line x1={48} y1={142} x2={440} y2={142} strokeWidth={1} className="stroke-border" />
      {bars.map((bar, index) => {
        const height = (bar.value / 100) * 92;
        return (
          <g key={bar.label}>
            <rect
              x={bar.x}
              y={142 - height}
              width={64}
              height={height}
              rx={5}
              strokeWidth={1.2}
              className={index === 0 ? "fill-primary stroke-primary sql-visual-pulse" : "fill-primary/40 stroke-primary/40"}
            />
            <Txt x={bar.x + 32} y={136 - height} anchor="middle" size={10} weight={600} tone={index === 0 ? "primary" : "muted"}>
              {bar.total}
            </Txt>
            <Txt x={bar.x + 32} y={160} anchor="middle" size={10}>
              {bar.label}
            </Txt>
          </g>
        );
      })}
    </g>
  );
}

function TreeArt() {
  return (
    <g>
      <SvgNode cx={140} y={24} label="Electronics" active />
      <SvgNode cx={80} y={78} label="Audio" active w={80} />
      <SvgNode cx={204} y={78} label="Cameras" w={80} />
      <SvgNode cx={36} y={132} label="Headphones" active w={72} size={8.5} />
      <SvgNode cx={116} y={132} label="Speakers" w={72} size={8.5} />
      <SvgNode cx={204} y={132} label="Lenses" w={72} size={8.5} />
      <path d="M140 50 L80 78 M140 50 L204 78 M80 104 L36 132 M80 104 L116 132 M204 104 L204 132" fill="none" strokeWidth={1.4} className="stroke-border" />
      <path d="M140 50 L80 78 M80 104 L36 132" fill="none" strokeWidth={2} className="stroke-primary" />
      <Txt x={286} y={72} size={10} weight={700} tone="foreground">
        parent_id ধরে path
      </Txt>
      <Txt x={286} y={92} size={10}>
        Electronics &gt; Audio
      </Txt>
      <Txt x={286} y={108} size={10}>
        &gt; Headphones
      </Txt>
      <Txt x={286} y={130} size={10} tone="primary" weight={600}>
        depth = 3
      </Txt>
      <Txt x={240} y={174} anchor="middle" size={10}>
        WITH RECURSIVE — anchor, তারপর প্রতিবার এক স্তর
      </Txt>
    </g>
  );
}

function BTreeArt() {
  return (
    <g>
      <path d="M200 50 L120 86 M200 50 L300 86 M300 112 L250 146 M300 112 L390 146" fill="none" strokeWidth={1.4} className="stroke-border" />
      <path d="M200 50 L300 86 M300 112 L390 146" fill="none" strokeWidth={2} className="stroke-primary" />
      <SvgNode cx={200} y={24} label="2026-10" w={84} active />
      <SvgNode cx={120} y={86} label="2026-08" w={84} />
      <SvgNode cx={300} y={86} label="2026-12" w={84} active />
      <SvgNode cx={52} y={146} label="08-01" w={64} size={9} />
      <SvgNode cx={164} y={146} label="10-01" w={64} size={9} />
      <SvgNode cx={250} y={146} label="11-01" w={64} size={9} />
      <SvgNode cx={390} y={146} label="12-01" w={64} size={9} active />
      <Txt x={352} y={40} size={10} weight={600} tone="primary">
        Index Scan
      </Txt>
      <Txt x={352} y={58} size={9.5}>
        পুরো scan নয়
      </Txt>
    </g>
  );
}

function JsonArt() {
  return (
    <g>
      <rect x={28} y={32} width={214} height={112} rx={10} strokeWidth={1.3} className="fill-card stroke-border" />
      <Txt x={44} y={52} size={10.5} weight={700} tone="foreground">
        product_attributes.attributes
      </Txt>
      <Txt x={44} y={76} size={10} tone="primary">
        {'{ "brand": "Fabrics",'}
      </Txt>
      <Txt x={44} y={94} size={10}>
        {'  "color": "indigo",'}
      </Txt>
      <Txt x={44} y={112} size={10}>
        {'  "size": ["M", "L"] }'}
      </Txt>
      <Txt x={44} y={132} size={9}>
        JSON → jsonb_each / -&gt;&gt; / @&gt;
      </Txt>
      <path d="M242 96 L286 96" strokeWidth={1.5} markerEnd="url(#sql-arrow)" className="stroke-muted-foreground" />
      <rect x={292} y={32} width={160} height={112} rx={10} strokeWidth={1.3} className="fill-card stroke-border" />
      <Txt x={306} y={52} size={10.5} weight={700} tone="foreground">
        stock
      </Txt>
      <rect x={306} y={64} width={86} height={9} rx={4} className="fill-primary/60" />
      <Txt x={398} y={72} size={9}>
        14
      </Txt>
      <rect x={306} y={84} width={54} height={9} rx={4} className="fill-primary/40" />
      <Txt x={398} y={92} size={9}>
        9
      </Txt>
      <rect x={306} y={104} width={18} height={9} rx={4} className="fill-accent/70" />
      <Txt x={398} y={112} size={9} tone="accent" weight={600}>
        2
      </Txt>
      <Txt x={306} y={132} size={9}>
        low stock
      </Txt>
      <Txt x={240} y={174} anchor="middle" size={10}>
        JSON অ্যাট্রিবিউট + স্টক মুভমেন্ট একসাথে
      </Txt>
    </g>
  );
}

export const DATA_ARTS: Record<string, AreaArt> = {
  dataset: DatasetArt,
  joins: JoinsArt,
  leftjoin: LeftJoinArt,
  nested: NestedArt,
  venn: VennArt,
  bars: BarsArt,
  tree: TreeArt,
  btree: BTreeArt,
  json: JsonArt,
};
