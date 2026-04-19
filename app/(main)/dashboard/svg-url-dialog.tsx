"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Autocomplete } from "@/components/ui/autocomplete";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOOGLE_FONTS } from "@/lib/google-fonts";

const DEFAULTS = {
  color: "#24292f",
  bg: "#ffffff",
  bgEnabled: false,
  font: "",
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
  const [copied, setCopied] = useState(false);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setColor(DEFAULTS.color);
      setBg(DEFAULTS.bg);
      setBgEnabled(DEFAULTS.bgEnabled);
      setFont(DEFAULTS.font);
      setSize(DEFAULTS.size);
      setCopied(false);
    }
  }, [open]);

  const filteredFonts = useMemo(() => {
    const q = font.trim().toLowerCase();
    if (!q) return GOOGLE_FONTS.slice(0, 50);
    const out: string[] = [];
    for (const name of GOOGLE_FONTS) {
      if (name.toLowerCase().includes(q)) {
        out.push(name);
        if (out.length >= 50) break;
      }
    }
    return out;
  }, [font]);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div ref={portalContainerRef} className="absolute size-0" />
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
              <Label>Text color</Label>
              <div className="flex items-center gap-2">
                <ColorPicker value={color} onChange={setColor} container={portalContainerRef} />
                <span className="font-mono text-xs text-muted-foreground">
                  {color}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bgEnabled}
                  onChange={(e) => setBgEnabled(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-foreground"
                />
                Background
              </Label>
              <div className="flex items-center gap-2">
                <ColorPicker value={bg} onChange={setBg} disabled={!bgEnabled} container={portalContainerRef} />
                <span className="font-mono text-xs text-muted-foreground">
                  {bgEnabled ? bg : "transparent"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font</Label>
              <Autocomplete
                items={filteredFonts}
                value={font}
                onValueChange={setFont}
                placeholder="Default"
              />
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
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
            <Label>URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="svg-url"
                value={url}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                size="icon"
                onClick={handleCopy}
                aria-label="Copy URL"
              >
                <span className="relative inline-flex size-4 items-center justify-center">
                  <Copy
                    className={cn(
                      "absolute inset-0 size-4 transition-all duration-200",
                      copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
                    )}
                  />
                  <Check
                    className={cn(
                      "absolute inset-0 size-4 transition-all duration-200",
                      copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
                    )}
                  />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
