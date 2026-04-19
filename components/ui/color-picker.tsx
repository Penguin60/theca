"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"

// ── Color math ──────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  )
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = ((h * 60) + 360) % 360
  }
  return [h, max === 0 ? 0 : d / max, max]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [f(5) * 255, f(3) * 255, f(1) * 255]
}

// ── Component ────────────────────────────────────────────────────────────────

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  container?: React.RefObject<HTMLElement | null>
}

export function ColorPicker({ value, onChange, disabled, className, container }: ColorPickerProps) {
  // Internal HSV state — source of truth while picker is open
  const [hsv, setHsv] = React.useState<[number, number, number]>(() => {
    const rgb = hexToRgb(value)
    return rgb ? rgbToHsv(...rgb) : [0, 0, 0]
  })
  const [hexInput, setHexInput] = React.useState(value)

  // Sync from external value changes
  React.useEffect(() => {
    const rgb = hexToRgb(value)
    if (rgb) {
      setHsv(rgbToHsv(...rgb))
      setHexInput(value)
    }
  }, [value])

  const [h, s, v] = hsv
  const currentHex = rgbToHex(...hsvToRgb(h, s, v))
  // CSS color for the pure hue (fully saturated, full brightness)
  const hueHex = rgbToHex(...hsvToRgb(h, 1, 1))

  function commitHsv(newHsv: [number, number, number]) {
    setHsv(newHsv)
    const hex = rgbToHex(...hsvToRgb(...newHsv))
    setHexInput(hex)
    onChange(hex)
  }

  // ── SV gradient square ───────────────────────────────────────────────────
  const svRef = React.useRef<HTMLDivElement>(null)
  const draggingSv = React.useRef(false)

  function readSvPos(clientX: number, clientY: number) {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const newS = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newV = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
    commitHsv([h, newS, newV])
  }

  function onSvPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingSv.current = true
    readSvPos(e.clientX, e.clientY)
  }
  function onSvPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingSv.current) return
    readSvPos(e.clientX, e.clientY)
  }
  function onSvPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    draggingSv.current = false
  }

  // ── Hue slider ───────────────────────────────────────────────────────────
  const hueRef = React.useRef<HTMLDivElement>(null)
  const draggingHue = React.useRef(false)

  function readHuePos(clientX: number) {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const newH = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360))
    commitHsv([newH, s, v])
  }

  function onHuePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingHue.current = true
    readHuePos(e.clientX)
  }
  function onHuePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingHue.current) return
    readHuePos(e.clientX)
  }
  function onHuePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    draggingHue.current = false
  }

  // ── Hex text input ───────────────────────────────────────────────────────
  function onHexChange(raw: string) {
    setHexInput(raw)
    const candidate = raw.startsWith("#") ? raw : "#" + raw
    const rgb = hexToRgb(candidate)
    if (rgb) {
      const newHsv = rgbToHsv(...rgb)
      setHsv(newHsv)
      onChange(candidate)
    }
  }

  const thumbSize = 14 // px

  return (
    <Popover.Root>
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          "h-9 w-12 cursor-pointer rounded border border-input transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{ backgroundColor: value }}
        aria-label="Pick color"
      />
      <Popover.Portal container={container}>
        <Popover.Positioner side="bottom" sideOffset={8} positionMethod="fixed" collisionAvoidance={{ side: "flip" }} className="z-[200]">
          <Popover.Popup className="w-56 rounded-xl border border-border bg-popover p-3 shadow-lg outline-none">
            {/* SV gradient square */}
            <div
              ref={svRef}
              className="relative mb-3 h-36 w-full cursor-crosshair select-none overflow-hidden rounded-lg touch-none"
              style={{ backgroundColor: hueHex }}
              onPointerDown={onSvPointerDown}
              onPointerMove={onSvPointerMove}
              onPointerUp={onSvPointerUp}
            >
              {/* white left→right, then black top→bottom */}
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, #000)" }} />
              {/* cursor */}
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{
                  width: thumbSize,
                  height: thumbSize,
                  left: `${s * 100}%`,
                  top: `${(1 - v) * 100}%`,
                  backgroundColor: currentHex,
                }}
              />
            </div>

            {/* Hue slider */}
            <div
              ref={hueRef}
              className="relative mb-3 h-4 w-full cursor-pointer select-none rounded-full touch-none"
              style={{
                background:
                  "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
              }}
              onPointerDown={onHuePointerDown}
              onPointerMove={onHuePointerMove}
              onPointerUp={onHuePointerUp}
            >
              <div
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{
                  width: thumbSize,
                  height: thumbSize,
                  left: `${(h / 360) * 100}%`,
                  backgroundColor: hueHex,
                }}
              />
            </div>

            {/* Hex input */}
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 shrink-0 rounded border border-border"
                style={{ backgroundColor: currentHex }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => onHexChange(e.target.value)}
                spellCheck={false}
                className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                maxLength={7}
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
