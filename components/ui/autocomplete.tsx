"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"

import { cn } from "@/lib/utils"

interface AutocompleteProps {
  items: readonly string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  emptyMessage?: string
}

function Autocomplete({
  items,
  value,
  onValueChange,
  placeholder,
  className,
  emptyMessage = "No matches.",
}: AutocompleteProps) {
  return (
    <AutocompletePrimitive.Root
      items={items}
      value={value}
      onValueChange={(v) => onValueChange(v)}
      mode="none"
      openOnInputClick
    >
      <AutocompletePrimitive.Input
        placeholder={placeholder}
        className={cn(
          "flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
          className
        )}
      />
      <AutocompletePrimitive.Portal>
        <AutocompletePrimitive.Positioner
          side="bottom"
          sideOffset={4}
          collisionAvoidance={{ side: "none" }}
          className="isolate z-50 outline-none"
        >
          <AutocompletePrimitive.Popup className="z-50 max-h-28 w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <AutocompletePrimitive.Empty className="empty:hidden px-1.5 py-1 text-sm text-muted-foreground">
              {emptyMessage}
            </AutocompletePrimitive.Empty>
            <AutocompletePrimitive.List>
              {(item: string) => (
                <AutocompletePrimitive.Item
                  key={item}
                  value={item}
                  onClick={() => onValueChange(item)}
                  className="relative flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  {item}
                </AutocompletePrimitive.Item>
              )}
            </AutocompletePrimitive.List>
          </AutocompletePrimitive.Popup>
        </AutocompletePrimitive.Positioner>
      </AutocompletePrimitive.Portal>
    </AutocompletePrimitive.Root>
  )
}

export { Autocomplete }
