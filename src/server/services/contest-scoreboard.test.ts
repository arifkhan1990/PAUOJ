import { describe, expect, it } from "vitest";
import {
  SCOREBOARD_DEFAULT_PAGE_SIZE,
  SCOREBOARD_MAX_PAGE_SIZE,
} from "@/lib/contest-detail-types";
import { resolveScoreboardPage } from "./contest-scoreboard";

describe("resolveScoreboardPage", () => {
  it("reports one empty page for an empty board", () => {
    expect(resolveScoreboardPage(0)).toEqual({
      page: 1,
      pageSize: SCOREBOARD_DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });
  });

  it("uses the default page size and first page", () => {
    expect(resolveScoreboardPage(10_000)).toEqual({
      page: 1,
      pageSize: SCOREBOARD_DEFAULT_PAGE_SIZE,
      total: 10_000,
      totalPages: 200,
    });
  });

  it("slices the requested page", () => {
    const page = resolveScoreboardPage(250, { page: 2, pageSize: 100 });
    expect(page).toEqual({
      page: 2,
      pageSize: 100,
      total: 250,
      totalPages: 3,
    });
  });

  it("clamps pages above the last page", () => {
    expect(resolveScoreboardPage(250, { page: 999, pageSize: 100 })).toEqual({
      page: 3,
      pageSize: 100,
      total: 250,
      totalPages: 3,
    });
  });

  it("clamps pages below one", () => {
    expect(resolveScoreboardPage(250, { page: 0 })).toMatchObject({ page: 1 });
    expect(resolveScoreboardPage(250, { page: -4 })).toMatchObject({ page: 1 });
  });

  it("falls back for non-finite page input", () => {
    expect(
      resolveScoreboardPage(250, { page: Number.NaN }).page,
    ).toBe(1);
    expect(
      resolveScoreboardPage(250, { page: Number.POSITIVE_INFINITY }).page,
    ).toBe(1);
  });

  it("truncates fractional pages and page sizes", () => {
    expect(
      resolveScoreboardPage(250, { page: 2.9, pageSize: 50.7 }),
    ).toEqual({ page: 2, pageSize: 50, total: 250, totalPages: 5 });
  });

  it("enforces the maximum page size", () => {
    expect(
      resolveScoreboardPage(1_000, { pageSize: 5_000 }),
    ).toMatchObject({
      pageSize: SCOREBOARD_MAX_PAGE_SIZE,
      totalPages: Math.ceil(1_000 / SCOREBOARD_MAX_PAGE_SIZE),
    });
  });

  it("never serves a page size below one", () => {
    expect(resolveScoreboardPage(10, { pageSize: 0 })).toMatchObject({
      pageSize: 1,
    });
    expect(resolveScoreboardPage(10, { pageSize: -5 })).toMatchObject({
      pageSize: 1,
    });
  });

  it("keeps the last page partially filled", () => {
    expect(resolveScoreboardPage(201, { pageSize: 100 })).toMatchObject({
      totalPages: 3,
      page: 1,
    });
    expect(
      resolveScoreboardPage(201, { page: 3, pageSize: 100 }),
    ).toMatchObject({ page: 3, totalPages: 3 });
  });
});
