import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError } from "@/server/api/responses";
import { parseQuery } from "@/server/api/validation";
import {
  contributionExportCsv,
  listContributionExport,
} from "@/server/services/contribution-export";

const exportQuerySchema = z.object({
  status: z
    .enum(["all", "PENDING", "APPROVED", "REJECTED", "WITHDRAWN"])
    .default("all"),
  range: z.enum(["7", "30", "all"]).default("all"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`contribution:export:${user.id}`, 10, 60);
    const query = parseQuery(request, exportQuerySchema);
    const rows = await listContributionExport(user, query);
    const csv = contributionExportCsv(rows);
    const filename = `contributions-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
