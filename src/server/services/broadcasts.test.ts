import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { users } from "@/server/db/schema";
import { marketingAudienceWhere, marketingChannel } from "./broadcasts";

describe("marketingChannel", () => {
  it("keeps the in-app row whenever in-app notifications are on", () => {
    expect(
      marketingChannel({ notifyMarketing: true, emailMarketing: true }),
    ).toBe("in-app");
    expect(
      marketingChannel({ notifyMarketing: true, emailMarketing: false }),
    ).toBe("in-app");
  });

  it("sends email only when in-app is off and mail is on", () => {
    expect(
      marketingChannel({ notifyMarketing: false, emailMarketing: true }),
    ).toBe("email-only");
  });

  it("skips a user who turned both channels off", () => {
    expect(
      marketingChannel({ notifyMarketing: false, emailMarketing: false }),
    ).toBe("skip");
  });
});

describe("marketingAudienceWhere", () => {
  const dialect = new PgDialect();

  it("selects non-banned users with at least one marketing channel on", () => {
    const where = marketingAudienceWhere();
    const query = dialect.sqlToQuery(sql`select 1 from ${users} where ${where}`);
    expect(query.sql).toContain('"users"."is_banned" =');
    expect(query.sql).toContain('"users"."notify_marketing" =');
    expect(query.sql).toContain('"users"."email_marketing" =');
    expect(query.sql).toContain(" or ");
    expect(query.params).toContain(false);
    expect(query.params).toContain(true);
  });
});
