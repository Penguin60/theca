import { getPublicVariable } from "@/server/queries";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/v/[username]/[key]">
) {
  const { username, key } = await ctx.params;
  const variable = await getPublicVariable(username, key);

  if (!variable) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(variable.value, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
