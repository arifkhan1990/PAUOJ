import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { apiError } from "@/server/api/responses";
import type { PaymentMethodId } from "@/lib/learning/payment-types";
import { getPaymentQrFile } from "@/server/services/payment-config";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/** Authenticated QR delivery: the files live outside `public/` and are never committed. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ method: string }> },
) {
  try {
    await requireApiUser();
    const { method } = await context.params;
    if (method !== "bkash" && method !== "citybank") {
      return new NextResponse(null, { status: 404 });
    }
    const file = getPaymentQrFile(method as PaymentMethodId);
    if (!file) return new NextResponse(null, { status: 404 });

    const extension = path.extname(file).slice(1).toLowerCase();
    const body = await readFile(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": CONTENT_TYPES[extension] ?? "application/octet-stream",
        "cache-control": "private, max-age=300",
        "x-robots-tag": "noindex, nofollow, noarchive",
        "content-disposition": "inline",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
