import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Info } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SQL_HANDBOOK_SECTIONS } from "@/lib/learning/sql-handbook";

export const metadata: Metadata = {
  title: "SQL production handbook",
  description:
    "The ShopSphere SQL practices a read-only SELECT judge cannot grade: schema design, DDL/DML safety, transactions, views & security, indexes & plans, and scale & dialects.",
};

const INTRO =
  "SQL Labs-এর সব problem judge করা যায় — কারণ judge শুধু read-only SELECT চালায়, তাই শুধু পড়ার কাজই মাপা যায়। কিন্তু প্রোডাকশনে SQL মানে শুধু query নয়: টেবিল ডিজাইন, নিরাপদ DDL, ট্রানজেকশন, অনুমতি আর index — এগুলো লেখা হয় ডেটাবেসের ভেতরে, আর একটা ভুলে পুরো দোকান থামে। এই handbook-এ সেই অভ্যাসগুলো বাংলায়, ছোট ছোট সেকশনে। এগুলো রিড-ওনলি SELECT রানার দিয়ে বিচার করা সম্ভব নয় — তাই এখানে কোনো স্কোর নেই; পডো, নিজের ডেটাবেসে চালিয়ে দেখো, তারপর মনে রেখো।";

export default function SqlHandbookPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        eyebrow="SQL Labs · Handbook"
        title="SQL production handbook"
        description={INTRO}
        actions={
          <Link
            href="/learn/sql"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to SQL Labs
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <BookOpen className="size-3" aria-hidden="true" />{" "}
          {SQL_HANDBOOK_SECTIONS.length} sections
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <Info className="size-3" aria-hidden="true" /> Not judgeable —
          practice on your own database
        </span>
      </div>

      <Card className="mt-6 p-5">
        <p lang="bn" className="text-sm leading-relaxed text-muted-foreground">
          প্রতিটি সেকশন আলাদা পাঠ: এক নজরে পড়ে সার-কথা নাও, অথবা ধরে ধরে শেষ করো।
          উদাহরণগুলো ShopSphere-এর টেবিলগুলোকেই মনে করিয়ে দেয়, তাই SQL Labs-এর
          সাথে পাশাপাশি পড়লে সবচেয়ে ভালো বোঝা যায়। শুরু করো স্কিমা থেকে —
          ডিজাইন ঠিক হলে বাকি সব সহজ।
        </p>
      </Card>

      <nav
        aria-label="Handbook sections"
        className="mt-6 flex flex-wrap gap-2"
      >
        {SQL_HANDBOOK_SECTIONS.map((section) => (
          <a
            key={section.slug}
            href={`#${section.slug}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {section.titleBn}
          </a>
        ))}
      </nav>

      {SQL_HANDBOOK_SECTIONS.map((section) => (
        <section
          key={section.slug}
          id={section.slug}
          className="mt-8 scroll-mt-20"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {section.title}
            </h2>
            <p
              lang="bn"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary"
            >
              {section.titleBn}
            </p>
          </div>
          <p
            lang="bn"
            className="mt-1 text-xs leading-relaxed text-muted-foreground"
          >
            {section.summary}
          </p>
          <Card className="mt-3 p-5 sm:p-6">
            <Markdown lang="bn" headingIdPrefix={section.slug}>
              {section.body}
            </Markdown>
          </Card>
        </section>
      ))}

      <div className="mt-10 border-t border-border pt-6">
        <Link
          href="/learn/sql"
          className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <ArrowLeft
            className="mr-1 inline size-3.5 align-baseline"
            aria-hidden="true"
          />
          SQL Labs-এ ফিরে যাও — এবার প্রতিটি query-র প্ল্যান নিজে দেখে নাও।
        </Link>
      </div>
    </div>
  );
}
