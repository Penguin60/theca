import { getPublicVariable } from "@/server/queries";

const SHARED_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderSvg(value: string) {
  const width = value.length * 8 + 16;
  const height = 24;
  const text = escapeXml(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="8" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="14" fill="#24292f">${text}</text></svg>`;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/v/[username]/[key]">
) {
  const { username, key } = await ctx.params;
  const wantsSvg = key.endsWith(".svg");
  const lookupKey = wantsSvg ? key.slice(0, -".svg".length) : key;
  const variable = await getPublicVariable(username, lookupKey);

  if (!variable) {
    return new Response("Not found", { status: 404 });
  }

  if (wantsSvg) {
    return new Response(renderSvg(variable.value), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        ...SHARED_HEADERS,
      },
    });
  }

  return new Response(variable.value, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...SHARED_HEADERS,
    },
  });
}
