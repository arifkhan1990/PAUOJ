import { getPublicAvatarImage } from "@/server/services/user-avatars";

const CACHE = "public, max-age=31536000, immutable";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  const image = await getPublicAvatarImage(username);
  if (!image) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new Response(new Uint8Array(image.bytes), {
    status: 200,
    headers: {
      "Content-Type": image.mime,
      "Content-Length": String(image.bytes.byteLength),
      "Cache-Control": CACHE,
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
