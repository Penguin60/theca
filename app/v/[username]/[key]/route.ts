import { getPublicVariable } from "@/server/queries";
import { GOOGLE_FONTS_SET } from "@/lib/google-fonts";
import opentype from "opentype.js";
import { request } from "http";

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

type SvgOptions = {
  bg?: string;
  color: string;
  font: string;
  size: number;
};

const DEFAULT_OPTIONS: SvgOptions = {
  color: "#24292f",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  size: 14,
};

const COLOR_PATTERN = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|[a-zA-Z]{1,32})$/;
const FONT_PATTERN = /^[a-zA-Z0-9 ,.\-'"]{1,200}$/;

function parseSvgOptions(searchParams: URLSearchParams): SvgOptions {
  const opts: SvgOptions = { ...DEFAULT_OPTIONS };

  const bg = searchParams.get("bg");
  if (bg && COLOR_PATTERN.test(bg)) opts.bg = bg;

  const color = searchParams.get("color");
  if (color && COLOR_PATTERN.test(color)) opts.color = color;

  const font = searchParams.get("font");
  if (font && FONT_PATTERN.test(font)) opts.font = font;

  const size = searchParams.get("size");
  if (size) {
    const n = Number(size);
    if (Number.isFinite(n) && n >= 4 && n <= 200) opts.size = n;
  }

  return opts;
}

const WOFF_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50";

async function fetchGoogleFont(family: string): Promise<opentype.Font | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(
      family
    )}`;
    const cssRes = await fetch(cssUrl, {
      headers: { "User-Agent": WOFF_UA },
      next: { revalidate: 31536000 },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/url\((https?:\/\/[^)]+)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1], {
      next: { revalidate: 31536000 },
    });
    if (!fontRes.ok) return null;
    const buf = await fontRes.arrayBuffer();
    return opentype.parse(buf);
  } catch {
    return null;
  }
}

function renderSvg(value: string, opts: SvgOptions, googleFont: opentype.Font | null) {
  const { size, color, font, bg } = opts;
  const padX = size * 0.6;
  const padY = size * 0.3;
  const colorAttr = escapeXml(color);

  let textWidth: number;
  let textNode: string;

  if (googleFont) {
    textWidth = googleFont.getAdvanceWidth(value, size);
    const baseline = padY + size * 0.85;
    const path = googleFont.getPath(value, padX, baseline, size);
    const text = escapeXml(value);
    textNode =
      `<path d="${path.toPathData(2)}" fill="${colorAttr}"/>` +
      `<text x="${padX}" y="${baseline}" font-size="${size}" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs" fill="transparent">${text}</text>`;
  } else {
    const charWidth = size * 0.6;
    textWidth = value.length * charWidth;
    const baseline = Math.round(padY + size * 0.85);
    const text = escapeXml(value);
    const fontAttr = escapeXml(font);
    textNode = `<text x="${padX}" y="${baseline}" font-family="${fontAttr}" font-size="${size}" fill="${colorAttr}">${text}</text>`;
  }

  const width = Math.ceil(textWidth + padX * 2);
  const height = Math.ceil(size + padY * 2);
  const radius = Math.round(size * 0.3);
  const bgRect = bg
    ? `<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${escapeXml(bg)}"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bgRect}${textNode}</svg>`;
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
    const { searchParams } = new URL(_request.url);
    const opts = parseSvgOptions(searchParams);
    const googleFont = GOOGLE_FONTS_SET.has(opts.font)
      ? await fetchGoogleFont(opts.font)
      : null;
    return new Response(renderSvg(variable.value, opts, googleFont), {
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
