import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default function ReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
