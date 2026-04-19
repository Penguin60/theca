"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const FONT_OPTIONS = [
  "sans-serif",
  "serif",
  "monospace",
  "system-ui",
  "Geist",
  "Helvetica",
] as const;

const DEFAULTS = {
  color: "#24292f",
  bg: "#ffffff",
  bgEnabled: false,
  font: "sans-serif",
  size: 14,
};

export function SvgUrlDialog({
  open,
  onOpenChange,
  username,
  variableKey,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  username: string;
  variableKey: string;
}) {
  const [color, setColor] = useState(DEFAULTS.color);
  const [bg, setBg] = useState(DEFAULTS.bg);
  const [bgEnabled, setBgEnabled] = useState(DEFAULTS.bgEnabled);
  const [font, setFont] = useState<string>(DEFAULTS.font);
  const [size, setSize] = useState(DEFAULTS.size);

  useEffect(() => {
    if (!open) {
      setColor(DEFAULTS.color);
      setBg(DEFAULTS.bg);
      setBgEnabled(DEFAULTS.bgEnabled);
      setFont(DEFAULTS.font);
      setSize(DEFAULTS.size);
    }
  }, [open]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = `${origin}/v/${username}/${variableKey}.svg`;
  const params = new URLSearchParams();
  if (color !== DEFAULTS.color) params.set("color", color);
  if (bgEnabled) params.set("bg", bg);
  if (font !== DEFAULTS.font) params.set("font", font);
  if (size !== DEFAULTS.size) params.set("size", String(size));
  const qs = params.toString();
  const url = qs ? `${base}?${qs}` : base;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    toast.success("SVG URL copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Copy SVG URL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="flex min-h-[80px] items-center justify-center rounded-md border p-4"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="preview" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="svg-color">Text color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="svg-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {color}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="svg-bg" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bgEnabled}
                  onChange={(e) => setBgEnabled(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-foreground"
                />
                Background
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="svg-bg"
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  disabled={!bgEnabled}
                  className="h-9 w-12 cursor-pointer rounded border disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {bgEnabled ? bg : "transparent"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="svg-font">Font</Label>
              <select
                id="svg-font"
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="svg-size">Size</Label>
              <Input
                id="svg-size"
                type="number"
                min={4}
                max={200}
                value={size}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setSize(n);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="svg-url">URL</Label>
            <Input id="svg-url" value={url} readOnly className="font-mono text-xs" />
          </div>

          <Button className="w-full" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            Copy URL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
